import { it } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { findSelectedMarker } from './selectedMarker';

function frame(patches: { x: number; y: number }[]) {
  const width = 200, height = 100;
  const data = new Uint8ClampedArray(width * height * 4);
  for (const patch of patches) {
    for (let y = patch.y - 4; y <= patch.y + 4; y++) {
      for (let x = patch.x - 4; x <= patch.x + 4; x++) data.set([0, 80, 220, 255], (y * width + x) * 4);
    }
  }
  return { width, height, data };
}

it('follows the clicked blue target, not another blue object', () => {
  const position = findSelectedMarker(frame([{ x: 34, y: 50 }, { x: 150, y: 50 }]), { position: { x: 30, y: 50 }, color: [0, 80, 220] });
  ok(position);
  ok(Math.abs(position.x - 34) < 2);
});

it('returns no measurement when the selected target disappears instead of switching objects', () => {
  strictEqual(findSelectedMarker(frame([{ x: 150, y: 50 }]), { position: { x: 30, y: 50 }, color: [0, 80, 220] }), null);
});

it('requires an explicit selected marker', () => {
  strictEqual(findSelectedMarker(frame([]), { position: { x: 30, y: 50 }, color: [0, 80, 220] }), null);
});