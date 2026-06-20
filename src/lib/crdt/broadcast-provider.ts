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
 * On connect, each side requests the other's full state and replies with its
 * own, so a tab that opens a note already edited in another tab converges
 * immediately.
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

    // Ask any already-open tabs for their current state.
    this.channel.postMessage({ type: 'request-state' } satisfies Message);
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
