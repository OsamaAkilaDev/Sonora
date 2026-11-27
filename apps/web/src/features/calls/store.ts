import { type CallInfo, type CallPeer, RING_MS } from "@sonora/shared";
import { create } from "zustand";

/* ── Calls running in your chats (fed by the app socket) ── */

type Ongoing = CallInfo & {
  /** Local clock time ringing stops; avoids trusting that device clocks agree. */
  ringsUntil: number;
};

type CallsState = {
  byChat: Record<string, Ongoing>;
  /** Call ids you've declined or answered here, so they don't ring again. */
  dismissed: Record<string, true>;
};

export const useCalls = create<CallsState>(() => ({ byChat: {}, dismissed: {} }));

const track = (call: CallInfo, prev?: Ongoing): Ongoing => ({
  ...call,
  ringsUntil: !call.ringingUntil
    ? 0
    : prev?.callId === call.callId
      ? prev.ringsUntil
      : Date.now() + RING_MS,
});

export const calls = {
  set(chatId: string, call: CallInfo | null) {
    useCalls.setState((s) => {
      const { [chatId]: prev, ...rest } = s.byChat;
      return { byChat: call ? { ...rest, [chatId]: track(call, prev) } : rest };
    });
  },
  sync(list: CallInfo[]) {
    useCalls.setState((s) => ({
      byChat: Object.fromEntries(list.map((c) => [c.chatId, track(c, s.byChat[c.chatId])])),
    }));
  },
  dismiss(callId: string) {
    useCalls.setState((s) => ({ dismissed: { ...s.dismissed, [callId]: true } }));
  },
};

/* ── The call this tab is in ── */

export type Remote = CallPeer & {
  connection: RTCPeerConnectionState;
  audio?: MediaStreamTrack;
  video?: MediaStreamTrack;
};

export type SessionState = {
  chatId: string | null;
  callId: string | null;
  status: "connecting" | "waiting" | "live" | "reconnecting";
  /** When the first person connected, for the timer. */
  liveAt: number | null;
  muted: boolean;
  camera: boolean;
  screen: boolean;
  /** What you're sending as video: your camera, or the shared screen. */
  preview: MediaStreamTrack | null;
  peers: Record<string, Remote>;
  /** User ids currently talking. */
  speaking: Record<string, boolean>;
  /** Phones only: the full-screen call is tucked into the top bar. */
  minimized: boolean;
};

export const idle: SessionState = {
  chatId: null,
  callId: null,
  status: "connecting",
  liveAt: null,
  muted: false,
  camera: false,
  screen: false,
  preview: null,
  peers: {},
  speaking: {},
  minimized: false,
};

export const useCall = create<SessionState>(() => idle);
