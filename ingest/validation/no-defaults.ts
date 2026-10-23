// No fabricated value: a curated observation may carry a number only where the raw record gave one.
// Each finding names the subject and property so the validation report says what was rejected.

export interface RawValue { subject: string; property: string; value: number | null }
export interface CuratedValue { subject: string; property: string; value: number | null }

export const checkNoDefaults = (raw: readonly RawValue[], curated: readonly CuratedValue[]): string[] => {
  const given = new Map(raw.map((r) => [`${r.subject} ${r.property}`, r.value]));
  const findings: string[] = [];
  for (const c of curated) {
    const key = `${c.subject} ${c.property}`;
    if (!given.has(key)) { findings.push(`${key}: curated with no raw record behind it`); continue; }
    const r = given.get(key) ?? null;
    if (r === null && c.value !== null) findings.push(`${key}: the source gives no value but ${c.value} was curated`);
    if (r !== null && c.value === null) findings.push(`${key}: the source gives ${r} but null was curated`);
  }
  return findings;
};
