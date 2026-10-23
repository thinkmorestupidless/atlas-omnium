// Hit-testing the resolved marks: the nearest visible mark whose target (at least 12 px across the
// pointer, larger for a large disc) contains the point.
import type { AtlasId } from '../model/ids';
import type { Scene } from '../renderers/representation-types';

export const MIN_TARGET_PX = 12;

export const hitTest = (scene: Scene | null, x: number, y: number): AtlasId | null => {
  if (!scene) return null;
  let best: { id: AtlasId; d: number } | null = null;
  for (const m of scene.marks) {
    if (!m.visible) continue;
    const d = Math.hypot(m.at.x - x, m.at.y - y);
    if (d <= Math.max(MIN_TARGET_PX, m.radiusPx + 4) && (!best || d < best.d)) best = { id: m.id, d };
  }
  return best?.id ?? null;
};
