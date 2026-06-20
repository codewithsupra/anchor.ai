import Dexie, { type Table } from 'dexie';

export interface NoteMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  archived: boolean;
}

class AnchorDB extends Dexie {
  notes!: Table<NoteMetadata>;

  constructor() {
    super('anchor-db');
    this.version(1).stores({
      notes: 'id, updatedAt, pinned, archived',
    });
  }
}

export const db = new AnchorDB();
