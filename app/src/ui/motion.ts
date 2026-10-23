// The one place reduced motion is read. Every animated thing asks here, and a change of the device
// preference applies at once.
const query = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const listeners = new Set<() => void>();
query?.addEventListener('change', () => listeners.forEach((l) => l()));

export const reducedMotion = (): boolean => query?.matches ?? false;
export const onMotionChange = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
