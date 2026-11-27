import type { ChatSummary, ServerEvent } from "@sonora/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { play } from "../../lib/sound";
import { notify } from "../../ui/toast";
import { cache, chatsQuery } from "../chats/queries";
import { social, socialQuery } from "../social/queries";
import { startRealtime, stopRealtime } from "./socket";
import { useTyping } from "./typing";

/** Owns the app's socket while signed in and folds server events into the query cache. */
export function useRealtime(meId: string) {
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const openChat = useRef<string | undefined>(undefined);
  openChat.current = path.startsWith("/c/") ? path.slice(3) : undefined;

  useEffect(() => {
    const onEvent = (e: ServerEvent) => {
      switch (e.type) {
        case "message.new": {
          const mine = e.message.senderId === meId;
          const viewing = openChat.current === e.message.chatId && !document.hidden;
          cache.upsertMessage(qc, e.message);
          cache.touchChat(qc, e.message, { unread: !mine && !viewing });
          if (!mine) {
            useTyping.getState().clear(e.message.chatId, e.message.senderId);
            if (!viewing) play("receive");
          }
          break;
        }
        case "message.updated":
          cache.updateMessage(qc, e.message);
          break;
        case "chat.new":
          cache.addChat(qc, e.chat);
          break;
        case "read":
          cache.setRead(qc, e.chatId, e.userId, e.lastReadId, false);
          break;
        case "typing":
          useTyping.getState().mark(e.chatId, e.userId);
          break;
        case "presence": {
          const patch = { presence: e.presence, lastSeenAt: e.lastSeenAt };
          qc.setQueryData(socialQuery.queryKey, (s) =>
            s ? social.presence(s, e.userId, patch) : s,
          );
          qc.setQueryData<ChatSummary[]>(chatsQuery.queryKey, (list) =>
            list?.map((c) => ({
              ...c,
              members: c.members.map((m) => (m.id === e.userId ? { ...m, ...patch } : m)),
            })),
          );
          break;
        }
        case "friend.request":
          qc.setQueryData(socialQuery.queryKey, (s) => (s ? social.addRequest(s, e.request) : s));
          if (e.request.direction === "incoming")
            notify(
              `request:${e.request.user.id}`,
              {
                title: `${e.request.user.username} wants to be friends`,
                description: "Find it under Requests.",
              },
              "receive",
            );
          break;
        case "friend.accepted":
          qc.setQueryData(socialQuery.queryKey, (s) => (s ? social.addFriend(s, e.friend) : s));
          notify(
            `friend:${e.friend.id}`,
            { title: `You and ${e.friend.username} are friends`, description: "Say hi." },
            "success",
          );
          break;
        case "friend.removed":
          qc.setQueryData(socialQuery.queryKey, (s) => (s ? social.remove(s, e.userId) : s));
          break;
      }
    };
    // After a drop, refetch what may have changed instead of replaying missed events.
    const onResync = () => {
      qc.invalidateQueries({ queryKey: chatsQuery.queryKey });
      qc.invalidateQueries({ queryKey: socialQuery.queryKey });
      qc.invalidateQueries({ queryKey: ["messages"] });
    };
    startRealtime({ onEvent, onResync });
    return stopRealtime;
  }, [qc, meId]);
}
