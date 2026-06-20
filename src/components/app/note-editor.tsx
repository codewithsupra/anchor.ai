'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import * as Y from 'yjs';
import { yjsProvider } from '@/src/lib/crdt/yjs-provider';
import { updateNoteTitle } from '@/src/lib/db/hooks';
import { db } from '@/src/lib/db/dexie';

interface NoteEditorProps {
  noteId: string;
  onTitleExtracted?: (title: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
}

function EditorSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-12 animate-pulse">
      <div className="h-8 bg-muted rounded w-2/5 mb-6" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}

interface EditorInnerProps {
  noteId: string;
  ydoc: Y.Doc;
  onTitleExtracted?: (title: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
}

function EditorInner({ noteId, ydoc, onTitleExtracted, onEditorReady }: EditorInnerProps) {
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updatedAtDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        undoRedo: false,
        heading: { levels: [1, 2, 3] },
        codeBlock: {},
      }),
      Collaboration.configure({ document: ydoc }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Underline,
      Typography,
    ],
    onUpdate({ editor: e }) {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = setTimeout(() => {
        const firstLine = e.getText().split('\n')[0].slice(0, 100);
        onTitleExtracted?.(firstLine);
        updateNoteTitle(noteId, firstLine || 'Untitled');
      }, 300);

      if (updatedAtDebounceRef.current) clearTimeout(updatedAtDebounceRef.current);
      updatedAtDebounceRef.current = setTimeout(() => {
        db.notes.update(noteId, { updatedAt: Date.now() });
      }, 1000);
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.focus();
      onEditorReady?.(editor);
    }
    return () => {
      onEditorReady?.(null);
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      if (updatedAtDebounceRef.current) clearTimeout(updatedAtDebounceRef.current);
    };
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-12">
      <EditorContent
        editor={editor}
        className="prose prose-neutral dark:prose-invert max-w-none text-base leading-[1.7] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[60vh] [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  );
}

export function NoteEditor({ noteId, onTitleExtracted, onEditorReady }: NoteEditorProps) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);

  useEffect(() => {
    let cancelled = false;
    setYdoc(null);

    const doc = yjsProvider.getDoc(noteId);

    yjsProvider.isLoaded(noteId).then(() => {
      if (cancelled) return;
      setYdoc(doc);
    });

    return () => {
      cancelled = true;
    };
  }, [noteId]);

  if (!ydoc) return <EditorSkeleton />;

  return (
    <EditorInner
      noteId={noteId}
      ydoc={ydoc}
      onTitleExtracted={onTitleExtracted}
      onEditorReady={onEditorReady}
    />
  );
}
