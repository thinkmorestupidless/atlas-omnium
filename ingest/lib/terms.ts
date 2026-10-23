// Fetch a source's terms page and keep it beside its raw responses, so the licence and attribution
// copied into the manifest can be checked against the page as it was on the day.
import { writeBytes } from './files';
import type { Http } from './http';

export const keepTermsPage = async (http: Http, rawDir: string, name: string, url: string): Promise<string> => {
  const path = `${rawDir}/terms/${name}`;
  await writeBytes(path, await http.get(url));
  return path;
};

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };

/** A terms page as one line of text, entities decoded, for finding the sentences copied from it. */
export const pageText = (html: string): string =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
      e.startsWith('#x') || e.startsWith('#X') ? String.fromCodePoint(parseInt(e.slice(2), 16)) : e.startsWith('#') ? String.fromCodePoint(Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m))
    .replace(/\s+/g, ' ');
