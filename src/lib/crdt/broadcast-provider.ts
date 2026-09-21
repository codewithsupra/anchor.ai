import * as Y from 'yjs';

/**
 * Lightweight same-origin tab-to-tab sync for a single Y.Doc using the
 * BroadcastChannel API. No network, no signaling server, no external deps.
 *
 * y-indexeddb persists the doc but does NOT broadcast live updates between
 * open tabs, so this fills that gap: every local update is posted to other
 * tabs, and incoming updates are applied with `this` as the origin (so they
 * are not echoed back and not re-persisted as new updates by y-indexeddb).
 *
 * On connect, a tab both requests the others' full state and announces its
 * own, so tabs converge in both directions regardless of which loaded first.
 */

type Message =
  | { type: 'update'; payload: Uint8Array }
  | { type: 'request-state' }
  | { type: 'state'; payload: Uint8Array };

export class BroadcastProvider {
  private channel: BroadcastChannel;
  private doc: Y.Doc;
  private destroyed = false;

  constructor(noteId: string, doc: Y.Doc) {
    this.doc = doc;
    this.channel = new BroadcastChannel(`anchor-sync-${noteId}`);

    this.channel.onmessage = this.handleMessage;
    this.doc.on('update', this.handleDocUpdate);

    // Ask any already-open tabs for their current state, and announce ours,
    // so convergence does not depend on which tab happened to load first.
    this.channel.postMessage({ type: 'request-state' } satisfies Message);
    this.channel.postMessage({
      type: 'state',
      payload: Y.encodeStateAsUpdate(this.doc),
    } satisfies Message);
  }

  private handleDocUpdate = (update: Uint8Array, origin: unknown) => {
    // Ignore updates we applied ourselves from an incoming broadcast.
    if (origin === this || this.destroyed) return;
    this.channel.postMessage({ type: 'update', payload: update } satisfies Message);
  };

  private handleMessage = (event: MessageEvent<Message>) => {
    if (this.destroyed) return;
    const msg = event.data;
    switch (msg.type) {
      case 'update':
        Y.applyUpdate(this.doc, msg.payload, this);
        break;
      case 'request-state':
        this.channel.postMessage({
          type: 'state',
          payload: Y.encodeStateAsUpdate(this.doc),
        } satisfies Message);
        break;
      case 'state':
        Y.applyUpdate(this.doc, msg.payload, this);
        break;
    }
  };

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.doc.off('update', this.handleDocUpdate);
    this.channel.onmessage = null;
    this.channel.close();
  }
}
