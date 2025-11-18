import { create } from "zustand";

export const useChats = create((set) => ({
  activeChatId: null,
  chats: [],
  loaded: false,
  setActiveChatId: (chatId) => set({ activeChatId: chatId }),
  setChats: (chats) => set({ chats: chats }),
  setLoaded: (loaded) => set({ loaded }),
}));

// useChats.getState().fetchChats();
