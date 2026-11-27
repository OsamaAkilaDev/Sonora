import { z } from "zod";
import { username } from "./auth";
import type { UserStatus } from "./users";

/** Status as others see it: invisible and disconnected both read as offline. */
export type Presence = Exclude<UserStatus, "invisible"> | "offline";

export type PublicUser = {
  id: string;
  username: string;
  avatarSeed: string;
  about: string;
  presence: Presence;
  /** When they were last connected (ms). Null while online. */
  lastSeenAt: number | null;
};

export type FriendRequest = {
  user: PublicUser;
  direction: "incoming" | "outgoing";
  createdAt: number;
};

export type Attachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  /** Known for images/video so the layout reserves space before the file loads. */
  width: number | null;
  height: number | null;
  /** Same-origin, membership-checked: /api/files/:id */
  url: string;
};

export type Reaction = { emoji: string; userIds: string[] };

export type Message = {
  id: string; // ULID: time-sortable, doubles as the pagination cursor
  chatId: string;
  senderId: string;
  /** Client-generated id for optimistic sends; lets the sender merge the echo. */
  clientId: string | null;
  /** Empty for deleted messages, or attachment-only ones. */
  body: string;
  replyToId: string | null;
  attachments: Attachment[];
  /** In first-reacted order. */
  reactions: Reaction[];
  createdAt: number;
  editedAt: number | null;
  /** Soft delete: the message stays as a tombstone ("Message deleted") so threads keep their shape. */
  deletedAt: number | null;
};

export type SearchHit = { message: Message; chatId: string };

export type ChatSummary = {
  id: string;
  kind: "dm" | "group";
  /** Group name; null for DMs (the UI shows the other person). */
  name: string | null;
  /** All members, including the viewer. */
  members: PublicUser[];
  lastMessage: Message | null;
  /** Last message time, or creation time for a chat with none yet. Sorts the list. */
  lastActivityAt: number;
  /** Messages from others after the viewer's read marker. */
  unread: number;
  /** Per member: the last message id they've read (for "Seen"). */
  readBy: Record<string, string | null>;
};

export type MessagePage = { messages: Message[]; nextCursor: string | null };

/** Server → client over /api/ws. */
export type ServerEvent =
  | { type: "message.new"; message: Message }
  /** Edits, deletes and reaction changes all ship the whole message. */
  | { type: "message.updated"; message: Message }
  | { type: "chat.new"; chat: ChatSummary }
  | { type: "typing"; chatId: string; userId: string }
  | { type: "read"; chatId: string; userId: string; lastReadId: string }
  | { type: "presence"; userId: string; presence: Presence; lastSeenAt: number | null }
  | { type: "friend.request"; request: FriendRequest }
  | { type: "friend.accepted"; friend: PublicUser }
  | { type: "friend.removed"; userId: string };

/** Client → server over /api/ws. */
export type ClientEvent = { type: "typing"; chatId: string } | { type: "ping" };

export const MAX_GROUP_MEMBERS = 10;
export const MESSAGE_MAX = 4000;
export const PAGE_SIZE = 50;

export const friendRequestInput = z.object({ username });

export const MAX_ATTACHMENTS = 10;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
/** Upload allowlist: exact types, or a family prefix ending in "/". */
export const UPLOAD_TYPES = [
  "image/",
  "video/mp4",
  "video/webm",
  "audio/",
  "application/pdf",
  "text/plain",
  "application/zip",
];
/** SVG is excluded: it's a document that can carry scripts, not a picture. */
export const uploadAllowed = (mime: string) =>
  mime !== "image/svg+xml" &&
  UPLOAD_TYPES.some((t) => (t.endsWith("/") ? mime.startsWith(t) : mime === t));

export const sendMessageInput = z
  .object({
    clientId: z.string().min(10).max(40),
    body: z.string().trim().max(MESSAGE_MAX),
    replyToId: z.string().max(40).nullish(),
    attachmentIds: z.array(z.string().max(40)).max(MAX_ATTACHMENTS).default([]),
  })
  .refine((m) => m.body.length > 0 || m.attachmentIds.length > 0, {
    message: "Write something first",
    path: ["body"],
  });

export const editMessageInput = z.object({
  body: z.string().trim().min(1, "A message can't be empty").max(MESSAGE_MAX),
});

/** One emoji (allowing modifiers/ZWJ sequences); 32 chars caps flag/family sequences. */
export const reactInput = z.object({ emoji: z.string().min(1).max(32) });

export const searchQuery = z.object({ q: z.string().trim().min(2).max(100) });

export const createGroupInput = z.object({
  name: z.string().trim().min(1, "Name the group").max(50),
  memberIds: z
    .array(z.string().max(40))
    .min(1)
    .max(MAX_GROUP_MEMBERS - 1),
});

export const openDmInput = z.object({ userId: z.string().max(40) });
export const markReadInput = z.object({ lastReadId: z.string().max(40) });

export type SendMessageInput = z.infer<typeof sendMessageInput>;
