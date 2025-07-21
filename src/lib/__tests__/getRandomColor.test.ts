import { describe, it, expect } from 'vitest';
import { getRandomColor } from '../getRandomColor';

const palette = [
  '#4B2995',
  '#B22234',
  '#C97A11',
  '#B59F00',
  '#176CA6',
  '#1B7C6E',
  '#3A7A1D',
  '#5A5A5A',
  '#2D3A4A',
  '#3E2723',
];

describe('getRandomColor', () => {
  it('returns a color from the palette', () => {
    for (let i = 0; i < 20; i++) {
      const color = getRandomColor();
      expect(palette).toContain(color);
    }
  });
});
