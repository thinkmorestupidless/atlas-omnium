// Epochs are typed by their time scale. The person chooses a civil date (UTC); the ephemeris is in
// TDB. TDB = UTC + (TAI-UTC) + 32.184 s, with TDB-TT neglected: it is periodic and never exceeds
// 1.7 ms, far below the sampling of any position the atlas shows (research R2).

export type TimeScale = 'TDB' | 'TT' | 'UTC';
export interface Epoch { readonly scale: TimeScale; readonly jd: number }

export const TDB_MINUS_TT_NEGLECTED_MAX_S = 0.0017;
const TT_MINUS_TAI_S = 32.184;
const JD_UNIX_EPOCH = 2440587.5;
const DAY_MS = 86_400_000;

/** TAI-UTC from IERS Bulletin C, from the start of the first date in the supported window's era. */
const LEAP_SECONDS: readonly { from: string; seconds: number }[] = [
  { from: '1999-01-01', seconds: 32 },
  { from: '2006-01-01', seconds: 33 },
  { from: '2009-01-01', seconds: 34 },
  { from: '2012-07-01', seconds: 35 },
  { from: '2015-07-01', seconds: 36 },
  { from: '2017-01-01', seconds: 37 },
];
const LEAP_JD = LEAP_SECONDS.map((l) => ({ jd: Date.parse(`${l.from}T00:00:00Z`) / DAY_MS + JD_UNIX_EPOCH, seconds: l.seconds }));

export const jdFromIsoUtc = (iso: string): Epoch => {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`not an ISO instant: ${iso}`);
  return { scale: 'UTC', jd: ms / DAY_MS + JD_UNIX_EPOCH };
};

export const taiMinusUtc = (utc: Epoch): number => {
  if (utc.scale !== 'UTC') throw new Error(`TAI-UTC is indexed by a UTC epoch, got ${utc.scale}`);
  const first = LEAP_JD[0];
  if (!first || utc.jd < first.jd) throw new Error('the date is before the leap-second table; no value is guessed');
  let s = first.seconds;
  for (const l of LEAP_JD) if (utc.jd >= l.jd) s = l.seconds;
  return s;
};

export const utcToTdb = (utc: Epoch): Epoch => {
  if (utc.scale !== 'UTC') throw new Error(`utcToTdb takes a UTC epoch, got ${utc.scale}`);
  return { scale: 'TDB', jd: utc.jd + (taiMinusUtc(utc) + TT_MINUS_TAI_S) / 86400 };
};

export const tdbToUtc = (tdb: Epoch): Epoch => {
  if (tdb.scale !== 'TDB' && tdb.scale !== 'TT') throw new Error(`tdbToUtc takes a TDB epoch, got ${tdb.scale}`);
  // Iterate once: the leap second in force is that of the UTC instant, which is within 70 s.
  const guess: Epoch = { scale: 'UTC', jd: tdb.jd - (37 + TT_MINUS_TAI_S) / 86400 };
  return { scale: 'UTC', jd: tdb.jd - (taiMinusUtc(guess) + TT_MINUS_TAI_S) / 86400 };
};

export const epochToIsoUtc = (e: Epoch): string => {
  const utc = e.scale === 'UTC' ? e : tdbToUtc(e);
  return new Date(Math.round((utc.jd - JD_UNIX_EPOCH) * DAY_MS)).toISOString();
};

/** A civil date (YYYY-MM-DD) at 00:00 UTC. */
export const civilDateToUtc = (date: string): Epoch => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`not a civil date: ${date}`);
  return jdFromIsoUtc(`${date}T00:00:00Z`);
};

export const addDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + Math.round(days) * DAY_MS).toISOString().slice(0, 10);
