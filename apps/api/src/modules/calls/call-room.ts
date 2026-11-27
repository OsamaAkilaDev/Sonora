import { DurableObject } from "cloudflare:workers";
import {
  type CallEndReason,
  type CallInfo,
  type CallPeer,
  MAX_CALL_PEERS,
  RING_MS,
  type RoomEvent,
  type RoomMessage,
} from "@sonora/shared";
import { ulid } from "ulid";
import { publish } from "../realtime/publish";

/** Set by the calls route after it has checked the session and chat membership. */
export const JOIN_HEADER = "x-sonora-join";
export type Join = {
  userId: string;
  chatId: string;
  kind: "dm" | "group";
  memberIds: string[];
  video: boolean;
  /** Only join this exact call (the "Join" button and reconnects); never start a new one. */
  callId: string | null;
};

type Room = Omit<CallInfo, "userIds"> & {
  kind: Join["kind"];
  memberIds: string[];
  answered: boolean;
  /** A DM with only one person in it ends after this. */
  deadline: number;
};

/** What each socket carries. `gone` marks one we already removed from the call. */
type Seat = CallPeer & { gone?: boolean };

/** How often a running call checks that someone is still connected. */
const SWEEP_MS = 60_000;

/**
 * One per chat. The open sockets are the participants, so a closed tab leaves the call
 * by itself. Relays WebRTC signaling; audio and video never pass through here.
 */
export class CallRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  override async fetch(req: Request) {
    const header = req.headers.get(JOIN_HEADER);
    if (!header) return new Response("Forbidden", { status: 403 });
    const join: Join = JSON.parse(header);
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    const upgraded = new Response(null, { status: 101, webSocket: client });

    let room = await this.ctx.storage.get<Room>("room");
    const others = this.seats().filter((s) => s.seat.userId !== join.userId);
    const refusal =
      join.callId && room?.callId !== join.callId
        ? "gone"
        : others.length >= MAX_CALL_PEERS
          ? "full"
          : null;
    if (refusal) {
      this.drop(server, refusal);
      return upgraded;
    }

    const now = Date.now();
    room ??= {
      chatId: join.chatId,
      callId: ulid(),
      kind: join.kind,
      memberIds: join.memberIds,
      video: join.video,
      startedBy: join.userId,
      startedAt: now,
      ringingUntil: now + RING_MS,
      answered: false,
      deadline: now + RING_MS,
    };
    // One seat per person: joining from a second tab or device moves the call there.
    for (const { ws, seat } of this.seats()) {
      if (seat.userId !== join.userId) continue;
      this.drop(ws, "replaced");
      this.broadcast({ type: "peer.leave", peerId: seat.peerId });
    }

    const me: CallPeer = {
      peerId: crypto.randomUUID(),
      userId: join.userId,
      muted: false,
      camera: false,
      screen: false,
    };
    server.serializeAttachment(me);
    if (others.length) room.answered = true;
    await this.ctx.storage.put("room", room);
    await this.ctx.storage.setAlarm(room.answered ? now + SWEEP_MS : room.deadline);

    this.send(server, {
      type: "welcome",
      call: this.info(room),
      peerId: me.peerId,
      peers: others.map((o) => o.seat),
    });
    this.broadcast({ type: "peer.join", peer: me }, server);
    await this.announce(room);
    return upgraded;
  }

  /** RPC: a ringing DM call is declined by the other person. */
  async decline(userId: string, callId: string) {
    const room = await this.ctx.storage.get<Room>("room");
    // In a group, declining only silences your own ringing (handled by the client).
    if (room?.callId !== callId || room.kind !== "dm" || room.answered) return;
    if (userId !== room.startedBy && room.memberIds.includes(userId))
      await this.end(room, "declined");
  }

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const me = ws.deserializeAttachment() as Seat | null;
    if (!me || me.gone || typeof raw !== "string" || raw.length > 64_000) return;
    let msg: RoomMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.type === "signal") {
      const target = this.seats().find((s) => s.seat.peerId === msg.to);
      if (target) this.send(target.ws, { type: "signal", from: me.peerId, signal: msg.signal });
    } else if (msg.type === "media") {
      const next: Seat = { ...me, muted: !!msg.muted, camera: !!msg.camera, screen: !!msg.screen };
      ws.serializeAttachment(next);
      this.broadcast({ type: "peer.media", peer: next }, ws);
    } else if (msg.type === "leave") {
      await this.leave(ws, true);
    }
  }

  override async webSocketClose(ws: WebSocket) {
    await this.leave(ws, false);
  }

  override async webSocketError(ws: WebSocket) {
    await this.leave(ws, false);
  }

  override async alarm() {
    const room = await this.ctx.storage.get<Room>("room");
    if (!room) return;
    const count = this.seats().length;
    const now = Date.now();
    const alone = room.kind === "dm" && count < 2;
    if (count === 0 || (alone && now >= room.deadline))
      return this.end(room, room.answered ? "ended" : "no_answer");
    const ringingOver = room.ringingUntil && now >= room.ringingUntil;
    if (ringingOver) room.ringingUntil = 0;
    await this.ctx.storage.put("room", room);
    await this.ctx.storage.setAlarm(alone ? room.deadline : now + SWEEP_MS);
    if (ringingOver) await this.announce(room);
  }

  /** `deliberate`: they pressed Leave, as opposed to losing the connection (may come back). */
  private async leave(ws: WebSocket, deliberate: boolean) {
    const me = ws.deserializeAttachment() as Seat | null;
    if (!me || me.gone) return;
    this.drop(ws);
    this.broadcast({ type: "peer.leave", peerId: me.peerId });
    const room = await this.ctx.storage.get<Room>("room");
    if (!room) return;
    const left = this.seats().length;
    // Hanging up ends a one-to-one call for both sides.
    if (left === 0 || (deliberate && room.kind === "dm")) return this.end(room, "ended");
    if (room.kind === "dm") {
      room.deadline = Date.now() + RING_MS;
      await this.ctx.storage.put("room", room);
      await this.ctx.storage.setAlarm(room.deadline);
    }
    await this.announce(room);
  }

  private async end(room: Room, reason: CallEndReason) {
    for (const { ws } of this.seats()) this.drop(ws, reason);
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
    await publish(this.env, room.memberIds, {
      type: "call.state",
      chatId: room.chatId,
      call: null,
      reason,
    });
  }

  private announce(room: Room) {
    return publish(this.env, room.memberIds, {
      type: "call.state",
      chatId: room.chatId,
      call: this.info(room),
    });
  }

  private info(room: Room): CallInfo {
    const { chatId, callId, video, startedBy, startedAt } = room;
    return {
      chatId,
      callId,
      video,
      startedBy,
      startedAt,
      ringingUntil: room.answered ? 0 : room.ringingUntil,
      userIds: this.seats().map((s) => s.seat.userId),
    };
  }

  private seats() {
    return this.ctx.getWebSockets().flatMap((ws) => {
      const seat = ws.deserializeAttachment() as Seat | null;
      return seat && !seat.gone && ws.readyState === WebSocket.OPEN ? [{ ws, seat }] : [];
    });
  }

  private drop(ws: WebSocket, reason?: Extract<RoomEvent, { type: "end" }>["reason"]) {
    const seat = ws.deserializeAttachment() as Seat | null;
    ws.serializeAttachment({ ...seat, gone: true });
    if (reason) this.send(ws, { type: "end", reason });
    try {
      ws.close(1000, reason);
    } catch {}
  }

  private send(ws: WebSocket, event: RoomEvent) {
    try {
      ws.send(JSON.stringify(event));
    } catch {}
  }

  private broadcast(event: RoomEvent, except?: WebSocket) {
    for (const { ws } of this.seats()) if (ws !== except) this.send(ws, event);
  }
}
