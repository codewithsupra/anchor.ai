'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Anchor, Plus, Search, Pin, Ellipsis, PanelLeftClose } from 'lucide-react';
import { ThemeToggle } from '@/src/components/theme-toggle';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserButton } from '@clerk/nextjs';
import { useNotes, toggleNotePin } from '@/src/lib/db/hooks';
import type { NoteMetadata } from '@/src/lib/db/dexie';

interface NoteSidebarProps {
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleSidebar: () => void;
  onCreateNote: () => void;
}

interface NoteItemProps {
  note: NoteMetadata;
  active: boolean;
  synced: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function NoteItem({ note, active, synced, onSelect, onDelete }: NoteItemProps) {
  return (
    <div
      className={[
        'group flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors',
        active ? 'bg-accent' : 'hover:bg-accent/60',
      ].join(' ')}
      onClick={() => onSelect(note.id)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          {note.pinned && (
            <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span
            className={[
              'truncate text-sm font-medium leading-snug rounded px-1 -mx-1 transition-colors',
              synced ? 'animate-sync-pulse' : '',
            ].join(' ')}
          >
            {note.title || 'Untitled'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 h-6 w-6 flex items-center justify-center rounded hover:bg-background/80 transition-opacity shrink-0 mt-0.5"
          onClick={(e) => e.stopPropagation()}
          aria-label="Note options"
        >
          <Ellipsis className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              toggleNotePin(note.id, !note.pinned);
            }}
          >
            {note.pinned ? 'Unpin' : 'Pin'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function NoteSidebar({
  activeNoteId,
  onSelectNote,
  onDeleteNote,
  onToggleSidebar,
  onCreateNote,
}: NoteSidebarProps) {
  const { notes, loading, recentlyChanged } = useNotes();
  const [query, setQuery] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside className="w-70 flex flex-col border-r bg-background h-full shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="flex items-center gap-2 font-semibold text-sm">
          <Anchor className="h-5 w-5" aria-hidden="true" />
          Anchor
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCreateNote}
            aria-label="New note"
            title="New note (⌘N)"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Close sidebar"
            title="Toggle sidebar (⌘/)"
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Note list */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="px-3 py-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-1.5">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground text-center">
            {query ? 'No notes match your search.' : 'No notes yet. Create one!'}
          </p>
        ) : (
          filtered.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              active={note.id === activeNoteId}
              synced={recentlyChanged.has(note.id)}
              onSelect={onSelectNote}
              onDelete={onDeleteNote}
            />
          ))
        )}
      </ScrollArea>

      {/* Status footer */}
      <div className="px-4 py-2.5 border-t flex items-center gap-2 text-xs text-muted-foreground">
        <UserButton />
        <span
          className={[
            'h-2 w-2 rounded-full shrink-0',
            isOnline ? 'bg-green-500' : 'bg-orange-400',
          ].join(' ')}
        />
        {isOnline ? 'Synced' : 'Offline — changes saved locally'}
      </div>
    </aside>
  );
}
