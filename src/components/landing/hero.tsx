import Link from 'next/link';
import { Anchor, ArrowRight } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, Show } from '@clerk/nextjs';
import { GithubIcon } from './github-icon';
import { ThemeToggle } from '@/src/components/theme-toggle';

export function Hero() {
  return (
    <section className="relative">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 font-semibold">
          <Anchor className="h-5 w-5 text-teal-600" />
          Anchor
        </span>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton>
              <button className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <ThemeToggle />
          <Link
            href="/app"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            Open Anchor
          </Link>
        </div>
      </nav>

      {/* Hero content */}
      <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Your notes. Your device. Your rules.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          Anchor is a local-first note-taking app. Every keystroke is saved to
          your browser instantly. Works offline. Syncs live between tabs. No
          cloud required.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/app"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 text-base font-medium text-white transition-colors hover:bg-teal-700 sm:w-auto"
          >
            Open Anchor
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/codewithsupra/anchor.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 text-base font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            <GithubIcon className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
