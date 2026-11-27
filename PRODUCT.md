# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Single Cloudflare Worker: Hono API (Nest-style modules, Zod), D1 + Drizzle, Durable Objects (WebSocket Hibernation) for realtime/presence/call signaling, R2 for files. Frontend: Vite + React + TanStack Router + TanStack Query, Tailwind v4, Phosphor icons only, DiceBear `slice` (v11) default avatars. Latest stable, mutually compatible versions only. Calls: WebRTC P2P (mesh, ≤6), own signaling, TURN fallback via config.

## Users

Friends and small groups first: people hanging out, chatting and calling each other. Must also hold up for a small team coordinating (calls, screen share).

## Product Purpose

Real-time 1:1 and group messaging plus voice/video calls and screen share. Success: it feels instant, calls connect reliably, and nothing gets between people and their conversations.

## Positioning

- Speed: optimistic everything, keyboard-first, no spinners on the common path.
- Self-owned calls: peer-to-peer media on our own signaling; no vendor SDK or trial that can switch off.
- Calm: no feeds, no gamification, no noise. People and conversations only.
- Also a portfolio showcase of engineering and design craft.

## Capabilities and Constraints

v1: auth with revocable sessions; friends (requests, block); DMs and group chats; presence, typing, read receipts; replies, edits, deletes, reactions, attachments; unread counts; message search; quick switcher (Ctrl+K); per-chat drafts; voice/video calls, screen share, device picker, speaking indicators, persistent mini call bar; settings (profile, sessions, theme).
Deferred: Beacons (community servers). Group calls capped at ~6 (mesh).
Terminology: "Sonora".

## Brand Commitments

Name: Sonora. Dark-first identity with a cyan accent (legacy "cyanora"), to be rebuilt properly. Font may change.

## Evidence on Hand

No real users, testimonials or metrics. Do not fabricate any.

## Product Principles

1. Instant over impressive: perceived latency is the feature.
2. People, not product: UI recedes behind conversations and faces.
3. Reliable calls beat feature count.
4. Craft in the details: every state (empty, loading, error, offline) is designed.

## Accessibility & Inclusion

WCAG 2.2 AA; full keyboard operation; respect reduced motion.
