import { create } from "zustand";

export const useRequests = create((set) => ({
  requestedRequests: [],
  receievedRequests: [],
  loaded: false,
  setRequestedRequests: (requestedRequests) =>
    set({ requestedRequests: requestedRequests }),
  setReceievedRequests: (receievedRequests) =>
    set({ receievedRequests: receievedRequests }),
  setLoaded: (loaded) => set({ loaded }),
}));
