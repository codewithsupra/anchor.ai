import { describe, it, expect, afterEach } from 'vitest';
import * as Y from 'yjs';
import { BroadcastProvider } from '../broadcast-provider';

// Node ships a real BroadcastChannel, so these tests exercise the actual
// cross-"tab" message path, not a mock.
const tick = () => new Promise((r) => setTimeout(r, 30));

const cleanup: Array<() => void> = [];
afterEach(() => {
  while (cleanup.length) cleanup.pop()!();
});

function tab(noteId: string) {
  const doc = new Y.Doc();
  const provider = new BroadcastProvider(noteId, doc);
  cleanup.push(() => {
    provider.destroy();
    doc.destroy();
  });
  return { doc, provider, text: () => doc.getText('t').toString() };
}

describe('BroadcastProvider', () => {
  it('syncs edits between two open tabs, in both directions', async () => {
    const a = tab('note-1');
    const b = tab('note-1');
    await tick();

    a.doc.getText('t').insert(0, 'hello');
    await tick();
    expect(b.text()).toBe('hello');

    b.doc.getText('t').insert(5, ' world');
    await tick();
    expect(a.text()).toBe('hello world');
  });

  it('gives a tab opened later the existing content via request-state', async () => {
    const a = tab('note-2');
    a.doc.getText('t').insert(0, 'written before the second tab opened');
    await tick();

    const late = tab('note-2');
    await tick();
    expect(late.text()).toBe('written before the second tab opened');
  });

  it('merges concurrent edits made while disconnected without losing either', async () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    a.getText('t').insert(0, 'from A');
    b.getText('t').insert(0, 'from B');

    // Both tabs reconnect: each requests the other's state on open.
    const pa = new BroadcastProvider('note-3', a);
    const pb = new BroadcastProvider('note-3', b);
    cleanup.push(() => { pa.destroy(); pb.destroy(); a.destroy(); b.destroy(); });
    await tick();

    const ta = a.getText('t').toString();
    const tb = b.getText('t').toString();
    expect(ta).toBe(tb); // converged
    expect(ta).toContain('from A');
    expect(ta).toContain('from B');
  });

  it('does not echo an applied remote update back to the channel', async () => {
    const a = tab('note-4');
    const b = tab('note-4');
    await tick();

    const seen: string[] = [];
    const spy = new BroadcastChannel('anchor-sync-note-4');
    spy.onmessage = (e: MessageEvent) => seen.push(e.data.type);
    cleanup.push(() => spy.close());

    a.doc.getText('t').insert(0, 'x');
    await tick();

    // A broadcasts exactly one update; B applies it with itself as origin
    // and must not re-broadcast it.
    expect(seen.filter((t) => t === 'update')).toHaveLength(1);
    expect(b.text()).toBe('x');
  });

  it('keeps different notes isolated', async () => {
    const a = tab('note-5');
    const other = tab('note-6');
    await tick();

    a.doc.getText('t').insert(0, 'private to note 5');
    await tick();
    expect(other.text()).toBe('');
  });

  it('stops sending and receiving after destroy()', async () => {
    const a = tab('note-7');
    const b = tab('note-7');
    await tick();

    b.provider.destroy();
    a.doc.getText('t').insert(0, 'after destroy');
    b.doc.getText('t').insert(0, 'local only');
    await tick();

    expect(b.text()).toBe('local only');
    expect(a.text()).toBe('after destroy');
  });
});
