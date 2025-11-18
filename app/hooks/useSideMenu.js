import { create } from "zustand";

export const useSideMenu = create((set) => ({
  isSideMenuActive: true,
  toggleSideMenu: () =>
    set((state) => ({ isSideMenuActive: !state.isSideMenuActive })),
}));
