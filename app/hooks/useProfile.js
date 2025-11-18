import { create } from "zustand";

export const useProfile = create((set) => ({
  isProfileActive: true,
  toggleIsProfileActive: () =>
    set((state) => ({ toggleIsProfileActive: !state.toggleIsProfileActive })),
}));
