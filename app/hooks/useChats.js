import { create } from "zustand";

export const useChats = create((set) => ({
  chatData: {},
  setChatData: (data) => set({ chatData: data }),

  chatMessages: [],

  setChatMessages: (data) => set({ chatMessages: data }),

  // Merge messages intelligently
  addSentChatMessages: (incomingMessage) =>
    set((state) => {
      const prev = [...state.chatMessages];

      // Find index of message with matching tempId
      const index = prev.findIndex((m) => m.id === incomingMessage.tempId);

      if (index !== -1) {
        // Replace the temp message with the confirmed one
        prev[index] = { ...incomingMessage, isSent: true };
      } else {
        // Append new message
        prev.push({ ...incomingMessage, isSent: true });
        prev.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      // Sort messages by createdAt
      // prev.sort(
      //   (a, b) =>
      //     new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      // );

      return { chatMessages: prev };
    }),

  addUnsentChatMessage: (chatMsg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, chatMsg],
    })),
}));
