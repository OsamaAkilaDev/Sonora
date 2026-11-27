import { useCanGoBack, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { phoneTab, type Tab, tabMove } from "./tabs";

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** The entry below this one is the Chats tab. */
    fromChats?: boolean;
  }
}

export const useUrlTab = () => useSearch({ from: "/_app" }).tab;

/** Switch tabs on a phone. Returns "top" when the tab was already open. */
export function useGoTab() {
  const router = useRouter();
  const navigate = useNavigate();
  const urlTab = useUrlTab();
  return (next: Tab) => {
    const move = tabMove(phoneTab(urlTab), next, !!router.state.location.state.fromChats);
    if (move === "top") return move;
    if (move === "back") return router.history.back();
    void navigate({
      to: ".",
      search: (p) => ({ ...p, tab: next }),
      replace: move === "replace",
      state: (s) => ({ ...s, fromChats: move === "push" || s.fromChats }),
    });
  };
}

/** Back to the previous screen, or `fallback` when this is the first one (a deep link). */
export function useBack(fallback: () => void) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return () => (canGoBack ? router.history.back() : fallback());
}
