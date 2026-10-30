export interface MarkerPoint { x: number; y: number }
export interface SelectedMarker {
  position: MarkerPoint;
  color: [number, number, number];
}

// Follow one connected patch near the last position, never the global color centroid.
export function findSelectedMarker(
  image: { data: Uint8ClampedArray; width: number; height: number },
  marker: SelectedMarker,
): MarkerPoint | null {
  const { data, width, height } = image;
  const radius = Math.max(20, Math.min(width, height) * 0.1);
  const matches = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    const distance = Math.hypot(data[i] - marker.color[0], data[i + 1] - marker.color[1], data[i + 2] - marker.color[2]);
    return distance < 65;
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