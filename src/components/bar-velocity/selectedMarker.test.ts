import { it } from 'node:test';
import { strictEqual, ok } from 'node:assert';
import { findSelectedMarker, sampleSelectedMarker } from './selectedMarker';

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

it('samples a region instead of locking onto a single noisy pixel', () => {
  const image = frame([{ x: 30, y: 50 }]);
  image.data.set([255, 255, 255, 255], (50 * image.width + 30) * 4);
  const sampled = sampleSelectedMarker(image, { x: 30, y: 50 });
  ok(sampled);
  strictEqual(sampled.color[2], 220);
  strictEqual(sampled.color[0], 0);
});

it('continues following the selected blue marker when lighting darkens', () => {
  const image = frame([{ x: 34, y: 50 }]);
  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i + 1] *= 0.4;
    image.data[i + 2] *= 0.4;
  }
  const position = findSelectedMarker(image, { position: { x: 30, y: 50 }, color: [0, 80, 220] });
  ok(position);
  ok(Math.abs(position.x - 34) < 2);
});

it('rejects an uncolored background rather than claiming a target is selected', () => {
  strictEqual(sampleSelectedMarker(frame([]), { x: 30, y: 50 }), null);
});