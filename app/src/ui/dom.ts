// A small element builder for the controls: every control is an HTML element, never canvas.
export const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | number | undefined> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') e.className = String(v);
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) e.append(c);
  return e;
};

export const replace = (parent: Element, ...children: (Node | string | null | undefined | false)[]) => {
  parent.replaceChildren(...children.filter((c): c is Node | string => c !== null && c !== undefined && c !== false));
};

/** A number for reading: grouped thousands, a sensible number of significant figures. */
export const fmt = (v: number, sig = 4): string => {
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e9)) return v.toExponential(sig - 1).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  return Number(v.toPrecision(sig)).toLocaleString('en-GB', { maximumFractionDigits: 6 });
};
