# Anchor — Local-First Notes

A note-taking app that works offline, syncs across devices, and never loses your work.

> Write anywhere. Your notes live in your browser. No account required.

## How it works

Anchor is built on three pillars:

1. **IndexedDB as the primary store** — Every note is persisted to the browser's IndexedDB the moment you type. No network required.

2. **CRDTs via Yjs** — Each note is a `Y.Doc` (a Conflict-free Replicated Data Type). Concurrent edits from multiple tabs or devices are merged automatically — no "last write wins" data loss.

3. **BroadcastChannel for real-time multi-tab sync** — When you edit a note in one tab, the Y.Doc update is broadcast to every other open tab instantly via the browser's native `BroadcastChannel` API. The note catalog (create/delete/rename) syncs the same way.

```
Tab A  ──update──▶  BroadcastChannel(`anchor-sync-${noteId}`)  ──▶  Tab B
                                                                       │
                                                                  Y.applyUpdate()
                                                                       │
                                                              IndexedDB (y-indexeddb)
```

On first load, each tab broadcasts a `request-state` message. Any other open tab that has already loaded the Y.Doc replies with its full state. This means a freshly opened tab converges immediately even if the IndexedDB write hasn't flushed yet.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Editor | Tiptap v3 (ProseMirror) |
| CRDT | Yjs + y-indexeddb |
| Local DB | Dexie (IndexedDB wrapper) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Toasts | Sonner |
| Fonts | Geist (Vercel) |

## Features

- Offline-first — works with zero network
- Real-time sync across tabs (BroadcastChannel + Yjs)
- Rich text editor — bold, italic, headings, lists, task lists, code blocks, links
- Note catalog with search, pin, and delete
- Keyboard shortcuts: `⌘N` new note · `⌘Backspace` delete · `⌘P` pin · `⌘/` toggle sidebar
- Mobile responsive — sidebar collapses to hamburger on narrow screens
- Zero backend for Phase 1 — fully static deployment

## Local Setup

```bash
git clone https://github.com/codewithsupra/anchor.ai.git
cd anchor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables needed.

## Deploy to Vercel

Import the repo at [vercel.com/new](https://vercel.com/new). No environment variables required — everything runs client-side.

## Project Structure

```
app/
  page.tsx          # Landing page (server component)
  app/
    page.tsx        # Notes app shell (client)
    layout.tsx      # Full-height flex container
src/
  lib/
    db/
      dexie.ts      # Note metadata schema
      hooks.ts      # useNotes, createNote, deleteNote, …
    crdt/
      yjs-provider.ts       # Y.Doc lifecycle + y-indexeddb
      broadcast-provider.ts # Cross-tab content sync
      sync-manager.ts       # Phase 2: WebSocket stub
  components/
    app/
      note-editor.tsx   # Tiptap editor wired to Y.Doc
      note-sidebar.tsx  # Note list, search, status
      toolbar.tsx       # Formatting toolbar
```

## Architecture Notes

- `y-indexeddb` persists each Y.Doc to its own IndexedDB database (`anchor-note-{uuid}`). It reads once on startup and writes on every Y.Doc update.
- `BroadcastProvider` (custom, ~60 lines) handles the live cross-tab channel. It runs in parallel with persistence — remote updates are also persisted by y-indexeddb because the two providers use distinct origin objects.
- The Dexie `anchor-db` database stores only note metadata (id, title, timestamps, pinned, archived). Document content lives exclusively in the Yjs / y-indexeddb layer.
- Tiptap's built-in history is disabled (`undoRedo: false` in StarterKit) and replaced by `@tiptap/extension-collaboration`'s CRDT-aware undo stack.

## Roadmap

- [ ] Phase 2: WebSocket server for cross-device sync (`sync-manager.ts`)
- [ ] Clerk authentication + per-user note namespacing
- [ ] Dark mode toggle
- [ ] Export to Markdown / PDF

---

Built by [Supratim Sarkar](https://codewithsupra.github.io/MyPortfolio2026/)
