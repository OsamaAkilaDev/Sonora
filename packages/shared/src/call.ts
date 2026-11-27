import { z } from "zod";

/** Mesh calls: every participant connects to every other, so the room stays small. */
export const MAX_CALL_PEERS = 6;
/** How long an unanswered call rings. */
export const RING_MS = 30_000;

/**
 * STUN only: it tells each device its public address so peers can connect directly.
 * ponytail: no TURN relay, so strict firewalls and some mobile networks can't connect.
 * Adding a TURN provider means appending its credentials here (minted by the API).
 */
export const ICE_SERVERS = [{ urls: "stun:stun.cloudflare.com:3478" }];

/** A call in progress, as every chat member sees it. */
export type CallInfo = {
  chatId: string;
  callId: string;
  video: boolean;
  startedBy: string;
  startedAt: number;
  /** When ringing stops (server ms). 0 once answered or timed out. */
  ringingUntil: number;
  /** Users currently connected. */
  userIds: string[];
};

export type CallEndReason = "ended" | "declined" | "no_answer";

export type MediaState = { muted: boolean; camera: boolean; screen: boolean };
export type CallPeer = MediaState & { peerId: string; userId: string };

export type Signal =
  | { description: { type: "offer" | "answer"; sdp: string } }
  | {
      candidate: {
        candidate?: string;
        sdpMid?: string | null;
        sdpMLineIndex?: number | null;
        usernameFragment?: string | null;
      };
    };

/** CallRoom → client, over /api/calls/:chatId/ws. */
export type RoomEvent =
  | { type: "welcome"; call: CallInfo; peerId: string; peers: CallPeer[] }
  | { type: "peer.join"; peer: CallPeer }
  | { type: "peer.leave"; peerId: string }
  | { type: "peer.media"; peer: CallPeer }
  | { type: "signal"; from: string; signal: Signal }
  /** The server is closing this socket. "gone": the call you asked to join is over. */
  | { type: "end"; reason: CallEndReason | "full" | "replaced" | "gone" };

/** Client → CallRoom. */
export type RoomMessage =
  | { type: "signal"; to: string; signal: Signal }
  | ({ type: "media" } & MediaState)
  | { type: "leave" };

/** Decline a ringing call. */
export const declineCallInput = z.object({ callId: z.string().max(40) });
