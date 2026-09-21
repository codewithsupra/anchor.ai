<div align="center">

# Anchor

**Local-first notes. Every keystroke saved in your browser. Works offline.**

[![Live App](https://img.shields.io/badge/Live%20App-anchor-0f172a?style=for-the-badge&logo=vercel&logoColor=white)](https://anchor-ai-indol.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Yjs CRDT](https://img.shields.io/badge/CRDT-Yjs-f97316?style=for-the-badge)](https://yjs.dev)

**[Live App](https://anchor-ai-indol.vercel.app) · [How it works](#how-it-works) · [Report Bug](https://github.com/codewithsupra/anchor.ai/issues/new)**

</div>

---

## What it does today

- **Offline by default.** Every note is a Yjs document persisted to IndexedDB on every keystroke. There is no server in the write path, so losing your connection changes nothing.
- **Live tab-to-tab sync.** Open the same note in two tabs of the same browser and type in both: edits merge through Yjs, with no server involved.
- **Conflict-free merges.** Concurrent edits from two tabs are merged by the CRDT, not by "last write wins."

**Not built yet:** cross-device sync. `SyncManager` is a stub for a WebSocket relay (see [Roadmap](#roadmap)); today, notes live in one browser.

### Try it

1. Open [the app](https://anchor-ai-indol.vercel.app/app) in two tabs side by side.
2. Type in one tab; the text appears in the other.
3. DevTools → Network → Offline, keep typing, reload the tab: everything is still there.

---

## How it works

### One Y.Doc per note, persisted locally

Each note is its own `Y.Doc`, persisted with `y-indexeddb` under `anchor-note-<id>`. A separate **Dexie** table stores metadata (title, timestamps, order), so the sidebar loads without deserializing every note's CRDT history.

### Tab sync with BroadcastChannel (`src/lib/crdt/broadcast-provider.ts`)

A small custom provider (~70 lines) instead of a library:

- Every local Yjs update is posted on a per-note `BroadcastChannel`.
- Incoming updates are applied with the provider itself as the **origin**, so they are neither echoed back nor re-broadcast.
- A newly opened tab sends `request-state`; open tabs reply with their full state, so the new tab converges immediately.

`y-indexeddb` persists but does not broadcast between tabs; this provider fills exactly that gap.

### Conflict resolution

Yjs merges concurrent text edits with its **YATA** algorithm: each insertion carries a unique ID and a reference to its neighbours, so every replica applies the same deterministic ordering and converges to the same text without a coordinator.

### Undo

StarterKit's snapshot-based undo is disabled (`undoRedo: false`); undo/redo comes from Tiptap's Collaboration extension, which operates on Yjs operations and stays consistent with the CRDT.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Editor | Tiptap 3 + ProseMirror, Collaboration extension |
| CRDT | Yjs |
| Local persistence | y-indexeddb (documents), Dexie (metadata) |
| Tab sync | Custom `BroadcastProvider` (BroadcastChannel API) |
| Auth | Clerk |
| Styling | Tailwind CSS + shadcn/ui |
| Tests | Vitest |

---

## Local setup

```bash
git clone https://github.com/codewithsupra/anchor.ai.git
cd anchor.ai
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests
```

---

## Tests

`npm test` runs Vitest against the sync layer using real Yjs documents and Node's built-in `BroadcastChannel`:

- two tabs converge on the same text, in both directions
- a tab opened later receives the existing content via `request-state`
- concurrent edits made while "offline" merge without losing either side
- updates are not echoed back to their sender
- different notes never leak into each other
- a destroyed provider stops sending and receiving

---

## Roadmap

- [ ] Cross-device sync through a stateless `y-websocket` relay (the `SyncManager` stub)
- [ ] Notes tied to a Clerk account
- [ ] Collaboration cursors
- [ ] Version history via Yjs snapshots

---

<div align="center">

Built by **[Supratim Sarkar](https://supratim-software-portfolio.vercel.app)** · [LinkedIn](https://linkedin.com/in/supratimsarkar99) · [GitHub](https://github.com/codewithsupra)

</div>
