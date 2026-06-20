'use client';

import { type Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Code, CodeXml, Link,
  Undo2, Redo2, PanelLeft,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ToolbarProps {
  editor: Editor | null;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, label, shortcut, icon }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={active}
            className={[
              'h-8 w-8 rounded p-1.5 transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              active
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            ].join(' ')}
          >
            {icon}
          </button>
        }
      />
      <TooltipContent side="bottom" className="text-xs">
        {label}{shortcut ? ` (${shortcut})` : ''}
      </TooltipContent>
    </Tooltip>
  );
}

function VSep() {
  return <Separator orientation="vertical" className="mx-1 h-5" />;
}

export function Toolbar({ editor, sidebarOpen, onToggleSidebar }: ToolbarProps) {
  const disabled = !editor;

  function cmd(fn: () => void) {
    return () => { if (editor) fn(); };
  }

  function handleLink() {
    if (!editor) return;
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt('URL');
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }
  }

  return (
    <TooltipProvider delay={400}>
      <div className="flex items-center border-b bg-background sticky top-0 z-10">
        {/* Hamburger — shown only when sidebar is hidden */}
        {!sidebarOpen && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open sidebar"
            title="Toggle sidebar (⌘/)"
            className="h-9 w-9 shrink-0 flex items-center justify-center border-r text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
      <div className="flex items-center gap-0.5 px-2 py-1 overflow-x-auto scrollbar-none flex-nowrap flex-1">
        {/* Group 1: Inline formatting */}
        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          label="Bold" shortcut="⌘B"
          active={editor?.isActive('bold')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleBold().run())}
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          label="Italic" shortcut="⌘I"
          active={editor?.isActive('italic')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleItalic().run())}
        />
        <ToolbarButton
          icon={<Underline className="h-4 w-4" />}
          label="Underline" shortcut="⌘U"
          active={editor?.isActive('underline')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleUnderline().run())}
        />
        <ToolbarButton
          icon={<Strikethrough className="h-4 w-4" />}
          label="Strikethrough"
          active={editor?.isActive('strike')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleStrike().run())}
        />

        <VSep />

        {/* Group 2: Headings */}
        <ToolbarButton
          icon={<Heading1 className="h-4 w-4" />}
          label="Heading 1"
          active={editor?.isActive('heading', { level: 1 })}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleHeading({ level: 1 }).run())}
        />
        <ToolbarButton
          icon={<Heading2 className="h-4 w-4" />}
          label="Heading 2"
          active={editor?.isActive('heading', { level: 2 })}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())}
        />
        <ToolbarButton
          icon={<Heading3 className="h-4 w-4" />}
          label="Heading 3"
          active={editor?.isActive('heading', { level: 3 })}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleHeading({ level: 3 }).run())}
        />

        <VSep />

        {/* Group 3: Lists */}
        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          label="Bullet List"
          active={editor?.isActive('bulletList')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleBulletList().run())}
        />
        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          label="Ordered List"
          active={editor?.isActive('orderedList')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleOrderedList().run())}
        />
        <ToolbarButton
          icon={<ListChecks className="h-4 w-4" />}
          label="Task List"
          active={editor?.isActive('taskList')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleTaskList().run())}
        />

        <VSep />

        {/* Group 4: Code & Link */}
        <ToolbarButton
          icon={<Code className="h-4 w-4" />}
          label="Inline Code"
          active={editor?.isActive('code')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleCode().run())}
        />
        <ToolbarButton
          icon={<CodeXml className="h-4 w-4" />}
          label="Code Block"
          active={editor?.isActive('codeBlock')}
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().toggleCodeBlock().run())}
        />
        <ToolbarButton
          icon={<Link className="h-4 w-4" />}
          label="Link"
          active={editor?.isActive('link')}
          disabled={disabled}
          onClick={handleLink}
        />

        <VSep />

        {/* Group 5: History (via Yjs Collaboration extension) */}
        <ToolbarButton
          icon={<Undo2 className="h-4 w-4" />}
          label="Undo" shortcut="⌘Z"
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().undo().run())}
        />
        <ToolbarButton
          icon={<Redo2 className="h-4 w-4" />}
          label="Redo" shortcut="⌘⇧Z"
          disabled={disabled}
          onClick={cmd(() => editor!.chain().focus().redo().run())}
        />
      </div>
      </div>
    </TooltipProvider>
  );
}
