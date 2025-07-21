// Returns a random color from a fixed palette.
export function getRandomColor() {
  const colors = [
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
  return colors[Math.floor(Math.random() * colors.length)];
}
