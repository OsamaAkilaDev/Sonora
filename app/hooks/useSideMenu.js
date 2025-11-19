import { create } from "zustand";

export const useSideMenu = create((set) => ({
  isSideMenuActive: true,
  toggleSideMenu: () =>
    set((state) => ({ isSideMenuActive: !state.isSideMenuActive })),
  isCallMenu: false,
  toggleIsCallMenu: () => set((state) => ({ isCallMenu: !state.isCallMenu })),
}));
