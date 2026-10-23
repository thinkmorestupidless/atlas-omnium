// TAP synchronous queries (Gaia archive, VizieR, SIMBAD), ADQL in, CSV out, kept as returned.
import { writeBytes } from './files';
import type { Http } from './http';

export const tapUrl = (endpoint: string, adql: string): string =>
  `${endpoint}?${new URLSearchParams({ REQUEST: 'doQuery', LANG: 'ADQL', FORMAT: 'csv', QUERY: adql }).toString()}`;

export const tapQuery = async (http: Http, endpoint: string, adql: string, path: string): Promise<string> => {
  const bytes = await http.get(tapUrl(endpoint, adql));
  const text = new TextDecoder().decode(bytes);
  if (text.startsWith('<?xml') || text.includes('QUERY_STATUS" value="ERROR')) throw new Error(`TAP refused the query at ${endpoint}: ${text.slice(0, 400)}`);
  await writeBytes(path, bytes);
  return text;
};

/** CSV as TAP services write it: a header row, quoted strings, empty for null. */
export const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries((head ?? []).map((h, k) => [h, r[k] ?? ''])));
};

/** A CSV cell as a number, or null when the service gave none. */
export const numOrNull = (s: string | undefined): number | null => (s === undefined || s.trim() === '' ? null : Number(s));
