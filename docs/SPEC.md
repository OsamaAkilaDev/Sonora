# Sonora v2 — Spec

Status: draft for review · 2026-11-27 · UI reference: `mockup/index.html`

## 1. Stack (latest stable, checked on npm 2026-11-27)

| Area              | Package                                    | Version                                 |
| ----------------- | ------------------------------------------ | --------------------------------------- |
| Runtime / tooling | Node                                       | ≥ 22.12 (local 22.14 ✓)                 |
|                   | Bun (package manager, workspaces, scripts) | 1.4.5                                   |
|                   | TypeScript                                 | 7.0.2 (fallback 6.0.3 if a tool breaks) |
|                   | Biome (lint + format)                      | 2.6.9                                   |
| Frontend          | React / React DOM                          | 19.3.1                                  |
|                   | Vite + @vitejs/plugin-react                | 8.4.0 / 6.3.0                           |
|                   | TanStack Router + router-plugin            | 1.170.46 / 1.169.0                      |
|                   | TanStack Query                             | 5.108.4                                 |
|                   | Tailwind CSS + @tailwindcss/vite           | 4.3.5                                   |
|                   | Phosphor icons (React)                     | 2.1.10                                  |
|                   | Motion                                     | 14.14.0                                 |
|                   | Zustand (call + UI state only)             | 5.1.0                                   |
|                   | Base UI (accessible primitives)            | 1.9.0                                   |
|                   | vite-plugin-pwa                            | 2.0.0                                   |
|                   | @cloudflare/vite-plugin                    | 1.70.2                                  |
| Backend           | Hono + @hono/zod-validator                 | 4.13.23 / 0.9.1                         |
|                   | Zod (shared schemas)                       | 4.6.7                                   |
|                   | Drizzle ORM / Kit (D1)                     | 0.45.4 / 0.31.11                        |
|                   | Wrangler                                   | 4.168.0                                 |
|                   | @cloudflare/workers-types                  | 5.20261127.1                            |
| Tests             | Vitest + @cloudflare/vitest-plugin         | 4.1.12 / 1.9.2                          |

Note: `@cloudflare/vitest-pool-workers` was renamed to `@cloudflare/vitest-plugin` (supports Vitest 4 and 5). Staying on Vitest 4.1 for now; move to 5 once verified.

## 2. Repo layout

```
sonora/
  apps/
    web/          Vite + React SPA
    api/          Cloudflare Worker: Hono API, Durable Objects, D1 migrations
  packages/
    shared/       zod schemas, DTO types, realtime event types
  docs/  mockup/
```

- One Worker in production. `apps/api/wrangler.jsonc` serves `apps/web/dist` as static assets (`not_found_handling: single-page-application`, `run_worker_first: ["/api/*", "/ws"]`). One deploy, one origin, no CORS.
- Dev: `@cloudflare/vite-plugin` runs the real Worker (workerd, D1, DOs, R2 locally) inside Vite's dev server, pointed at `apps/api/wrangler.jsonc`. One `bun dev`, one port, HMR for UI, same runtime as prod. Build emits both the SPA and the Worker; `wrangler deploy` ships them. (Chosen over a proxy to a separate `wrangler dev`: one process and no dev/prod mismatch.)
- Bun is the package manager and script runner only; Wrangler and Vitest still run on Node underneath (production runtime is workerd either way). No Turborepo: `bun --filter` covers our three packages.
- Typed client: web imports `type AppType` from `api` and uses Hono's `hc` RPC client. Types flow end to end with no codegen.

## 3. Backend structure (Nest-style modules on Hono)

```
apps/api/src/
  index.ts                 app + routes mount + DO exports
  core/  db.ts  auth.ts (middleware)  errors.ts  rate-limit.ts  ids.ts (ULID)  env.ts
  modules/
    auth/      auth.routes.ts  auth.service.ts  password.ts
    users/     friends/  chats/  messages/  uploads/  calls/
    realtime/  user-hub.ts (DO)  call-room.ts (DO)  publish.ts
  db/  schema.ts  migrations/
```

Each module has a `*.routes.ts` file (a Hono sub-app: validation, auth, HTTP) and a `*.service.ts` file (plain functions taking `db` and input, no HTTP). Request and response schemas live in `packages/shared`. There's no DI container: the modules give us the structure without the machinery.

Errors: one handler maps everything to `{ error: { code, message } }` with correct status codes. Zod failures become `422` with field paths.

## 4. Data model (D1 / SQLite via Drizzle)

- `users`: id (ULID), username (unique, lowercased), display_name, email (unique, lowercased), password_hash, avatar_seed, avatar_key?, banner_key?, about, status (online|idle|dnd|invisible), created_at
- `sessions`: id = SHA-256(token), user_id, user_agent, city?, created_at, last_seen_at, expires_at
- `friendships`: user_a < user_b (PK pair), status (pending|accepted|blocked), requested_by, created_at
- `chats`: id, kind (dm|group), name?, owner_id?, dm_key (unique "a:b", so no duplicate DMs), last_message_at
- `chat_members`: chat_id, user_id, role, last_read_id, muted, joined_at
- `messages`: id (ULID, time-sortable, so it doubles as the cursor), chat_id, sender_id, client_id (unique per sender, for idempotency), body, reply_to_id?, kind (text|system|call), edited_at?, deleted_at?
- `attachments`: id, message_id, r2_key, mime, size, width?, height?, duration?
- `reactions`: (message_id, user_id, emoji) PK
- `messages_fts`: FTS5 index on body, kept in sync with triggers

## 5. Auth & sessions

- **Passwords:** scrypt from `node:crypto` (native in workerd), OWASP profile N=2^15, r=8, p=3 (~32 MiB, ~150 ms), per-user salt, params stored in the hash so they can be raised. (PBKDF2 was dropped: production Workers cap Web Crypto PBKDF2 at 100k iterations, below OWASP's 600k.)
- **Session:** a random 32-byte token in a `__Host-sid` cookie (`HttpOnly; Secure; SameSite=Lax; Path=/`). The database stores only its SHA-256. It has a 30-day sliding expiry, and `last_seen_at` is written at most once an hour.
- **Revoke:** deleting the row signs that session out. Settings lists your sessions, with "Sign out" on each and "Sign out all other sessions".
- **CSRF:** SameSite=Lax, plus an `Origin` check on every mutating request, plus JSON-only bodies.
- **Login:** one generic error ("Email or password is incorrect"). A dummy hash runs when the email is unknown so response timing doesn't leak which emails exist. Login is rate-limited per IP and per email with the Workers Rate Limiting binding.
- **Sockets:** the browser opens `/ws` with its cookie. The Worker validates the session, then forwards to that user's Durable Object with a trusted header. The Durable Objects can't be reached from outside.
- **Later (phase 5):** email verification and password reset through Cloudflare Email Sending.

## 6. Realtime

- **`UserHub` Durable Object, one per user.** It holds that user's sockets across tabs and devices, using WebSocket Hibernation so idle connections cost nothing.
- **Message fan-out:** the API writes to D1 first, then calls each member's `UserHub` over RPC to push the event. That's fine for groups up to ~50.
  - ponytail: per-member fan-out; switch to a ChatRoom DO if groups get large.
- **Presence:** when a hub's first socket connects or its last one closes, it notifies friends' hubs. A manual status (DND, invisible) overrides it, and idle comes from client activity.
- **Typing:** ephemeral, throttled to one event every 3s, and never stored.
- **Events** (typed in `shared`): `message.new|updated|deleted`, `reaction`, `typing`, `read`, `presence`, `friend.request|accepted|removed`, `call.*`.
- **Client:**
  - One socket for the whole app.
  - Exponential backoff with jitter on reconnect; invalidating the relevant queries resyncs anything missed.
  - Events patch the TanStack Query cache directly with `setQueryData`, so the UI never refetches just to show something new.

## 7. Messaging UX

- **Optimistic send:** the client creates the ULID `client_id`, the message renders as "Sending" at once, and the server echoes the `client_id` so the two copies merge. A failed send shows "Not sent · Retry".
- **History:** `useInfiniteQuery` loads pages of 50, using the message ULID as the cursor, and keeps the scroll position when older messages load. The first open of a chat shows a skeleton; after that it opens instantly from cache.
  - ponytail: no virtualization at first; add @tanstack/react-virtual when long chats get slow.
- **Messages:** replies, edits (↑ edits your last message), soft deletes, reactions, emoji-only messages shown large, grouping (same sender within 5 min), day separators, and the "Tue 14 – Today" date range shown in the chat header.
- **Read state:** each member stores the last message they've read. DMs show "Seen", and unread counts are capped at 99+.
- **Attachments:** streamed through the Worker into R2, with a 25 MB cap and MIME allowlist. Files are served from `/api/files/:id` only after checking you're in that chat. Images keep their stored size so the layout doesn't jump while they load.
- **Search:** FTS5, scoped to the chats you're a member of.
- **Other:** drafts saved per chat (localStorage), the Ctrl+K switcher, and the chat list moving rows smoothly instead of jumping.

## 8. Calls (no media vendor)

- **WebRTC mesh**, capped at 6 participants. Signaling (`call.invite|accept|decline|signal|leave`) goes over the same app socket and is relayed between `UserHub`s.
- **`CallRoom` Durable Object, one per chat.** It tracks who's in the call so people can join an ongoing group call, and ends ringing after 30s.
- **WebRTC behavior:**
  - Negotiation uses the "perfect negotiation" pattern.
  - Screen share and device switching swap the outgoing track in place, with no renegotiation.
  - Speaking detection runs on an `AnalyserNode`, and noise suppression and echo cancellation use the browser's built-in audio constraints.
- **ICE:** Cloudflare STUN, plus TURN credentials minted per call by `POST /api/calls/ice` (short-lived). `TURN_PROVIDER = cloudflare | coturn | none` is a config value, so we can move to our own coturn server later.
- **Mini call bar:** stays docked in the side rail while you browse other chats. Leave is red and set apart from the other controls.

## 9. Frontend

- **Routes** (file-based):
  - `/login`, `/signup`
  - `/_app` is the shell layout and checks you're signed in
  - `/_app/` shows Friends and Requests, `/_app/c/$chatId` shows a chat
  - Settings is an overlay opened by a `?settings=profile` search param, so it can be linked to and the back button closes it.
- **State:** TanStack Query owns server data, with a query-key factory per module. Zustand only holds call state and local UI state.
- **Design system:** tokens from the mockup as Tailwind v4 `@theme`, with light and dark themes switched through `data-theme`. One font (Inter), pill-shaped buttons, cyan rationed, and only Phosphor icons.
- **UI kit** (in `apps/web/src/ui`, no separate package until a second app needs it): Button, IconButton, Input, Avatar (DiceBear `slice` v11 as the default), Skeleton, Tabs, Toast, and Dialog/Menu/Select/Switch/Tooltip built on **Base UI** for accessibility (focus trapping, menu keyboard navigation).
- **Motion** rules follow the mockup:
  - Panels slide in one after another on first load, and skeletons fade into content.
  - Menus you open often skip the opening animation; settings and other rare overlays get a gentle scale-in.
  - Buttons shrink slightly on press.
  - Everything switches to simple fades when reduced motion is on.

## 9a. Phone + PWA (required)

- **Phones are a first-class layout, not a squeezed desktop.** Below 760px:
  - The chat list is the home screen, and opening a chat slides it in from the right. The back button and an edge swipe both return to the list.
  - The composer stays pinned above the keyboard (`interactive-widget=resizes-content`, `dvh` units, safe-area insets).
  - Touch targets are at least 44px. Long-pressing a message opens the reply/react/edit sheet that hover shows on desktop.
  - A call opens full screen with large controls. Minimized, it becomes a slim bar at the top of the screen.
  - Settings opens as full-screen pages instead of an overlay.
- **PWA via `vite-plugin-pwa` 2.0.0** (Workbox; supports Vite 8):
  - Installable: manifest, icons made from the Sonora logo, a maskable icon, `display: standalone`, and theme colors for both themes.
  - The app shell is precached, so it opens instantly and works offline. Offline it shows cached chats with an "Offline · reconnecting" banner, and messages sent while offline queue and go out when you're back.
  - Updates prompt "New version ready · Reload", so the app never updates silently in the middle of a call.
  - The API and socket are never cached; only static assets are.
- **Push notifications (Web Push with VAPID, sent from the Worker)** for DMs, mentions and incoming calls when the app is closed. Installed iOS PWAs support this on iOS 16.4+. They're tapped to open the right chat or call. → phase 5.

## 10. Quality & security

- **Code checks:** TypeScript strict mode, Biome, and CI on GitHub Actions running typecheck, lint and tests.
- **Tests:** one meaningful test per non-trivial piece using the Workers test pool (auth, sessions, friendships, message send and dedupe, permissions), and a handful of pure-function tests on the web side (grouping, reconnect).
- **Hardening:** strict security headers and CSP on the static assets, Zod validation at every boundary, size limits on uploads and inputs, and a permission check on every chat-scoped request.

## 11. Phases (each ends in a demo and a review)

1. Scaffold, design system, auth, sessions, the app shell with skeletons and the intro animation, the phone layout, and installable PWA basics (manifest, precache, update prompt).
2. Friends, DMs and groups, messages, the realtime socket, presence and typing.
3. Replies, reactions, edits, attachments, search, unread counts, drafts and the Ctrl+K switcher.
4. Voice and video calls, screen share, devices, the mini call bar, and TURN.
5. Settings, a new background for the sign-in screens, email verification and reset, Web Push, the offline message queue, deploy, and a polish pass.

## 12. Open decisions

1. **Workers Paid ($5/mo) is recommended.** The free plan's 10 ms CPU limit per request can't run PBKDF2 at 600k iterations, and calls plus realtime will want headroom anyway. Without it, passwords would have to use weaker hashing settings.
2. **TypeScript 7** (the native compiler) is stable, so we use it. If any tool in the chain breaks, we pin 6.0.3.
