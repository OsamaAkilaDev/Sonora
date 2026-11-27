import type { Attachment, ChatSummary, Message, MessagePage } from "@sonora/shared";
import {
  type InfiniteData,
  infiniteQueryOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { play } from "../../lib/sound";

/** A message as the UI holds it: server messages plus local optimistic ones. */
export type LocalMessage = Message & { local?: "sending" | "failed" };
type Pages = InfiniteData<MessagePage & { messages: LocalMessage[] }, string | undefined>;

export const chatsQuery = queryOptions({
  queryKey: ["chats"],
  queryFn: async () => (await unwrap(api.chats.$get())).chats,
});

export const messagesQuery = (chatId: string) =>
  infiniteQueryOptions({
    queryKey: ["messages", chatId],
    queryFn: ({ pageParam }): Promise<MessagePage & { messages: LocalMessage[] }> =>
      unwrap(
        api.chats[":id"].messages.$get({
          param: { id: chatId },
          query: pageParam ? { before: pageParam } : {},
        }),
      ),
    initialPageParam: undefined as string | undefined,
    // pages[0] is the newest page; each next page goes further back in time.
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: Number.POSITIVE_INFINITY, // kept fresh by realtime; refetched on resync
  });

const byRecent = (a: ChatSummary, b: ChatSummary) => b.lastActivityAt - a.lastActivityAt;

/** Cache writers shared by mutations and realtime events. */
export const cache = {
  /** Insert or replace a message (matched by id or by the sender's clientId). */
  upsertMessage(qc: QueryClient, m: LocalMessage) {
    qc.setQueryData<Pages>(["messages", m.chatId], (data) => {
      if (!data) return data;
      const same = (x: LocalMessage) =>
        x.id === m.id || (!!m.clientId && x.clientId === m.clientId);
      const found = data.pages.some((p) => p.messages.some(same));
      const pages = data.pages.map((p) => ({
        ...p,
        messages: found ? p.messages.map((x) => (same(x) ? m : x)) : p.messages,
      }));
      if (!found && pages[0]) pages[0] = { ...pages[0], messages: [...pages[0].messages, m] };
      return { ...data, pages };
    });
  },
  /** Bump a chat to the top with its new last message; count unread for others' messages. */
  touchChat(qc: QueryClient, m: Message, opts: { unread: boolean }) {
    qc.setQueryData<ChatSummary[]>(chatsQuery.queryKey, (list) =>
      list
        ?.map((c) =>
          c.id === m.chatId
            ? {
                ...c,
                lastMessage: m,
                lastActivityAt: Math.max(c.lastActivityAt, m.createdAt),
                unread: opts.unread ? c.unread + 1 : c.unread,
              }
            : c,
        )
        .sort(byRecent),
    );
  },
  addChat(qc: QueryClient, chat: ChatSummary) {
    qc.setQueryData<ChatSummary[]>(chatsQuery.queryKey, (list) =>
      list ? [chat, ...list.filter((c) => c.id !== chat.id)].sort(byRecent) : list,
    );
  },
  /** The cached message, if loaded. */
  getMessage(qc: QueryClient, chatId: string, id: string) {
    return qc
      .getQueryData<Pages>(["messages", chatId])
      ?.pages.flatMap((p) => p.messages)
      .find((m) => m.id === id);
  },
  /** Edits/deletes/reactions: replace the message, and the chat preview if it's the latest. */
  updateMessage(qc: QueryClient, m: LocalMessage) {
    cache.upsertMessage(qc, m);
    qc.setQueryData<ChatSummary[]>(chatsQuery.queryKey, (list) =>
      list?.map((c) => (c.lastMessage?.id === m.id ? { ...c, lastMessage: m } : c)),
    );
  },
  setRead(qc: QueryClient, chatId: string, userId: string, lastReadId: string, me: boolean) {
    qc.setQueryData<ChatSummary[]>(chatsQuery.queryKey, (list) =>
      list?.map((c) =>
        c.id === chatId
          ? { ...c, readBy: { ...c.readBy, [userId]: lastReadId }, unread: me ? 0 : c.unread }
          : c,
      ),
    );
  },
};

export function useSendMessage(chatId: string, meId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: LocalMessage) =>
      unwrap(
        api.chats[":id"].messages.$post({
          param: { id: chatId },
          json: {
            clientId: m.clientId ?? m.id,
            body: m.body,
            replyToId: m.replyToId,
            attachmentIds: m.attachments.map((a) => a.id),
          },
        }),
      ),
    onMutate: (m) => {
      cache.upsertMessage(qc, { ...m, local: "sending" });
      cache.touchChat(qc, m, { unread: false });
      play("send");
    },
    onSuccess: ({ message }) => {
      cache.upsertMessage(qc, message);
      cache.setRead(qc, chatId, meId, message.id, true);
    },
    onError: (_e, m) => {
      cache.upsertMessage(qc, { ...m, local: "failed" });
      play("error");
    },
  });
}

/** Builds the optimistic message; the clientId lets the server's echo replace it. */
export function draftMessage(
  chatId: string,
  senderId: string,
  body: string,
  opts: { replyToId?: string | null; attachments?: Attachment[] } = {},
): LocalMessage {
  const clientId = crypto.randomUUID();
  return {
    id: `local:${clientId}`,
    clientId,
    chatId,
    senderId,
    body,
    replyToId: opts.replyToId ?? null,
    attachments: opts.attachments ?? [],
    reactions: [],
    createdAt: Date.now(),
    editedAt: null,
    deletedAt: null,
  };
}

/**
 * Optimistic message mutation: apply `patch` locally at once, replace with the server's copy on
 * success, restore the previous copy on failure.
 */
function useMessageMutation<V extends { id: string }>(
  chatId: string,
  request: (v: V) => Promise<{ message: Message }>,
  patch: (m: LocalMessage, v: V) => LocalMessage,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onMutate: (v: V) => {
      const prev = cache.getMessage(qc, chatId, v.id);
      if (prev) cache.updateMessage(qc, patch(prev, v));
      return { prev };
    },
    onSuccess: ({ message }) => cache.updateMessage(qc, message),
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) cache.updateMessage(qc, ctx.prev);
      play("error");
    },
  });
}

export const useEditMessage = (chatId: string) =>
  useMessageMutation(
    chatId,
    ({ id, body }: { id: string; body: string }) =>
      unwrap(
        api.chats[":id"].messages[":messageId"].$patch({
          param: { id: chatId, messageId: id },
          json: { body },
        }),
      ),
    (m, { body }) => ({ ...m, body, editedAt: Date.now() }),
  );

export const useDeleteMessage = (chatId: string) =>
  useMessageMutation(
    chatId,
    ({ id }: { id: string }) =>
      unwrap(
        api.chats[":id"].messages[":messageId"].$delete({ param: { id: chatId, messageId: id } }),
      ),
    (m) => ({ ...m, body: "", attachments: [], reactions: [], deletedAt: Date.now() }),
  );

/** Toggles my reaction; the optimistic patch mirrors the server's rule. */
export const useToggleReaction = (chatId: string, meId: string) =>
  useMessageMutation(
    chatId,
    ({ id, emoji }: { id: string; emoji: string }) =>
      unwrap(
        api.chats[":id"].messages[":messageId"].reactions.$put({
          param: { id: chatId, messageId: id },
          json: { emoji },
        }),
      ),
    (m, { emoji }) => ({ ...m, reactions: toggleReaction(m.reactions, emoji, meId) }),
  );

export function toggleReaction(list: Message["reactions"], emoji: string, meId: string) {
  const r = list.find((x) => x.emoji === emoji);
  if (!r) return [...list, { emoji, userIds: [meId] }];
  const userIds = r.userIds.includes(meId)
    ? r.userIds.filter((u) => u !== meId)
    : [...r.userIds, meId];
  return userIds.length
    ? list.map((x) => (x.emoji === emoji ? { ...x, userIds } : x))
    : list.filter((x) => x.emoji !== emoji);
}

export function useMarkRead(chatId: string, meId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lastReadId: string) =>
      unwrap(api.chats[":id"].read.$post({ param: { id: chatId }, json: { lastReadId } })),
    onMutate: (lastReadId) => cache.setRead(qc, chatId, meId, lastReadId, true),
  });
}

export function useOpenDm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unwrap(api.chats.dm.$post({ json: { userId } })),
    onSuccess: ({ chat }) => cache.addChat(qc, chat),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (json: { name: string; memberIds: string[] }) =>
      unwrap(api.chats.group.$post({ json })),
    onSuccess: ({ chat }) => {
      cache.addChat(qc, chat);
      play("success");
    },
    onError: () => play("error"),
  });
}
