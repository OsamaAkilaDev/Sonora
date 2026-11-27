import { ICE_SERVERS, type RoomEvent, type RoomMessage, type Signal } from "@sonora/shared";
import { play, type SoundName } from "../../lib/sound";
import { notify } from "../../ui/toast";
import { canShareScreen, deviceError, openCamera, openMic, useDevicePrefs } from "./devices";
import { watchSpeaking } from "./meter";
import { calls, idle, type Remote, type SessionState, useCall } from "./store";

/** One transceiver per slot, always in this order, so both sides know which video is which. */
const SLOTS = ["audio", "camera", "screen"] as const;
type Slot = (typeof SLOTS)[number];
const remoteKey = { audio: "audio", camera: "cameraTrack", screen: "screenTrack" } as const;
type Peer = {
  pc: RTCPeerConnection;
  /** Signals are applied one at a time, in arrival order. */
  queue: Promise<unknown>;
  stopMeter?: () => void;
};

const MAX_RETRIES = 5;
const endMessages: Partial<Record<Extract<RoomEvent, { type: "end" }>["reason"], string>> = {
  declined: "Call declined",
  no_answer: "No answer",
  full: "This call is full",
  replaced: "Call moved to your other tab or device",
  gone: "That call has ended",
};

/**
 * One call in this tab: local media, the room socket, and a peer connection to everyone else.
 * Whoever joins later makes the offers, so two sides never negotiate at once. Mute, camera,
 * screen and device changes swap tracks in place and need no renegotiation.
 */
class Session {
  private ws?: WebSocket;
  private peers = new Map<string, Peer>();
  private mic: MediaStreamTrack | null = null;
  private cam: MediaStreamTrack | null = null;
  private screen: MediaStreamTrack | null = null;
  private stopMicMeter?: () => void;
  private unwatchDevices?: () => void;
  private ping?: ReturnType<typeof setInterval>;
  private retry?: ReturnType<typeof setTimeout>;
  private retries = 0;
  private busy = false;
  closed = false;

  constructor(
    readonly chatId: string,
    private meId: string,
  ) {}

  async start(video: boolean, callId?: string) {
    // A missing microphone still lets you join and listen.
    await this.setMic().catch((e) =>
      notify("mic", { title: "You're muted", description: deviceError(e, "microphone") }, "error"),
    );
    if (!this.mic) useCall.setState({ muted: true });
    if (video) await this.setCamera(true);
    if (this.closed) return this.stopMedia();
    this.unwatchDevices = useDevicePrefs.subscribe((next, prev) => {
      const audioChanged =
        next.mic !== prev.mic ||
        next.noiseSuppression !== prev.noiseSuppression ||
        next.echoCancellation !== prev.echoCancellation ||
        next.autoGain !== prev.autoGain;
      if (audioChanged) void this.setMic().catch(() => {});
      if (next.camera !== prev.camera && this.cam) void this.setCamera(true);
    });
    this.connect(video, callId);
  }

  /* ── Controls ── */

  toggleMute = () =>
    this.exclusive(async () => {
      let muted = !useCall.getState().muted;
      if (!this.mic) {
        // Retry the microphone: permission may have been granted since.
        await this.setMic().catch((e) =>
          notify("mic", { title: "Still muted", description: deviceError(e, "microphone") }),
        );
        muted = false;
      }
      const mic = this.mic as MediaStreamTrack | null;
      if (!mic) return;
      mic.enabled = !muted;
      this.patchMedia({ muted });
    });

  toggleCamera = () => this.exclusive(() => this.setCamera(!this.cam));

  toggleScreen = () =>
    this.exclusive(async () => {
      if (this.screen) return this.stopScreen();
      if (!canShareScreen()) return;
      let track: MediaStreamTrack | undefined;
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        track = stream.getVideoTracks()[0];
      } catch {
        return; // they closed the picker
      }
      if (!track || this.closed) return track?.stop();
      track.contentHint = "detail"; // keep text sharp over smooth motion
      track.onended = () => this.stopScreen(); // the browser's own "Stop sharing" button
      this.screen = track;
      await this.sendVideo("screen");
    });

  leave() {
    this.send({ type: "leave" });
    this.close();
  }

  /* ── Local media ── */

  private async exclusive(fn: () => Promise<unknown> | unknown) {
    if (this.busy) return;
    this.busy = true;
    try {
      await fn();
    } finally {
      this.busy = false;
    }
  }

  private async setMic() {
    const track = await openMic();
    if (this.closed) return track.stop();
    track.enabled = !useCall.getState().muted;
    this.mic?.stop();
    this.mic = track;
    // Unplugged mid-call: move to whatever microphone is left.
    track.onended = () => void this.setMic().catch(() => this.patchMedia({ muted: true }));
    this.stopMicMeter?.();
    this.stopMicMeter = watchSpeaking(track, (on) =>
      this.setSpeaking(this.meId, on && track.enabled),
    );
    await this.replace("audio");
  }

  private async setCamera(on: boolean) {
    let next: MediaStreamTrack | null = null;
    if (on) {
      try {
        next = await openCamera();
      } catch (e) {
        notify(
          "camera",
          { title: "Camera is off", description: deviceError(e, "camera") },
          "error",
        );
        return;
      }
      if (this.closed) return next.stop();
    }
    this.cam?.stop();
    this.cam = next;
    await this.sendVideo("camera");
  }

  private stopScreen() {
    this.screen?.stop();
    this.screen = null;
    void this.sendVideo("screen");
  }

  private async sendVideo(slot: "camera" | "screen") {
    if (this.closed) return;
    this.patchMedia(
      { camera: !!this.cam, screen: !!this.screen },
      { cameraTrack: this.cam, screenTrack: this.screen },
    );
    await this.replace(slot);
  }

  private outgoing(slot: Slot) {
    return slot === "audio" ? this.mic : slot === "camera" ? this.cam : this.screen;
  }

  private async replace(slot: Slot) {
    await Promise.all(
      [...this.peers.values()].map(({ pc }) =>
        this.sender(pc, slot)?.replaceTrack(this.outgoing(slot)),
      ),
    );
  }

  private sender(pc: RTCPeerConnection, slot: Slot) {
    return pc.getTransceivers()[SLOTS.indexOf(slot)]?.sender;
  }

  private patchMedia(
    media: Partial<{ muted: boolean; camera: boolean; screen: boolean }>,
    local: Partial<Pick<SessionState, "cameraTrack" | "screenTrack">> = {},
  ) {
    if (this.closed) return;
    useCall.setState({ ...media, ...local, ...(this.mic ? {} : { muted: true }) });
    this.announceMedia();
  }

  private announceMedia() {
    const { muted, camera, screen } = useCall.getState();
    this.send({ type: "media", muted: muted || !this.mic, camera, screen });
  }

  private setSpeaking(userId: string, on: boolean) {
    if (this.closed) return;
    useCall.setState((s) => ({ speaking: { ...s.speaking, [userId]: on } }));
  }

  /* ── Signaling ── */

  private connect(video: boolean, callId?: string) {
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    const query = new URLSearchParams({ video: video ? "1" : "0" });
    if (callId) query.set("callId", callId);
    const ws = new WebSocket(`${scheme}://${location.host}/api/calls/${this.chatId}/ws?${query}`);
    this.ws = ws;
    ws.onopen = () => {
      clearInterval(this.ping);
      this.ping = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send("ping"), 20_000);
    };
    ws.onmessage = (m) => {
      if (m.data !== "pong" && this.ws === ws) this.onRoom(JSON.parse(m.data));
    };
    ws.onclose = () => {
      if (this.closed || this.ws !== ws) return;
      // Lost the room: rejoin the same call. Never silently start a new one.
      const id = useCall.getState().callId ?? callId;
      if (this.retries >= MAX_RETRIES) {
        notify(
          "call",
          { title: "Call dropped", description: "Check your connection and call again." },
          "error",
        );
        return this.close();
      }
      useCall.setState({ status: "reconnecting" });
      this.retry = setTimeout(() => this.connect(video, id), 800 * 2 ** this.retries++);
    };
  }

  private send(msg: RoomMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  private onRoom(event: RoomEvent) {
    switch (event.type) {
      case "welcome": {
        this.retries = 0;
        calls.dismiss(event.call.callId);
        for (const id of [...this.peers.keys()]) this.removePeer(id);
        useCall.setState({ callId: event.call.callId, status: "waiting" });
        for (const p of event.peers) this.addPeer(p, true);
        this.announceMedia();
        break;
      }
      case "peer.join":
        this.addPeer(event.peer, false);
        this.cue("join");
        break;
      case "peer.leave":
        if (this.removePeer(event.peerId)) this.cue("leave");
        break;
      case "peer.media":
        this.patchPeer(event.peer.peerId, event.peer);
        break;
      case "signal": {
        const peer = this.peers.get(event.from);
        if (peer)
          peer.queue = peer.queue
            .then(() => this.onSignal(event.from, peer, event.signal))
            .catch((e) => console.warn("signal", e));
        break;
      }
      case "end": {
        const title = endMessages[event.reason];
        if (title) notify(`call:${event.reason}`, { title });
        this.cue("leave");
        this.close();
        break;
      }
    }
  }

  private cue(sound: SoundName) {
    play(sound, { background: true });
  }

  /* ── Peers ── */

  private addPeer(info: Omit<Remote, "connection">, offerer: boolean) {
    const id = info.peerId;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const peer: Peer = { pc, queue: Promise.resolve() };
    this.peers.set(id, peer);
    useCall.setState((s) => ({ peers: { ...s.peers, [id]: { ...info, connection: "new" } } }));

    pc.onicecandidate = (e) => {
      if (e.candidate)
        this.send({ type: "signal", to: id, signal: { candidate: e.candidate.toJSON() } });
    };
    pc.ontrack = ({ track, transceiver }) => {
      const slot = SLOTS[pc.getTransceivers().indexOf(transceiver)];
      if (!slot) return;
      this.patchPeer(id, { [remoteKey[slot]]: track });
      if (slot === "audio") {
        peer.stopMeter?.();
        peer.stopMeter = watchSpeaking(track, (on) => this.setSpeaking(info.userId, on));
      }
    };
    pc.onconnectionstatechange = () => {
      this.patchPeer(id, { connection: pc.connectionState });
      if (pc.connectionState === "connected") {
        useCall.setState((s) => ({ status: "live", liveAt: s.liveAt ?? Date.now() }));
        this.limitBitrate();
      }
      if (pc.connectionState === "failed" && offerer) pc.restartIce();
    };

    if (offerer) {
      pc.onnegotiationneeded = async () => {
        await pc.setLocalDescription();
        this.sendDescription(id, pc);
      };
      for (const slot of SLOTS) {
        const kind = slot === "audio" ? "audio" : "video";
        pc.addTransceiver(this.outgoing(slot) ?? kind, { direction: "sendrecv" });
      }
    }
  }

  private async onSignal(id: string, { pc }: Peer, signal: Signal) {
    if (!("description" in signal)) {
      await pc.addIceCandidate(signal.candidate).catch(() => {});
      return;
    }
    await pc.setRemoteDescription(signal.description);
    if (signal.description.type !== "offer") return;
    // Answering: send our tracks on the transceivers the offer created.
    for (const [i, t] of pc.getTransceivers().entries()) {
      const slot = SLOTS[i];
      if (!slot) continue;
      t.direction = "sendrecv";
      await t.sender.replaceTrack(this.outgoing(slot));
    }
    await pc.setLocalDescription();
    this.sendDescription(id, pc);
  }

  private sendDescription(to: string, pc: RTCPeerConnection) {
    const d = pc.localDescription;
    if (!d || (d.type !== "offer" && d.type !== "answer")) return;
    this.send({
      type: "signal",
      to,
      signal: { description: { type: d.type, sdp: d.sdp } },
    });
  }

  /** In a mesh you upload one copy per person, so each copy shrinks as the call grows. */
  private limitBitrate() {
    const group = this.peers.size > 1;
    const limits = { camera: group ? 500_000 : 1_500_000, screen: group ? 1_200_000 : 2_500_000 };
    for (const { pc } of this.peers.values()) {
      for (const slot of ["camera", "screen"] as const) {
        const sender = this.sender(pc, slot);
        const params = sender?.getParameters();
        if (!sender || !params?.encodings?.length) continue;
        for (const e of params.encodings) e.maxBitrate = limits[slot];
        void sender.setParameters(params).catch(() => {});
      }
    }
  }

  private patchPeer(id: string, patch: Partial<Remote>) {
    useCall.setState((s) => {
      const peer = s.peers[id];
      return peer ? { peers: { ...s.peers, [id]: { ...peer, ...patch } } } : s;
    });
  }

  private removePeer(id: string) {
    const peer = this.peers.get(id);
    if (!peer) return false;
    peer.stopMeter?.();
    peer.pc.close();
    this.peers.delete(id);
    useCall.setState((s) => {
      const { [id]: gone, ...peers } = s.peers;
      return {
        peers,
        status: Object.keys(peers).length ? s.status : "waiting",
        speaking: gone ? { ...s.speaking, [gone.userId]: false } : s.speaking,
      };
    });
    return true;
  }

  /* ── Teardown ── */

  private stopMedia() {
    this.stopMicMeter?.();
    for (const t of [this.mic, this.cam, this.screen]) t?.stop();
    this.mic = this.cam = this.screen = null;
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.ping);
    clearTimeout(this.retry);
    this.unwatchDevices?.();
    for (const id of [...this.peers.keys()]) this.removePeer(id);
    this.stopMedia();
    this.ws?.close();
    if (session === this) {
      session = undefined;
      useCall.setState(idle, true);
    }
  }
}

let session: Session | undefined;

/** Starts the chat's call, or joins the one running. Leaves any other call first. */
export function joinCall(chatId: string, meId: string, video: boolean, callId?: string) {
  if (session?.chatId === chatId) {
    useCall.setState({ minimized: false });
    return;
  }
  session?.leave();
  if (!navigator.mediaDevices || !window.RTCPeerConnection) {
    notify("call", { title: "This browser can't make calls" }, "error");
    return;
  }
  session = new Session(chatId, meId);
  useCall.setState({ ...idle, chatId }, true);
  void session.start(video, callId);
}

export const leaveCall = () => session?.leave();
export const toggleMute = () => session?.toggleMute();
export const toggleCamera = () => session?.toggleCamera();
export const toggleScreen = () => session?.toggleScreen();
