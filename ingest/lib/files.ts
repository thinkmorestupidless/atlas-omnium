import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const sha256 = (bytes: Uint8Array | string): string => createHash('sha256').update(bytes).digest('hex');

export const writeBytes = async (path: string, bytes: Uint8Array | string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
};

export const readText = (path: string): Promise<string> => readFile(path, 'utf8');

export const fileSha = async (path: string): Promise<string> => sha256(await readFile(path));

/** JSON with two-space indentation and a final newline; key order is the order objects were built in. */
export const json = (v: unknown): string => `${JSON.stringify(v, null, 2)}\n`;

/** JSON for long row arrays: one row per line, so diffs and checksums stay readable. */
export const jsonRows = (head: Record<string, unknown>, rowsKey: string, rows: readonly unknown[]): string => {
  const h = JSON.stringify(head, null, 2).replace(/\n}$/, '');
  return `${h},\n  "${rowsKey}": [\n${rows.map((r) => `    ${JSON.stringify(r)}`).join(',\n')}\n  ]\n}\n`;
};
