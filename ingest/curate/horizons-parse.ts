// Parsing Horizons API responses: the result text's header and the CSV block between $$SOE and $$EOE.
export interface HorizonsResult { target: string; targetSource: string; center: string; centerSource: string; header: string[]; rows: string[][] }

export const parseHorizons = (text: string): HorizonsResult => {
  const body = JSON.parse(text) as { result?: string };
  const r = body.result ?? '';
  const line = (label: string) => r.match(new RegExp(`${label}:\\s*(.*?)\\s*\\{source:\\s*([^}]+)\\}`));
  const t = line('Target body name');
  const c = line('Center body name');
  const soe = r.indexOf('$$SOE');
  const eoe = r.indexOf('$$EOE');
  if (!t || !c || soe < 0 || eoe < 0) throw new Error('not a Horizons ephemeris result');
  const before = r.slice(0, soe).trimEnd().split('\n');
  const headerLine = [...before].reverse().find((l) => l.includes(',') && /[A-Za-z]/.test(l) && !l.startsWith('*')) ?? '';
  const header = headerLine.split(',').map((h) => h.trim()).filter(Boolean);
  const rows = r.slice(soe + 5, eoe).trim().split('\n').filter(Boolean).map((l) => l.split(',').map((x) => x.trim()));
  return { target: (t[1] ?? '').trim(), targetSource: (t[2] ?? '').trim(), center: (c[1] ?? '').trim(), centerSource: (c[2] ?? '').trim(), header, rows };
};
