// The Canvas 2D backend. Colours come from the tokens in styles/tokens.css, read once.
import { placeLabels, type LabelRequest } from './labels';
import type { Ink, LineStyle, MarkStyle, Renderer, ScreenPoint, TextStyle } from './renderer';


const INK_VARS: Record<Ink, string> = {
  ink: '--ink', muted: '--muted', rule: '--rule', vermilion: '--vermilion', cobalt: '--cobalt', yellow: '--yellow', violet: '--violet', cream: '--cream',
};

export const createCanvas2d = (canvas: HTMLCanvasElement): Renderer => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  const css = getComputedStyle(document.documentElement);
  const colour = Object.fromEntries(Object.entries(INK_VARS).map(([k, v]) => [k, css.getPropertyValue(v).trim() || '#000'])) as Record<Ink, string>;
  const fonts = { sans: css.getPropertyValue('--sans').trim(), mono: css.getPropertyValue('--mono').trim() };
  let labels: (LabelRequest & { at: ScreenPoint; style: TextStyle })[] = [];
  let width = 0;
  let height = 0;

  const fit = () => {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const w = Math.floor(width * dpr);
    const h = Math.floor(height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const applyMark = (s: MarkStyle) => {
    ctx.globalAlpha = s.alpha ?? 1;
    ctx.setLineDash(s.dash ? [...s.dash] : []);
    ctx.lineWidth = s.lineWidth ?? 1;
    if (s.fill) ctx.fillStyle = colour[s.fill];
    if (s.stroke) ctx.strokeStyle = colour[s.stroke];
  };

  return {
    size: () => ({ width, height }),
    clear() {
      fit();
      ctx.globalAlpha = 1;
      ctx.fillStyle = colour.cream;
      ctx.fillRect(0, 0, width, height);
      labels = [];
    },
    disc(c, r, s) {
      applyMark(s);
      ctx.beginPath();
      // Drawn at the radius given, however small: a true-scale disc is not enlarged here.
      ctx.arc(c.x, c.y, Math.max(r, 0), 0, Math.PI * 2);
      if (s.fill) ctx.fill();
      if (s.stroke) ctx.stroke();
    },
    ring(c, r, s) {
      const { fill: _fill, ...stroke } = s;
      applyMark(stroke);
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(r, 0.5), 0, Math.PI * 2);
      ctx.stroke();
    },
    polyline(pts, s: LineStyle, closed = false) {
      if (pts.length < 2) return;
      ctx.globalAlpha = s.alpha ?? 1;
      ctx.setLineDash(s.dash ? [...s.dash] : []);
      ctx.lineWidth = s.width;
      ctx.strokeStyle = colour[s.stroke];
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      if (closed) ctx.closePath();
      ctx.stroke();
    },
    points(pts, r, s) {
      applyMark(s);
      ctx.beginPath();
      for (const p of pts) { ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); }
      if (s.fill) ctx.fill();
      if (s.stroke) ctx.stroke();
    },
    textAnchor(at, text, style) {
      ctx.font = `${style.weight ?? 400} ${style.size}px ${style.face === 'sans' ? fonts.sans : fonts.mono}`;
      const w = ctx.measureText(text).width;
      const x = style.align === 'center' ? at.x - w / 2 : style.align === 'right' ? at.x - w : at.x;
      labels.push({ text, at, style, priority: style.priority, order: labels.length, box: { x: x - 2, y: at.y - style.size, w: w + 4, h: style.size * 1.3 } });
    },
    flush() {
      const { placed, dropped } = placeLabels(labels);
      for (const l of placed) {
        ctx.globalAlpha = l.style.alpha ?? 1;
        ctx.fillStyle = colour[l.style.colour];
        ctx.font = `${l.style.weight ?? 400} ${l.style.size}px ${l.style.face === 'sans' ? fonts.sans : fonts.mono}`;
        ctx.textAlign = l.style.align ?? 'left';
        ctx.fillText(l.text, l.at.x, l.at.y);
      }
      ctx.globalAlpha = 1;
      return { placed: placed.map((l) => l.text), dropped: dropped.map((l) => l.text) };
    },
  };
};
