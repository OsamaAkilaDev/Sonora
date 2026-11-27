import { create } from "zustand";

/** Per-chat composer mode, shared by message actions (Reply, Edit) and the composer. */
type Mode = { kind: "reply" | "edit"; messageId: string } | null;

type ComposeState = {
  byChat: Record<string, Mode>;
  set: (chatId: string, mode: Mode) => void;
};

export const useCompose = create<ComposeState>((set) => ({
  byChat: {},
  set: (chatId, mode) => set((s) => ({ byChat: { ...s.byChat, [chatId]: mode } })),
}));

export const useComposeMode = (chatId: string) => useCompose((s) => s.byChat[chatId] ?? null);
export const setComposeMode = (chatId: string, mode: Mode) =>
  useCompose.getState().set(chatId, mode);
