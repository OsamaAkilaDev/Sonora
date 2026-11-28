// One shot per URL (?shot=name), rendered with Sonora's own components and providers.
// ?capture also saves it; no ?shot captures every shot, one iframe at a time.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { domMax, LazyMotion, MotionConfig, MotionGlobalConfig } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import type { Remote } from "../../apps/web/src/features/calls/store";
import { useCall, useCalls } from "../../apps/web/src/features/calls/store";
import { CallLayer } from "../../apps/web/src/features/calls/call-layer";
import { CallStage } from "../../apps/web/src/features/calls/call-stage";
import { ChatList } from "../../apps/web/src/features/chats/chat-list";
import { ChatView } from "../../apps/web/src/features/chats/chat-view";
import { useTyping } from "../../apps/web/src/features/realtime/typing";
import { Switcher, useSwitcher } from "../../apps/web/src/features/switcher/switcher";
import { me, people, searchHits, world } from "./data";
import "./harness.css";

type Shot = {
  theme: "light" | "dark";
  /** The shot's box in CSS px; the film scales it to fit. */
  w: number;
  h: number;
  /** Data state from data.ts. */
  state?: string;
  /** What to save, when it isn't the whole box. */
  pick?: string;
  /** Typing indicators: chatId → userId. */
  typing?: Record<string, string>;
  /** Call state for this tab. */
  call?: "omar" | "standup-2" | "standup-3" | "standup-6" | "share";
  ringing?: boolean;
  setup?: () => void | Promise<void>;
  view: () => ReactNode;
};

const chatPanel = (chatId: string) => () => <ChatView chatId={chatId} />;
const callStage = (chatId: string) => () => {
  const { chats } = world("final");
  const chat = chats.find((c) => c.id === chatId);
  return chat && <CallStage chat={chat} me={me} />;
};

export const shots: Record<string, Shot> = {
  "thread-typing": { theme: "dark", w: 760, h: 470, state: "typing", typing: { lisbon: "karim" }, view: chatPanel("lisbon") },
  thread: { theme: "dark", w: 760, h: 470, view: chatPanel("lisbon") },
  family: { theme: "light", w: 760, h: 470, view: chatPanel("family") },
  "dm-sent": { theme: "dark", w: 760, h: 470, state: "sent-dm", view: chatPanel("omar") },
  "dm-seen": { theme: "dark", w: 760, h: 470, state: "seen", view: chatPanel("omar") },
  "upload-pending": {
    theme: "light",
    w: 760,
    h: 470,
    setup: async () => {
      localStorage.setItem("sonora-draft:lisbon", "this is the living room");
      (globalThis as { __uploadProgress?: number }).__uploadProgress = 0.62;
    },
    view: chatPanel("lisbon"),
  },
  "upload-sent": { theme: "light", w: 760, h: 470, state: "sent", view: chatPanel("lisbon") },
  "list-before": { theme: "dark", w: 380, h: 470, state: "before", typing: { lisbon: "karim" }, view: () => <List /> },
  "list-after": { theme: "dark", w: 380, h: 470, state: "after", typing: { omar: "omar" }, view: () => <List /> },
  "switcher-empty": { theme: "light", w: 1100, h: 760, pick: "[role=dialog]", view: () => <Switcher /> },
  "switcher-lisbon": { theme: "light", w: 1100, h: 760, pick: "[role=dialog]", view: () => <Switcher /> },
  incoming: { theme: "dark", w: 760, h: 470, state: "seen", ringing: true, view: () => <><ChatView chatId="omar" /><CallLayer /></> },
  call: { theme: "dark", w: 760, h: 900, call: "omar", pick: "section[aria-label=Call]", view: callStage("omar") },
  "group-2": { theme: "dark", w: 860, h: 900, call: "standup-2", pick: "section[aria-label=Call]", view: callStage("standup") },
  "group-3": { theme: "dark", w: 860, h: 900, call: "standup-3", pick: "section[aria-label=Call]", view: callStage("standup") },
  "group-6": { theme: "dark", w: 860, h: 900, call: "standup-6", pick: "section[aria-label=Call]", view: callStage("standup") },
  share: { theme: "dark", w: 860, h: 900, call: "share", pick: "section[aria-label=Call]", view: callStage("standup") },
};

function List() {
  return (
    <div className="h-full p-2">
      <ChatList onFindFriends={() => {}} />
    </div>
  );
}

/* ── State for one shot ── */

const feed = (id: string) => ({ id }) as MediaStreamTrack;
const peer = (userId: string, o: Partial<Remote> = {}): Remote => ({
  peerId: `p-${userId}`,
  userId,
  muted: false,
  camera: true,
  screen: false,
  connection: "connected",
  cameraTrack: feed(`cam-${userId}`),
  ...o,
});

function seedCall(kind: Shot["call"]) {
  if (!kind) return;
  const now = Date.now();
  const list =
    kind === "omar"
      ? [peer("omar")]
      : kind === "standup-2"
        ? [peer("theo")]
        : kind === "standup-3"
          ? [peer("theo"), peer("sami")]
          : [
              peer("theo"),
              peer("sami"),
              peer("marco", { muted: true }),
              peer("kenji", kind === "share" ? { screen: true, screenTrack: feed("screen-kenji") } : {}),
              peer("ravi"),
            ];
  useCall.setState({
    chatId: kind === "omar" ? "omar" : "standup",
    callId: "c1",
    status: "live",
    liveAt: now - 4000,
    muted: false,
    camera: true,
    cameraTrack: feed("cam-osama"),
    peers: Object.fromEntries(list.map((p) => [p.peerId, p])),
    speaking: {},
  });
}

function seedCalls(ringing: boolean) {
  const now = Date.now();
  useCalls.setState({
    byChat: {
      standup: {
        chatId: "standup",
        callId: "c1",
        video: true,
        startedBy: "theo",
        startedAt: now - 60_000,
        ringingUntil: 0,
        ringsUntil: 0,
        userIds: ["theo", "sami", "marco", "kenji", "ravi"],
      },
      ...(ringing && {
        omar: {
          chatId: "omar",
          callId: "c2",
          video: true,
          startedBy: "omar",
          startedAt: now,
          ringingUntil: now + 30_000,
          ringsUntil: now + 30_000,
          userIds: ["omar"],
        },
      }),
    },
  });
}

/* ── Rendering ── */

const params = new URLSearchParams(location.search);
const name = params.get("shot");
const capture = params.has("capture");
const root = createRoot(document.getElementById("root") as HTMLElement);
// Captures take every element at its final state; GSAP animates them in the film.
if (capture) MotionGlobalConfig.instantAnimations = true;

if (!name) captureAll();
else void render(name, shots[name]);

async function render(name: string, shot: Shot) {
  document.documentElement.dataset.theme = shot.theme;
  const { chats, threads } = world(shot.state ?? "final");
  const qc = new QueryClient({
    defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false } },
  });
  qc.setQueryData(["me"], me);
  qc.setQueryData(["chats"], chats);
  qc.setQueryData(["social"], { friends: Object.values(people).filter((p) => p.id !== me.id), requests: [] });
  qc.setQueryData(["search", "lisbon"], { results: searchHits });
  for (const [chatId, messages] of Object.entries(threads))
    qc.setQueryData(["messages", chatId], {
      pages: [{ messages, nextCursor: null }],
      pageParams: [undefined],
    });
  useTyping.setState({
    byChat: Object.fromEntries(
      Object.entries(shot.typing ?? {}).map(([chat, user]) => [chat, { [user]: Number.MAX_SAFE_INTEGER }]),
    ),
  });
  seedCalls(!!shot.ringing);
  seedCall(shot.call);
  await shot.setup?.();

  const Root = () => (
    <div
      data-shot={name}
      className="panel relative overflow-hidden"
      style={{ width: shot.w, height: shot.h, contain: "layout paint" }}
    >
      {shot.view()}
      <Effects name={name} />
    </div>
  );
  const rootRoute = createRootRoute({ component: Root });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      createRoute({ getParentRoute: () => rootRoute, path: "c/$chatId", component: () => null }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  root.render(
    <QueryClientProvider client={qc}>
      <MotionConfig reducedMotion={capture ? "always" : "user"}>
        <LazyMotion features={domMax} strict>
          <div className="grid min-h-dvh place-items-center bg-canvas p-6">
            <RouterProvider router={router} />
          </div>
        </LazyMotion>
      </MotionConfig>
    </QueryClientProvider>,
  );
}

/** What a shot needs done after it mounts: open the switcher, type, attach the photo. */
function Effects({ name }: { name: string }) {
  useEffect(() => {
    if (name.startsWith("switcher")) {
      useSwitcher.getState().set(true);
      if (name === "switcher-lisbon")
        setTimeout(() => typeInto("[role=dialog] input", "lisbon"), 50);
    }
    if (name === "upload-pending")
      setTimeout(async () => {
        const blob = await fetch("/stock/flat.jpg").then((r) => (r.ok ? r.blob() : new Blob()));
        const data = new DataTransfer();
        data.items.add(new File([blob], "living-room.jpg", { type: "image/jpeg" }));
        document.querySelector("textarea")?.dispatchEvent(
          new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
        );
      }, 50);
    if (capture) void save(name);
  }, [name]);
  return null;
}

function typeInto(selector: string, text: string) {
  const el = document.querySelector<HTMLInputElement>(selector);
  if (!el) return;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  set?.call(el, text);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Settle, then send the shot's DOM and every stylesheet to the dev server. */
let saving = false;
async function save(name: string) {
  if (saving) return;
  saving = true;
  const shot = shots[name];
  await wait(1200);
  await document.fonts.ready;
  const local = [...document.images].filter((i) => !i.complete && i.src.startsWith(location.origin));
  await Promise.race([
    Promise.all(local.map((i) => new Promise((r) => (i.onload = i.onerror = r)))),
    wait(3000),
  ]);
  if (!name.startsWith("switcher") && name !== "upload-pending")
    (document.activeElement as HTMLElement | null)?.blur();

  const el = document.querySelector(shot.pick ?? "[data-shot]") as HTMLElement;
  const clone = el.cloneNode(true) as HTMLElement;
  // A picked dialog is fixed to the viewport in the app; in the shot it sits in its own box.
  // Its size is pinned too: some is in viewport units (the call stage is 46dvh).
  const box = el.getBoundingClientRect();
  if (shot.pick)
    clone.style.cssText += `;position:relative;inset:auto;translate:none;transform:none;margin:0;width:${box.width}px;height:${box.height}px`;
  // Live values aren't in the markup: write them in.
  const live = el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea").forEach((c, i) => {
    const v = live[i]?.value ?? "";
    if (c instanceof HTMLTextAreaElement) c.textContent = v;
    else c.setAttribute("value", v);
  });
  clone.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") ?? "";
    // Avatars are stock photos in the film (the app draws DiceBear art from the same seed).
    const seed = src.includes("dicebear.com") && new URL(src).searchParams.get("seed");
    if (seed) img.setAttribute("src", `assets/stock/avatars/${seed}.jpg`);
    else if (src.startsWith("/stock/")) img.setAttribute("src", `assets${src}`);
    // The composer previews a pasted photo through a blob URL, which dies with the page.
    else if (src.startsWith("blob:")) img.setAttribute("src", "assets/stock/flat.jpg");
    img.removeAttribute("loading");
  });
  const r = el.getBoundingClientRect();
  // Every box as laid out here, in shot pixels: the film reads positions from these, since a
  // scene that isn't on screen yet has no layout to measure.
  const liveAll = [el, ...el.querySelectorAll("*")];
  [clone, ...clone.querySelectorAll("*")].forEach((c, i) => {
    const b = liveAll[i]?.getBoundingClientRect();
    if (b?.width) c.setAttribute("data-r", [b.left - r.left, b.top - r.top, b.width, b.height].map(Math.round).join(" "));
  });
  const html = `<div class="shot theme-${shot.theme}" data-shot="${name}" style="width:${Math.round(r.width)}px;height:${Math.round(r.height)}px">${clone.outerHTML}</div>`;
  const sheets = [...document.styleSheets].map((s) => [...s.cssRules].map((c) => c.cssText).join("\n"));
  await fetch("/__save", { method: "POST", body: JSON.stringify({ name, html, sheets }) });
  parent.postMessage({ saved: name }, "*");
}

/** Every shot in a 1440×900 iframe, so the app lays out as desktop whatever this tab's size. */
async function captureAll() {
  const log = document.createElement("pre");
  document.body.append(log);
  for (const name of params.get("only")?.split(",") ?? Object.keys(shots)) {
    const frame = document.createElement("iframe");
    frame.style.cssText = "width:1440px;height:900px;border:0";
    frame.src = `/?shot=${name}&capture`;
    const done = new Promise<void>((res) => {
      const on = (e: MessageEvent) => {
        if (e.data?.saved !== name) return;
        removeEventListener("message", on);
        res();
      };
      addEventListener("message", on);
    });
    document.body.append(frame);
    await Promise.race([done, wait(15000)]);
    log.textContent += `${name}\n`;
    frame.remove();
  }
  log.textContent += "done";
  document.title = "done";
}
