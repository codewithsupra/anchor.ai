import * as Y from 'yjs';

export class SyncManager {
  connect(_noteId: string, _doc: Y.Doc): void { /* Phase 2: WebSocket sync */ }
  disconnect(_noteId: string): void { /* Phase 2: WebSocket sync */ }
}

export const syncManager = new SyncManager();
