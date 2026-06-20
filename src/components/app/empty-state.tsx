'use client';

import { NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateNote: () => void;
}

export function EmptyState({ onCreateNote }: EmptyStateProps) {
  return (
    <div className="flex flex-1 h-full flex-col items-center justify-center gap-4 text-center p-8">
      <NotebookPen className="h-12 w-12 text-muted-foreground/40" />
      <div>
        <h2 className="text-lg font-semibold">No notes yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first note to get started.
        </p>
      </div>
      <Button onClick={onCreateNote}>Create your first note</Button>
    </div>
  );
}
