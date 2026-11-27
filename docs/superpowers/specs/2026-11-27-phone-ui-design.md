# Phone UI

## Intent

Below `md` (768px), Sonora behaves like a phone messaging app, not the desktop layout shrunk down. Navigation matters most: a bottom nav bar like other apps.

## Goals / non-goals

- **Goals:** bottom navigation, one header per screen, thumb-reachable actions, touch behaviour people already know.
- **Non-goals:** any desktop or tablet change, message bubbles (rows stay), new features (call history, chat info screen), redesigning sign-in.
- **Failure looks like:** floating panels, hover-sized controls or desktop popups on a phone.

## Approaches

1. **Adapt existing components at `md`, plus two shared pieces (bottom nav, bottom sheet). Chosen (builder's call):** one copy of each feature.
2. Separate phone component tree: cleaner markup, every feature built twice.
3. Mobile UI kit (Ionic, Konsta): new dependency, templated look.

No new dependencies. Base UI 1.9 has `Drawer` (sheets); `motion` `domMax` is loaded (drag).

## Constraints

PRODUCT.md and SPEC §9a hold: WCAG 2.2 AA, reduced motion, Phosphor icons, existing tokens. UI work uses the `better-*` skills.

## Navigation (build first)

```
┌──────────────────────────┐   ┌──────────────────────────┐
│ Chats            ⌕    ✎  │   │ ‹ (o) Sam         ☎  ▣   │
│                          │   │     Online               │
│ (o) Sam            9:41  │   │                          │
│     you free?        (2) │   │ (o) Sam  9:41            │
│ (o) desert crew    8:10  │   │     you free?            │
│     You: on my way       │   │                          │
│                          │   │ (+) Message Sam      (➤) │
├──────────────────────────┤   └──────────────────────────┘
│  💬 Chats  👥 Friends  (o) You │      chat: no bottom nav
└──────────────────────────┘
```

- **Tabs:** Chats · Friends · You (your avatar). Requests move into Friends.
- **Bar:** full width, flat with a hairline top, 56px plus bottom safe area. Icon and label always shown; active icon filled. Badges: unread chats on Chats, incoming requests on Friends.
- **Behaviour:** tab switches are instant; each tab keeps its scroll; tapping the active tab scrolls to top; the bar hides while the keyboard is up.
- **Pushed screens** (chat, settings page, search, new group) cover the bar, slide in from the right and have a back arrow.
- **History:** tab is a `?tab=` search param, shared with the desktop rail. System back closes a sheet or minimizes a call, then pops a screen, then returns to Chats, then leaves the app.
- **Back gesture:** the phone's own (Android, iOS). No custom edge swipe; this replaces that line in SPEC §9a.
- **Removed on phones:** desktop top bar, floating panels, gaps, pill tabs.

## Screens

| Screen | Phone behaviour |
|---|---|
| Chats | Header with search and new group. Rows about 72px. Notification prompt sits above the list. "Reconnecting…" / "Offline" replaces the title (in a chat, the status line). |
| Chat | One header: back, avatar, name, status, call buttons. Rows stay. |
| Composer | Return adds a line; the button sends and keeps the keyboard open. 16px text (stops iOS zoom). |
| Message actions | Long press opens a bottom sheet: reactions, Reply, Edit, Copy, Delete. Swipe a message left to reply. |
| Friends | Add by username on top, then Requests, Online, Offline. ⋯ opens a sheet; removing asks to confirm. |
| You | Profile, then rows: Account, Sessions, Voice & video, Sounds & alerts, Appearance, Sign out. Each opens a full page (`?settings=`). |
| Search | Full screen, Cancel button, no keyboard hints. |
| New group | Full screen, Create in the header. |
| Call | Covers everything, 56px controls at the bottom, chevron minimizes to a top bar that shows on every screen. |
| Incoming call | Full screen: caller large, Decline and Answer at the bottom. |

## Everywhere

44px minimum targets; pressed states instead of hover; safe areas; no text selection on controls or on long press (Copy lives in the sheet); no pull-to-refresh or rubber-band on the app frame; toasts at the top.

## Order (each ends in a demo)

1. Navigation and headers
2. Chat: composer, action sheet, swipe to reply
3. Friends, You, settings, search, new group
4. Calls

## Checks

Each step is viewed at 375×812, light and dark, with desktop unchanged. One test per non-trivial gesture or history rule. Keyboard, back gesture and safe areas need a real phone (iOS Home Screen app and Android).

## Left to the builder

Exact motion values, history mechanics, component boundaries. If the iOS back gesture doubles the slide animation, skip the animation on back.
