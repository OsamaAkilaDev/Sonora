# Sonora showcase video: brief

A ~35 s film of Sonora's real UI for people reviewing the GitHub repo. It's built from code with HyperFrames and uses no generative video.

## What exists (from the code)

Shown in the video:
- **Messaging.** Optimistic send, grouped lines, replies (quote and jump), edits, deletes, emoji-only messages shown large, and attachments with an upload progress ring.
- **Live state.** Typing (the header's status reads "typing…" in cyan, and so does the chat-list row), presence dots, Sent ✓ → Seen ✓✓ in DMs, and unread badges. Chat-list rows re-sort live with a layout animation.
- **Reactions.** Quick reactions plus a picker. A chip counts up as people react.
- **Ctrl+K switcher.** Jump to a chat or friend, plus full-text message search (D1 FTS5).
- **Calls.** 1:1 and group voice/video. A WebRTC mesh of up to 6 runs on its own signalling (one `CallRoom` Durable Object per chat). An incoming call shows a ringing card, and outgoing calls play a ringback. There's screen share (shares take the stage and faces move to a strip), mute and camera toggles, a cyan speaking ring driven by an AnalyserNode, and a mini call dock.
- **Themes.** Light and dark. The theme switch grows as a circle from the click point (view transitions).
- **Phone layout.** Built as a separate design, not a squeezed desktop: bottom nav, chats slide in. It's a PWA with Web Push call ringing.

Not in the app, so **not shown**: voice notes and waveforms, RTL or a second language, photo avatars (avatars are DiceBear `slice` art from a seed), message notifications, and blocking.

**Stack:** one Cloudflare Worker (Hono and Zod, RPC types end to end), D1 with Drizzle, Durable Objects with WebSocket Hibernation (`UserHub` per user, `CallRoom` per chat), Backblaze B2 for files, and Web Push (VAPID). The front end is React 19, Vite 8, TanStack Router and Query, Tailwind v4, Base UI, Motion and Zustand. Tooling is Bun, TypeScript 7 and Biome.

## Format

16:9, 1920×1080, 30 fps. HyperFrames with GSAP, rendered as a draft first and then at `--quality delivery`. The output goes to `docs/media/sonora.mp4`.

## Palette (the app's tokens)

| Token | Dark | Light | Use in film |
|---|---|---|---|
| canvas | `#060606` | `#faf9f6` | ground behind each shot |
| panel | `#121212` | `#ffffff` | the UI itself |
| ink | `#e4e4e4` | `#171717` | worded beats |
| cyan | `#12a9bc` | `#0796a9` | beat accent, the brand |
| green | `#34c172` | `#1fa95b` | beat accent |
| amber | `#e8ac2c` | `#d99a16` | beat accent |
| red | `#f05252` | `#dc3b3b` | beat accent (used once) |

The type is Inter Variable (`ss01`, `cv11`), the app's only face. Panels have a 14 px radius, the composer 20 px, and tiles 12 px. Call tiles are `#0d0d0d` in both themes. Shots alternate between dark (the brand's default) and light, with a theme set per shot from the URL.

## Hook

Frame 0 is never empty. It opens on a group chat already mid-conversation: the header reads **"karim typing…"** in cyan, then her message lands, and a reply quoting an earlier line follows on the next beat. Within 2 s the viewer has seen that it is live.

## Beats

**Grid (Night Owl, measured):** 129.0 BPM, so a beat is 0.46509 s (≈ 13.95 frames) and a bar is 1.86036 s. Film t=0 is **59.52 s** into the track: the drop after a one-second break, a downbeat. Beat *n* sits at `round(n × 0.46509 × 30)` frames, computed from the index and never accumulated. The film is 21 bars, 39.07 s (1172 frames); the beat table below predates the final cut, which gives the words two bars (17–19) and the end card two (19–21). The music fades out over the last 1.5 s.

Each beat pops elements in on the beat and clears them half a beat before the next bar. Every change of beat is a disc in the next beat's accent that grows into the downbeat (`clip-path: circle`, `power2.in`, the last 0.4 s of the bar), then fades over the new shot. So the seams don't all look the same, **each disc grows from the element that causes the next beat**: the sent message, the answer button, the last tile, and so on.

| # | Bars | Time (s) | Theme / accent | Feature | What moves | Sound |
|---|---|---|---|---|---|---|
| 1 | 0–3 | 0.00–5.58 | dark / cyan | Live messaging | header "typing…" → message lands (the app's own enter) → a reply with its quote lands | receive ×2 |
| 2 | 3–4 | 5.58–7.44 | light / amber | Reactions | 😂 chip pops on a message, count ticks 1 → 3 as two more people react | soft pop |
| 3 | 4–5 | 7.44–9.30 | dark / green | Read receipts | my DM line: "✓ Sent" cross-fades to cyan "✓✓ Seen" | send |
| 4 | 5–7 | 9.30–13.02 | light / cyan | Attachments | photo chip in composer, progress ring fills → send → image lands in the thread | send |
| 5 | 7–9 | 13.02–16.74 | dark / amber | Live chat list | new message lifts a row to the top (layout move), unread badge counts up, another row flips to "typing…", one shows "Call in progress" | receive |
| 6 | 9–11 | 16.74–20.46 | light / green | Ctrl+K search | switcher opens, "lisbon" types in, message hits list | none (keys too busy) |
| 7 | 11–13 | 20.46–24.18 | dark / cyan | 1:1 video call | incoming card rings (its ring leaves the avatar) → answer → the call stage opens, two video tiles | ringtone → connect chime |
| 8 | 13–16 | 24.18–29.77 | dark / green | Group call | tiles join the grid 2 → 3 → 6 (the mesh maximum), the cyan speaking ring moves person to person, one tile muted | join chime |
| 9 | 16–17 | 29.77–31.63 | dark / amber | Screen share | a shared screen takes the stage, faces drop to a strip | whoosh |
| 10 | 17–18 | 31.63–33.49 | light / ink | What you can't see | one worded beat: **One Worker. Durable Objects. Peer-to-peer calls.** | none |
| 11 | 18–20 | 33.49–37.21 | dark / cyan | End card | Sonora mark draws in, the wordmark wipes beside it, a stack logo row lands, `github.com/OsamaAkilaDev/Sonora`, music credit; holds ≥ 2 s | music out |

Cut for length: the phone layout and the theme reveal. They are the strongest extras if one beat earns its place less than expected.

## The harness (real UI, no mockups)

- `video/harness/` is a Vite page that imports the real components (`MessageLine`, `Composer`, `ChatList`, `CallStage` with `Tile`, the incoming call card, `Switcher`) with the app's `styles.css`.
- It runs on fixed in-memory data: a seeded TanStack Query cache and Zustand call state. There's no backend and no sockets.
- Capture mode waits for fonts, polyfills rAF and ResizeObserver for a hidden tab, then POSTs `outerHTML` plus the deduped, whole compiled stylesheets to a `/__save` middleware. That writes to `video/assets/app/`.
- Font URLs point to local copies. Shots get `animation:none; transition:none` so GSAP owns all motion.
- `index.template` with `<!--shot:name-->` placeholders goes through `build.mjs` to produce `index.html`.
- Each shot is scaled to fit whole and centred, never cropped. Text is ≥ 28 px at 1080, so a shot is about one panel at ~1.9×.
- **Avatars are stock photos (your call, v2).** The app itself only renders DiceBear `slice` art. The harness swaps each `<img>` src for the person's square photo before capture; the component, its size and its presence dot stay the app's own. `CREDITS.md` notes that the avatars are stand-ins.

## Content (fixed, deterministic)

- **"Lisbon in May"** (group of 4): karim, jonas, dev and you. They're splitting an Airbnb, and a photo of the flat is the attachment. Search for "lisbon" finds it.
- **DM with omar** (study partner): "sent you my notes for thursday" → Seen.
- **"Akila family"**: dad asks who is coming Sunday, and the reactions land on that.
- **"standup"** (remote team of 5): the group call and screen share. The shared screen is the repo's own `call-room.ts` in a plain code view.
- Times are plausible within one evening (18:40–19:05). There are no fake metrics anywhere.

## Stock media

Sources are Pexels or Pixabay only. Each file and its author go in `video/assets/CREDITS.md`, and the files go in `video/assets/stock/`.

- **Cast:** 11 identities in total, **all men** (your call, v3), varied in age and ethnicity, each with one face throughout. Every stock image and video is of men.
  - Chat-only people get Pexels or Pixabay portraits.
  - Anyone who appears on camera gets their avatar cut from a still of their own call clip, so the face in the chat list is the face in the tile.
  - Avatars are cropped square with the face centred, and graded together for consistent light.
- **Call feeds:** 6 people (the 1:1 contact, 4 standup members, and you). They're webcam-like, indoors, at eye level. Clips are trimmed, cropped to tile aspect and colour-matched. A tile marked speaking shows someone talking, and the muted tile shows someone listening.
- Each clip is a muted `<video>` driven by HyperFrames (`data-start`) in place of `srcObject`.
- There are no celebrities, no logos and no text in frame.

## Sound

- **Music:** pick from the shortlist below. It sits under the picture and enters at a strong bar with a 1.5 s fade under the end card.
- **SFX:** real recordings, used sparingly. Proposal: recorded marimba one-shots (University of Iowa MIS) on **the app's own pitches**, since its sound kit is a mallet voice in D major pentatonic.
  - The ring plays the app's real ring phrase (D5 F♯5 A5 D6).
  - Send, receive and connect each use a two- or three-note figure.
  - Two or three CC0 air whooshes (Kenney / Freesound) rotate on transitions.
  - Everything is premixed with numpy and ffmpeg into one wav on the beat grid.
- **Master:** −16 LUFS integrated and true peak < −1 dBTP, verified with `ebur128`.

### Music shortlist (audition clips in `video/music-options/`, loudness-matched 36 s from each track's first full section)

| # | Track | Artist / source | Licence | BPM | Feel |
|---|---|---|---|---|---|
| 1 | Newer Wave | Kevin MacLeod, incompetech.com | CC BY 4.0 | 110 | bright synth groove, uplifting |
| 2 | Inspired | Kevin MacLeod, incompetech.com | CC BY 4.0 | 120 | bright, calm, guitar + synths |
| 3 | Digital Lemonade | Kevin MacLeod, incompetech.com | CC BY 4.0 | 120 | bouncy, relaxed synths |
| 4 | Limit 70 | Kevin MacLeod, incompetech.com | CC BY 4.0 | 103 | calm groove, electric piano |
| 5 | Night Owl | Broke For Free, Free Music Archive | CC BY 3.0 | measured on pick | mellow electronic |
| 6 | Something Elated | Broke For Free, Free Music Archive | CC BY 3.0 | measured on pick | warm, lifting electronic |

BPMs for #1–4 come from incompetech's catalog. All of these will be re-measured with `hyperframes beats` before the grid is set.

## Banned

Glow and bloom, particles, gradients, glass cards, three-card rows, a title over a dimmed screenshot, fade-and-slide-up on everything, a corner logo, device frames, AI people or voices, marketing copy, a dark void with small floating UI, and text moving while it is read.

## Revision history

- **v1 (2026-11-27):** first brief, from a read of the repo; music shortlist and audition clips.
- **v2 (2026-11-27):** avatars are stock photos instead of DiceBear. On-camera people take their avatar from their own clip.
- **v3 (2026-11-27):** stock people are men only; the cast is renamed to match.
- **v4 (2026-11-27):** music is Night Owl by Broke For Free (CC BY 3.0). The grid is measured at 129 BPM with t=0 on the drop, giving 20 bars and 37.2 s. Beats are re-timed to bars, and each disc grows from the element that causes it.
- **v5 (2026-11-27):** stock media is in, all from Pexels and credited in `video/assets/CREDITS.md`. That's 11 avatars and 6 call clips, each cropped 4:3 around the face and levelled together. The Lisbon flat photo is Pexels 19966784. The standup's fourth member is now elias.
- **v6 (2026-11-27):** every call clip is now filmed by the person's own webcam or phone front camera, looking into the lens. Avatars for on-camera people come from those clips. kenji is back as the standup's fourth member, in place of elias.
- **v7 (2026-11-27):** more variety, with 12 men across a wider range of ages and backgrounds. ravi, an older man on his webcam, joins the standup, so the group call reaches the mesh maximum of 6 and the grid fills 3×2. omar is now a student on a low laptop-webcam angle. karim and dev have new faces that fit their names.
- **v8 (2026-11-28):** draft 1 rendered (21 bars, 39.07 s). SFX in: Iowa MIS yarn marimba on the app's own figures, retuned +11 cents to Night Owl (G major, so D pentatonic fits), and three Pixabay air whooshes rotating on the seams, peaks on the downbeat. `video/mix.py` premixes music and SFX (cues 3–8 LU under the music, whooshes ~10) and masters to −16.0 LUFS, −1.9 dBTP.
