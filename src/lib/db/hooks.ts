import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, type NoteMetadata } from './dexie';

/**
 * Cross-tab catalog sync. The note list lives in Dexie (IndexedDB), but Dexie
 * does not notify other open tabs when a row changes. This channel carries a
 * lightweight signal — the changed note id — so other tabs re-fetch the list.
 */
const catalogChannel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('anchor-notes-catalog')
    : null;

if (catalogChannel) {
  catalogChannel.onmessage = (event: MessageEvent<{ id?: string }>) => {
    // A change came from another tab: re-fetch lists and flag the note that
    // changed so the UI can show a "synced from another tab" pulse.
    window.dispatchEvent(
      new CustomEvent('notes-changed', { detail: { remote: true, id: event.data?.id } }),
    );
  };
}

function dispatchNotesChanged(id?: string) {
  // Same-tab listeners (this tab's own change — not remote).
  window.dispatchEvent(new CustomEvent('notes-changed', { detail: { remote: false, id } }));
  // Notify other tabs.
  catalogChannel?.postMessage({ id });
}

type NotesChangedDetail = { remote?: boolean; id?: string };

export function useNotes(): {
  notes: NoteMetadata[];
  loading: boolean;
  recentlyChanged: Set<string>;
} {
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const pulseTimers = new Map<string, ReturnType<typeof setTimeout>>();

    async function fetch() {
      const rows = await db.notes.filter((n) => !n.archived).toArray();
      rows.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
      if (!cancelled) {
        setNotes(rows);
        setLoading(false);
      }
    }

    fetch();

    function onChanged(e: Event) {
      fetch();
      const detail = (e as CustomEvent<NotesChangedDetail>).detail;
      // Only pulse for changes that arrived from another tab.
      if (detail?.remote && detail.id) {
        const id = detail.id;
        setRecentlyChanged((prev) => new Set(prev).add(id));
        const existing = pulseTimers.get(id);
        if (existing) clearTimeout(existing);
        pulseTimers.set(
          id,
          setTimeout(() => {
            if (cancelled) return;
            setRecentlyChanged((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            pulseTimers.delete(id);
          }, 1500),
        );
      }
    }

    window.addEventListener('notes-changed', onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('notes-changed', onChanged);
      pulseTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return { notes, loading, recentlyChanged };
}

export function useNote(id: string): NoteMetadata | null {
  const [note, setNote] = useState<NoteMetadata | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const row = await db.notes.get(id);
      if (!cancelled) setNote(row ?? null);
    }

    fetch();

    function onChanged() {
      fetch();
    }

    window.addEventListener('notes-changed', onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('notes-changed', onChanged);
    };
  }, [id]);

  return note;
}

export async function createNote(): Promise<string> {
  const id = uuidv4();
  const now = Date.now();
  await db.notes.add({
    id,
    title: 'Untitled',
    createdAt: now,
    updatedAt: now,
    pinned: false,
    archived: false,
  });
  dispatchNotesChanged(id);
  return id;
}

export async function updateNoteTitle(id: string, title: string): Promise<void> {
  await db.notes.update(id, { title, updatedAt: Date.now() });
  dispatchNotesChanged(id);
}

export async function toggleNotePin(id: string, pinned: boolean): Promise<void> {
  await db.notes.update(id, { pinned, updatedAt: Date.now() });
  dispatchNotesChanged(id);
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
  indexedDB.deleteDatabase(`anchor-note-${id}`);
  dispatchNotesChanged(id);
}
