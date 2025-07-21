import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';

describe('Yjs multi-client integration', () => {
  it('syncs text between two docs', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();
    const ytext1 = doc1.getText('shared');
    const ytext2 = doc2.getText('shared');
    // Connect docs
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    // Simulate typing in doc1
    ytext1.insert(0, 'hello');
    // Sync doc2
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    expect(ytext2.toString()).toBe('hello');
  });
});
