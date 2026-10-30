export interface MarkerPoint { x: number; y: number }
export interface SelectedMarker {
  position: MarkerPoint;
  color: [number, number, number];
}

type Frame = { data: Uint8ClampedArray; width: number; height: number };

function hsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta + 6) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return { hue: hue * 60, saturation: max ? delta / max : 0, value: max };
}

export function sampleSelectedMarker(image: Frame, position: MarkerPoint): SelectedMarker | null {
  const samples: [number, number, number][] = [];
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const x = Math.round(position.x) + dx, y = Math.round(position.y) + dy;
      if (x < 0 || y < 0 || x >= image.width || y >= image.height) continue;
      const i = (y * image.width + x) * 4;
      samples.push([image.data[i], image.data[i + 1], image.data[i + 2]]);
    }
  }
  if (!samples.length) return null;
  const median = (channel: number) => samples.map(p => p[channel]).sort((a, b) => a - b)[Math.floor(samples.length / 2)];
  const color: [number, number, number] = [median(0), median(1), median(2)];
  // Plain walls, shadows and metal have no distinctive color to lock onto.
  if (hsv(...color).saturation < 0.25 || hsv(...color).value < 35) return null;
  return { position, color };
}

// Follow one connected patch near the last position, never the global color centroid.
export function findSelectedMarker(
  image: Frame,
  marker: SelectedMarker,
): MarkerPoint | null {
  const { data, width, height } = image;
  const radius = Math.max(20, Math.min(width, height) * 0.1);
  const reference = hsv(...marker.color);
  const matches = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    const pixel = hsv(data[i], data[i + 1], data[i + 2]);
    const hueDelta = Math.abs(pixel.hue - reference.hue);
    return Math.min(hueDelta, 360 - hueDelta) < 18 &&
      pixel.saturation >= Math.max(0.2, reference.saturation * 0.55) &&
      pixel.value >= Math.max(25, reference.value * 0.3);
  };
  const minX = Math.max(0, Math.floor(marker.position.x - radius));
  const maxX = Math.min(width - 1, Math.ceil(marker.position.x + radius));
  const minY = Math.max(0, Math.floor(marker.position.y - radius));
  const maxY = Math.min(height - 1, Math.ceil(marker.position.y + radius));
  let seed: MarkerPoint | null = null;
  let nearest = radius * radius;
  for (let y = minY; y <= maxY; y += 2) {
    for (let x = minX; x <= maxX; x += 2) {
      const d = (x - marker.position.x) ** 2 + (y - marker.position.y) ** 2;
      if (d < nearest && matches(x, y)) { nearest = d; seed = { x, y }; }
    }
  }
  if (!seed) return null;
  const queue = [seed];
  const visited = new Set<number>();
  let sumX = 0, sumY = 0, count = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const { x, y } = queue[cursor];
    const key = y * width + x;
    if (visited.has(key)) continue;
    visited.add(key);
    if (!matches(x, y)) continue;
    sumX += x; sumY += y; count++;
    for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY && !visited.has(ny * width + nx)) {
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return count >= 4 ? { x: sumX / count, y: sumY / count } : null;
}