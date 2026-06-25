<div align="center">

# Anchor

**Notes that never disappear. Sync that just works. Offline by default.**

[![Live App](https://img.shields.io/badge/Live%20App-anchor.ai-0f172a?style=for-the-badge&logo=vercel&logoColor=white)](https://anchor-19sfa4pg2-supratims-projects-a44a3625.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Yjs CRDT](https://img.shields.io/badge/CRDT-Yjs-f97316?style=for-the-badge)](https://yjs.dev)
[![Offline First](https://img.shields.io/badge/Offline-First-10b981?style=for-the-badge)](https://offlinefirst.org)

*Every keystroke saved locally first. Syncs across devices automatically. Conflicts resolved without asking you.*

**[Live App](https://anchor-19sfa4pg2-supratims-projects-a44a3625.vercel.app) · [Architecture](#how-it-works) · [Report Bug](https://github.com/codewithsupra/anchor.ai/issues/new)**

</div>

---

## Demo

> **30-second demo** — open two windows side by side, type in one, watch it appear in the other. Go offline, keep typing, come back online. Everything syncs. No data lost, no conflicts.

<!-- Replace this link with your Loom / YouTube URL after recording -->
[![Watch the Anchor Demo](https://img.shields.io/badge/▶%20Watch%20Demo-30%20seconds-0f172a?style=for-the-badge&logo=youtube&logoColor=white)](https://anchor-19sfa4pg2-supratims-projects-a44a3625.vercel.app)

**What the demo shows:**
1. Open the same note in two browser windows side by side
2. Type in the left window — characters appear in the right window in real time
3. **DevTools → Network → Offline** — keep typing in the left window
4. Go back online — everything syncs, zero data lost
5. No "which version do you want to keep?" prompt. Ever.

---

## The Problem

Most note apps treat the server as the source of truth. Your browser is just a thin client. That means:

- No internet? Loading spinner. Can't write.
- Network hiccup? Changes lost or overwritten.
- Two devices both offline? "Conflict detected — pick one."

**Anchor inverts this.** The browser is the database. The server is optional.

---

## What Makes Anchor Different

| | Traditional Notes App | Anchor |
|---|---|---|
| Works offline | Partial / spinner | ✅ Full — browser is the DB |
| Keystroke survival | Server-dependent | ✅ IndexedDB — survives crashes |
| Multi-device sync | Last-write-wins | ✅ CRDT merge — both versions survive |
| Conflict resolution | Manual | ✅ Automatic — character-level merge |
| App load time | Grows with data | ✅ Constant — per-note isolation |
| Server dependency | Required | ✅ Stateless relay — easily self-hosted |

---

## How It Works

### Local-first architecture

Every note is a **Yjs Y.Doc** — a CRDT (Conflict-free Replicated Data Type) stored in IndexedDB via `y-indexeddb`. Every keystroke is written locally first. The network is optional.

The sync server is stateless — it relays Yjs update messages between clients and stores nothing permanently. If the server is unreachable, the app keeps working. When connectivity returns, it exchanges state vectors with each client and replays only the missing operations.

### One Y.Doc per note

Each note gets its own Y.Doc keyed by note ID. A separate **Dexie** catalog stores note metadata (title, timestamp, sort order). This means app load time is constant regardless of how many notes you have — you never pay the cost of loading every document's CRDT history just to open the sidebar.

### Conflict resolution

Yjs uses a variant of the **LSEQ** algorithm for text. If you type "hello" on your laptop and "world" at the same cursor position on your phone while both are offline, Yjs doesn't pick a winner — it merges at the character level using each operation's logical timestamp and author ID. Both devices converge to the same document when they reconnect, deterministically, without server arbitration.

### Sync lifecycle

```
t0  Online    → Y.Doc updates → IndexedDB + relay server
t1  Offline   → Y.Doc updates → IndexedDB only (queued)
t2  Reconnect → state vector exchange with relay → missing ops replayed
t3  Other device → receives ops → CRDT merge → identical document
```

This is the same conflict-free replication technology that powers **Figma's collaborative canvas** and **Notion's real-time editing** — running in your browser with a stateless relay.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Routing, SSR landing, deployment |
| Editor | Tiptap v2 + ProseMirror | Headless rich text, native Yjs extension |
| CRDT engine | Yjs | Battle-tested — used by Notion, JetBrains, 20k+ apps |
| Local persistence | y-indexeddb | Official Yjs adapter, zero config |
| Tab sync | y-webrtc (BroadcastChannel) | Sub-millisecond same-origin tab sync, no signaling server |
| Cross-device sync | y-websocket | Stateless relay, auto-reconnect built in |
| Metadata store | Dexie.js | Clean IndexedDB wrapper for structured note catalog |
| Styling | Tailwind CSS + shadcn/ui | Consistent, accessible, fast |
| Sync server | Node.js y-websocket | Deployed on Railway |
| Deployment | Vercel (frontend) + Railway (sync server) | Zero-config deploys |

---

## Architecture Decisions

**Why one Y.Doc per note instead of one shared document?**
Per-note isolation means constant-time app load. Loading a single shared document would require deserializing the entire CRDT history of every note on startup — that's O(n) in note count. Isolation keeps it O(1). Cost: more Y.Doc lifecycle management in the client.

**Why y-webrtc with `signaling: []` for tab sync?**
With an empty signaling array, y-webrtc falls back to BroadcastChannel — no external server, sub-millisecond tab-to-tab sync, zero cost. Cross-device sync is handled separately via y-websocket, keeping the two concerns cleanly separated.

**Why Dexie for the metadata catalog instead of Yjs?**
Note titles and timestamps are structured relational data — you want to sort and filter them. Yjs is optimized for collaborative text sequences, not queryable catalogs. Mixing them would be fighting the tool. Dexie gives you `.orderBy()`, `.where()`, and `.count()` on IndexedDB without fighting CRDT semantics.

**Why disable StarterKit history in Tiptap?**
The built-in undo/redo stack operates on editor state snapshots. In a CRDT document, rewinding editor state while the CRDT keeps advancing causes divergence. Yjs ships its own `UndoManager` that operates on CRDT operations directly — that's what Anchor uses instead.

---

## Local Setup

```bash
# Prerequisites: Node.js 18+

# 1. Clone
git clone https://github.com/codewithsupra/anchor.ai.git
cd anchor.ai

# 2. Install
npm install

# 3. Start the sync server (separate terminal)
cd sync-server && npm install && npm start
# Runs on ws://localhost:1234

# 4. Configure and run the app
cp .env.example .env.local
# Set NEXT_PUBLIC_SYNC_SERVER_URL=ws://localhost:1234
npm run dev
# Open http://localhost:3000

# 5. Test multi-tab sync
# Open http://localhost:3000/app in two windows — type in one, watch the other

# 6. Test offline
# DevTools → Network → Offline → keep typing → come back online → everything synced
```

---

## Roadmap

- [ ] Clerk auth — notes tied to account, accessible on any device after login
- [ ] Neon/Postgres backup for note metadata
- [ ] Collaboration cursors — see who's typing and where
- [ ] Version history via Yjs snapshots
- [ ] Chrome extension for one-click capture
- [ ] End-to-end encryption option

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

Built by **[Supratim Sarkar](https://linkedin.com/in/supratimsarkar99)**&nbsp;·&nbsp;
[LinkedIn](https://linkedin.com/in/supratimsarkar99)&nbsp;·&nbsp;
[GitHub](https://github.com/codewithsupra)&nbsp;·&nbsp;
[Live App](https://anchor-19sfa4pg2-supratims-projects-a44a3625.vercel.app)

*Open to full-stack / AI engineering roles — let's build something great together.*

</div>
