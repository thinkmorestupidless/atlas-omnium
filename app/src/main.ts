// Entry point. For now it proves the toolchain: a cream canvas sized to the viewport, ready for
// the first renderer. Feature 001 (`specs/001-earth/`) replaces this with the real scene.
const canvas = document.getElementById('scene') as HTMLCanvasElement | null;
if (!canvas) throw new Error('no #scene canvas');

function fit(): void {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
}
fit();
window.addEventListener('resize', fit);
