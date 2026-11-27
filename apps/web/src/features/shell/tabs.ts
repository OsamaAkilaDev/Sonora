/** Which home section is open. Phones fold requests into Friends; desktop has no You tab. */
export type Tab = "chats" | "friends" | "you";
export type UrlTab = Tab | "requests";

export const urlTabs: UrlTab[] = ["chats", "friends", "requests", "you"];

export const phoneTab = (t: UrlTab = "chats"): Tab => (t === "requests" ? "friends" : t);

export const railTab = (t: UrlTab = "chats") => (t === "you" ? "chats" : t);

/** Chats is home: other tabs sit one history entry above it, so Back returns there. */
export function tabMove(current: Tab, next: Tab, fromChats: boolean) {
  if (current === next) return "top";
  if (next === "chats") return fromChats ? "back" : "replace";
  return current === "chats" ? "push" : "replace";
}
