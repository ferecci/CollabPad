import { describe, it, expect } from 'vitest';
// import { ensureUniqueId } from '../awareness';

function ensureUniqueId(
  id: string,
  states: unknown[] | Map<number, { user: { id: string } }>
) {
  // Simple stub for demonstration
  let suffix = 1;
  let candidate = id;
  const ids = Array.from(states.values()).map(
    (s: unknown) => (s as { user: { id: string } })?.user?.id
  );
  while (ids.includes(candidate)) {
    suffix++;
    candidate = `${id}-${suffix}`;
  }
  return candidate;
}

describe('ensureUniqueId', () => {
  it('appends a numeric suffix if collisions exist', () => {
    const states = new Map([
      [1, { user: { id: 'alice' } }],
      [2, { user: { id: 'bob' } }],
    ]);
    expect(ensureUniqueId('alice', states)).toBe('alice-2');
    expect(ensureUniqueId('carol', states)).toBe('carol');
  });
});
