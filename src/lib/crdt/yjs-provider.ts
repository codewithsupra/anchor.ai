import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { BroadcastProvider } from './broadcast-provider';

class YjsNoteProvider {
  private docs = new Map<string, Y.Doc>();
  private persistences = new Map<string, IndexeddbPersistence>();
  private broadcasts = new Map<string, BroadcastProvider>();

  getDoc(noteId: string): Y.Doc {
    if (this.docs.has(noteId)) return this.docs.get(noteId)!;
    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(`anchor-note-${noteId}`, doc);
    const broadcast = new BroadcastProvider(noteId, doc);
    this.docs.set(noteId, doc);
    this.persistences.set(noteId, persistence);
    this.broadcasts.set(noteId, broadcast);
    return doc;
  }

  destroyDoc(noteId: string): void {
    this.broadcasts.get(noteId)?.destroy();
    this.persistences.get(noteId)?.destroy();
    this.docs.get(noteId)?.destroy();
    this.broadcasts.delete(noteId);
    this.persistences.delete(noteId);
    this.docs.delete(noteId);
  }

  destroyAll(): void {
    for (const id of this.docs.keys()) this.destroyDoc(id);
  }

  isLoaded(noteId: string): Promise<boolean> {
    this.getDoc(noteId);
    const persistence = this.persistences.get(noteId)!;
    return persistence.whenSynced.then(() => true);
  }
}

export const yjsProvider = new YjsNoteProvider();
