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

const depth = (path: string) => (path.startsWith("/c/") ? 1 : 0);

/** How a phone moves between two paths: a chat is a screen on top of home. */
export function screenMotion(from: string | undefined, to: string) {
  if (from === undefined || depth(from) === depth(to)) return false;
  return depth(to) > depth(from) ? "push" : "pop";
}
