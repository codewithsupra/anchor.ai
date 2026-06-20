import { Hero } from '@/src/components/landing/hero';
import { Features } from '@/src/components/landing/features';
import { GithubIcon } from '@/src/components/landing/github-icon';

const steps = [
  { n: 1, title: 'Write', body: 'Open Anchor and start typing. Saved instantly.' },
  { n: 2, title: 'Go offline', body: 'Keep working. Everything persists locally.' },
  { n: 3, title: 'Reconnect', body: 'Changes sync automatically. No manual save.' },
];

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
        How it works
      </h2>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {steps.map(({ n, title, body }) => (
          <div key={n} className="flex flex-col items-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 font-semibold text-white">
              {n}
            </div>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Tech() {
  return (
    <section className="bg-muted/30 py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="text-base leading-7 text-muted-foreground">
          Built with Yjs (CRDTs), IndexedDB, Tiptap, and WebSockets. Every
          architectural decision prioritizes your data ownership.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>
          Built by{' '}
          <a href="https://codewithsupra.github.io/MyPortfolio2026/" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-teal-600">
            Supratim Sarkar
          </a>
        </p>
        <a
          href="https://github.com/codewithsupra/anchor.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:text-foreground"
        >
          <GithubIcon className="h-4 w-4" />
          GitHub
        </a>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="flex-1">
      <Hero />
      <Features />
      <HowItWorks />
      <Tech />
      <Footer />
    </main>
  );
}
