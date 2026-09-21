import { WifiOff, GitMerge, Users } from 'lucide-react';

const features = [
  {
    icon: WifiOff,
    title: 'Offline by Default',
    body: 'Your notes live in your browser, not on a server. Close your laptop, lose your connection — your work is always there.',
  },
  {
    icon: GitMerge,
    title: 'Conflict-Free Merges',
    body: 'Edit the same note in two tabs at once. Yjs, a CRDT, merges every change automatically, so neither edit is lost.',
  },
  {
    icon: Users,
    title: 'Real-Time Collaboration',
    body: 'Open the same note in two tabs. Type in both. Watch the magic. Every keystroke syncs between tabs instantly, with no server.',
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-6 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border p-6">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/40">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
