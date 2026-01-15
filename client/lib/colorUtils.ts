/**
 * Convert Ableton's integer color to hex string
 */
export function intToHex(color: number): string {
  if (!color) return '#666666';
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
