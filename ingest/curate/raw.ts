// Reading a source's raw files back, as the manifest lists them, with the retrieval time that every
// source record of that source carries.
import type { Manifest, ManifestSource } from '../../app/src/model/schema';
import { readText } from '../lib/files';

export const sourceOf = (m: Manifest, name: string): ManifestSource => {
  const s = m.sources.find((x) => x.name === name);
  if (!s) throw new Error(`the manifest has no source ${name}`);
  return s;
};

export const rawFiles = (m: Manifest, name: string, under = ''): string[] =>
  (sourceOf(m, name).raw ?? []).map((r) => r.file).filter((f) => f.includes(`/${name}/${under}`)).sort();

export const retrieved = (m: Manifest, name: string): string => {
  const t = sourceOf(m, name).retrieval_time;
  if (!t) throw new Error(`${name} has no retrieval time`);
  return t;
};

export const readRaw = readText;

/** Text of an HTML page with tags removed and entities decoded, one space per run of whitespace kept per line. */
export const htmlText = (html: string): string =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<sup>(.*?)<\/sup>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ');
