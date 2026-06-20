'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { useNotes, createNote, deleteNote, toggleNotePin } from '@/src/lib/db/hooks';
import { yjsProvider } from '@/src/lib/crdt/yjs-provider';
import { NoteSidebar } from '@/src/components/app/note-sidebar';
import { NoteEditor } from '@/src/components/app/note-editor';
import { Toolbar } from '@/src/components/app/toolbar';
import { EmptyState } from '@/src/components/app/empty-state';
import { OfflineIndicator } from '@/src/components/app/offline-indicator';

export default function AppPage() {
  const { notes, loading } = useNotes();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-select first note on load
  useEffect(() => {
    if (!loading && notes.length > 0 && activeNoteId === null) {
      setActiveNoteId(notes[0].id);
    }
  }, [loading, notes, activeNoteId]);

  // Collapse sidebar by default on narrow screens
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // Online toast
  useEffect(() => {
    let wasOffline = false;
    const handleOffline = () => { wasOffline = true; };
    const handleOnline = () => {
      if (wasOffline) { toast.success('Back online — changes saved locally'); wasOffline = false; }
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleCreateNote = useCallback(async () => {
    const id = await createNote();
    setActiveNoteId(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
    toast.success('Note created');
  }, []);

  const handleDeleteNote = useCallback(async (id: string) => {
    const confirmed = window.confirm('Delete this note? This cannot be undone.');
    if (!confirmed) return;
    await deleteNote(id);
    yjsProvider.destroyDoc(id);
    if (activeNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      setActiveEditor(null);
    }
    toast.success('Note deleted');
  }, [activeNoteId, notes]);

  const handleTogglePin = useCallback(async () => {
    if (!activeNoteId) return;
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;
    await toggleNotePin(activeNoteId, !note.pinned);
    toast.success(note.pinned ? 'Note unpinned' : 'Note pinned');
  }, [activeNoteId, notes]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === 'n') {
        e.preventDefault();
        handleCreateNote();
      } else if (e.key === 'Backspace' && activeNoteId) {
        e.preventDefault();
        handleDeleteNote(activeNoteId);
      } else if (e.key === 'p' && activeNoteId) {
        e.preventDefault();
        handleTogglePin();
      } else if (e.key === '/') {
        e.preventDefault();
        setSidebarOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCreateNote, handleDeleteNote, handleTogglePin, activeNoteId]);

  return (
    <div className="flex h-full w-full relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'fixed md:relative z-30 md:z-auto h-full transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          sidebarOpen ? 'md:flex' : 'md:hidden',
        ].join(' ')}
      >
        <NoteSidebar
          activeNoteId={activeNoteId}
          onSelectNote={(id) => {
            setActiveNoteId(id);
            if (window.innerWidth < 768) setSidebarOpen(false);
          }}
          onDeleteNote={handleDeleteNote}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onCreateNote={handleCreateNote}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <OfflineIndicator />
        {activeNoteId ? (
          <>
            <Toolbar
              editor={activeEditor}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((o) => !o)}
            />
            <div className="flex-1 overflow-y-auto">
              <NoteEditor
                key={activeNoteId}
                noteId={activeNoteId}
                onTitleExtracted={() => {}}
                onEditorReady={setActiveEditor}
              />
            </div>
          </>
        ) : (
          <EmptyState onCreateNote={handleCreateNote} />
        )}
      </div>
    </div>
  );
}
