import { create } from "zustand";

export const useFriends = create((set) => ({
  friends: [],
  loaded: false,
  setFriends: (friends) => set({ friends: friends }),
  setLoaded: (loaded) => set({ loaded }),
}));
