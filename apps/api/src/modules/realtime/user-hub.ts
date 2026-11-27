import { DurableObject } from "cloudflare:workers";
import type { ClientEvent, ServerEvent } from "@sonora/shared";
import { and, eq, or } from "drizzle-orm";
import { createDb } from "../../core/db";
import { chatMembers, friendships, users } from "../../db/schema";
import { toPublicUser } from "../users/users.service";
import { publish } from "./publish";

export const USER_HEADER = "x-sonora-user";

/**
 * One instance per user (addressed by user id). Holds every socket that user has open
 * (tabs, phone, desktop) via WebSocket Hibernation, so idle connections cost nothing.
 * Only reachable through the authenticated /api/ws route, which sets USER_HEADER.
 */
export class UserHub extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Keep-alive answered by the runtime without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  override async fetch(req: Request) {
    const userId = req.headers.get(USER_HEADER);
    if (!userId) return new Response("Forbidden", { status: 403 });
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ userId });
    if (this.ctx.getWebSockets().length === 1) await this.setConnected(userId, true);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** RPC: deliver an event to all of this user's open sockets. */
  async publish(event: ServerEvent) {
    const data = JSON.stringify(event);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch {}
    }
  }

  override async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== "string" || raw.length > 2000) return;
    let event: ClientEvent;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    if (event.type === "typing" && typeof event.chatId === "string") {
      const { userId } = ws.deserializeAttachment() as { userId: string };
      await this.relayTyping(userId, event.chatId);
    }
  }

  override async webSocketClose(ws: WebSocket) {
    await this.onSocketGone(ws);
  }

  override async webSocketError(ws: WebSocket) {
    await this.onSocketGone(ws);
  }

  private async onSocketGone(ws: WebSocket) {
    const { userId } = ws.deserializeAttachment() as { userId: string };
    const open = this.ctx
      .getWebSockets()
      .filter((s) => s !== ws && s.readyState === WebSocket.OPEN);
    if (open.length === 0) await this.setConnected(userId, false);
  }

  /** Typing is ephemeral: never stored, only relayed to the chat's other members. */
  private async relayTyping(userId: string, chatId: string) {
    const db = createDb(this.env.DB);
    const members = await db
      .select({ userId: chatMembers.userId })
      .from(chatMembers)
      .where(eq(chatMembers.chatId, chatId))
      .all();
    if (!members.some((m) => m.userId === userId)) return; // not a member: ignore
    await publish(
      this.env,
      members.map((m) => m.userId).filter((id) => id !== userId),
      { type: "typing", chatId, userId },
    );
  }

  /** First socket in / last socket out: persist presence and tell friends. */
  private async setConnected(userId: string, connected: boolean) {
    const db = createDb(this.env.DB);
    const [user] = await db
      .update(users)
      .set({ connected, lastSeenAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) return;
    const pairs = await db
      .select({ a: friendships.userA, b: friendships.userB })
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(eq(friendships.userA, userId), eq(friendships.userB, userId)),
        ),
      )
      .all();
    const pub = toPublicUser(user);
    await publish(
      this.env,
      pairs.map((p) => (p.a === userId ? p.b : p.a)),
      { type: "presence", userId, presence: pub.presence, lastSeenAt: pub.lastSeenAt },
    );
  }
}
