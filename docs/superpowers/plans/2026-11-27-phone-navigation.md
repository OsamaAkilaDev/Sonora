# Phone Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phones get a bottom nav bar, one header per screen and real push/back navigation.

**Architecture:** Same `AppShell` tree for both layouts, so the open chat never remounts. The active tab lives in `?tab=`; pushed screens use history; the slide is the native View Transitions API.

**Tech Stack:** React 19, TanStack Router 1.17x, Tailwind v4, Phosphor. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-27-phone-ui-design.md` (step 1 of its Order)

## Global Constraints

- Phone means `(width < 48rem)`. Nothing at `md` and up changes visibly.
- Tabs: Chats · Friends · You. Bar 56px plus bottom safe area, hairline top, icon and label always shown, active icon filled.
- 44px minimum targets; reduced motion respected; existing tokens; Phosphor only.
- No custom edge swipe.
- UI work uses the `better-*` skills.
- Branch `phone-nav`. Commit messages short, no AI attribution.

## Review Focus

1. Opening `/c/<id>` directly (from a notification), then Back: lands on Chats, doesn't leave the app. (Task 3)
2. Chats → Friends → You → Friends, then system back once: Chats; again: leaves. (Tasks 1, 2)
3. Resizing across 768px with a chat open: draft and call survive. (Task 2)
4. `?tab=requests` on a phone shows Friends; `?tab=you` on desktop shows Chats. (Task 1)
5. Typing in "Add by username": the bar doesn't ride up on the keyboard. (Task 2)

---

### Task 1: Tab state in the URL

**Files:**
- Create: `apps/web/src/features/shell/tabs.ts`, `tabs.test.ts`, `navigation.ts`
- Modify: `apps/web/src/routes/_app.tsx`, `features/shell/rail.tsx`, `apps/web/package.json`, root `package.json`

**Interfaces (Produces):**
- `tabs.ts`: `type Tab = "chats" | "friends" | "you"`; `type UrlTab = Tab | "requests"`; `urlTabs: UrlTab[]`; `phoneTab(t?: UrlTab): Tab`; `railTab(t?: UrlTab): "chats" | "friends" | "requests"`; `tabMove(current: Tab, next: Tab, fromChats: boolean): "top" | "push" | "replace" | "back"`
- `navigation.ts`: `useUrlTab(): UrlTab | undefined`; `useGoTab(): (next: Tab) => "top" | void` (phone history rules; sets `state.fromChats` on push, keeps it on replace); `useBack(fallback: () => void): () => void` (`useCanGoBack()` ? `history.back()` : `fallback()`)

- [ ] **Step 1: Failing test** (`node:test`, so no new types)

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { phoneTab, railTab, tabMove } from "./tabs";

test("tab history and mapping", () => {
  assert.equal(tabMove("chats", "chats", false), "top");
  assert.equal(tabMove("chats", "friends", false), "push");
  assert.equal(tabMove("friends", "you", true), "replace");
  assert.equal(tabMove("you", "chats", true), "back");
  assert.equal(tabMove("you", "chats", false), "replace");
  assert.equal(phoneTab("requests"), "friends");
  assert.equal(phoneTab(undefined), "chats");
  assert.equal(railTab("you"), "chats");
  assert.equal(railTab("requests"), "requests");
});
```

- [ ] **Step 2:** Add `"test": "bun test src"` to web; root `test` becomes `bun --filter '*' test`. Run `bun test apps/web/src/features/shell` — FAIL, module missing.
- [ ] **Step 3:** Write `tabs.ts` and `navigation.ts`.
- [ ] **Step 4:** `_app.tsx`: `validateSearch` adds `tab` only when valid; `search.middlewares: [retainSearchParams(["tab"])]`. Going to Chats passes `tab: "chats"`, never `undefined`. `rail.tsx`: replace its `useState` with `railTab(useUrlTab())`, navigating with `replace: true`.
- [ ] **Step 5:** `bun run test && bun run typecheck && bun run lint` — pass. In the browser at desktop width: pick Friends, open a friend; the rail stays on Friends.
- [ ] **Step 6:** Commit `keep the open tab in the url`

### Task 2: Phone home and bottom nav

**Files:**
- Create: `apps/web/src/lib/phone.ts`, `features/shell/bottom-nav.tsx`, `phone-home.tsx`, `you-screen.tsx`
- Modify: `features/shell/app-shell.tsx`, `features/social/friend-list.tsx`, `request-list.tsx`, `features/settings/settings-dialog.tsx`, `features/realtime/socket.ts`, `features/shell/top-bar.tsx`, `ui/button.tsx`, `styles.css`

**Interfaces:**
- Consumes: Task 1.
- Produces: `isPhone(): boolean`, `usePhone(): boolean` (`useSyncExternalStore` over `matchMedia`); `connectionLabel(state): "Offline" | "Reconnecting…" | null` in `socket.ts`, used by `top-bar.tsx` too

- [ ] **Step 1:** `BottomNav`: `<nav aria-label="Main">` of three buttons, `aria-current="page"` on the active one. Friends shows incoming request count; Chats shows number of chats with `unread > 0`; You uses the avatar. Tapping the active tab scrolls its panel to top. Hidden while a text field is focused (`body:has(...)`, checkbox and radio excluded).
- [ ] **Step 2:** `PhoneHome`: three stacked panels, each its own scroller, inactive ones `invisible` (keeps scroll). Chats: title "Chats" (or `connectionLabel`), search (`useSwitcher`) and new group buttons, `NotifyPrompt` above `ChatList`. Friends: title "Friends", `FriendList` with new prop `requests?: ReactNode` rendered between add field and Online; pass `<RequestList inline />` (`inline`: no empty state or skeleton). You: `YouScreen`.
- [ ] **Step 3:** `YouScreen`: avatar, username, status; one 52px row per settings section (export the dialog's `nav` as `settingsNav`) setting `?settings=<id>`; Sign out row.
- [ ] **Step 4:** `AppShell`: on phones no `TopBar`, gaps, padding or `panel` (`md:panel`); top safe area on the container; `aside` and `main` share one grid cell; covered `aside` is `invisible`, not `hidden`; call bar stays an auto row on top; `aside` renders `PhoneHome` or `Rail`. `main` keeps its position in the tree.
- [ ] **Step 5:** Settings close uses `useBack` (fallback: replace without `settings`), so system back doesn't reopen it.
- [ ] **Step 6:** `IconButton` gets `pointer-coarse:size-11`. Below `md`, toasts anchor to the top (mirror the vertical offsets in `.toast`).
- [ ] **Step 7:** `typecheck`, `lint`. Browser at 375×812, light and dark: walk Review Focus 2, 3, 5; every settings section reachable; desktop looks as before.
- [ ] **Step 8:** Commit `bottom nav on phones`

### Task 3: Pushed chat screen

**Files:**
- Modify: `features/shell/tabs.ts`, `tabs.test.ts`, `main.tsx`, `styles.css`, `features/chats/chat-view.tsx`

**Interfaces:**
- Consumes: `useBack`, `isPhone`, `connectionLabel`.
- Produces: `screenMotion(from: string | undefined, to: string): "push" | "pop" | false` (pathnames; `/c/…` is one level deeper than `/`)

- [ ] **Step 1: Failing test**

```ts
test("screen motion", () => {
  assert.equal(screenMotion("/", "/c/1"), "push");
  assert.equal(screenMotion("/c/1", "/"), "pop");
  assert.equal(screenMotion("/c/1", "/c/2"), false);
  assert.equal(screenMotion(undefined, "/c/1"), false);
});
```

- [ ] **Step 2:** Run, FAIL; implement; PASS.
- [ ] **Step 3:** Router `defaultViewTransition.types`: `[motion]` on phones when `screenMotion` is truthy, else `false`.
- [ ] **Step 4:** CSS: root view-transition animation `none` by default (theme reveal still works); under `:active-view-transition-type(push|pop)` slide the screen from/to the right, 300ms `--ease-out-quint`, none under reduced motion. Call bar gets its own `view-transition-name` so it stays put.
- [ ] **Step 5:** Chat header: back is a button using `useBack` (fallback: `/`, `tab: "chats"`, replace), 44px; call buttons 44px; status line shows `connectionLabel` when set.
- [ ] **Step 6:** `test`, `typecheck`, `lint`. Browser: Review Focus 1; push and pop slide; theme switch still reveals.
- [ ] **Step 7:** Commit `slide into chats and back`

**Needs your phone:** iOS Home Screen app and Android: back gesture (no double slide on iOS), safe areas, keyboard.
