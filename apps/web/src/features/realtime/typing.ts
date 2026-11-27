import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { send } from "./socket";

const TTL = 4000; // an indicator lives this long without a fresh event
const THROTTLE = 3000; // we announce our own typing at most this often

type TypingState = {
  /** chatId → userId → expiry (ms) */
  byChat: Record<string, Record<string, number>>;
  mark: (chatId: string, userId: string) => void;
  clear: (chatId: string, userId: string) => void;
};

export const useTyping = create<TypingState>((set) => ({
  byChat: {},
  mark: (chatId, userId) => {
    set((s) => ({
      byChat: { ...s.byChat, [chatId]: { ...s.byChat[chatId], [userId]: Date.now() + TTL } },
    }));
    setTimeout(() => {
      const exp = useTyping.getState().byChat[chatId]?.[userId];
      if (exp && exp <= Date.now()) useTyping.getState().clear(chatId, userId);
    }, TTL + 50);
  },
  clear: (chatId, userId) =>
    set((s) => {
      const { [userId]: _, ...rest } = s.byChat[chatId] ?? {};
      return { byChat: { ...s.byChat, [chatId]: rest } };
    }),
}));

/** Ids of people currently typing in a chat. */
export const useTypingIn = (chatId: string) =>
  useTyping(useShallow((s) => Object.keys(s.byChat[chatId] ?? {})));

const lastSent: Record<string, number> = {};
export function announceTyping(chatId: string) {
  const now = Date.now();
  if (now - (lastSent[chatId] ?? 0) < THROTTLE) return;
  lastSent[chatId] = now;
  send({ type: "typing", chatId });
}
