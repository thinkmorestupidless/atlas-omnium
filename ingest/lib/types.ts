// What a source module and a curator are. A source acquires raw responses (network); a curator turns
// raw responses into curated fragments (no network). `ingest/rebuild.ts` runs only curators.
import type { Entity, Observation, Relationship } from '../../app/src/model/schema';
import type { Http } from './http';

export interface AcquireContext {
  release: string;
  /** The directory this source's raw files go in, repo-relative: data/raw/<release>/<source>. */
  rawDir: string;
  http: Http;
}

export interface Acquired {
  query: unknown;
  source_release: unknown;
  api_version?: string;
  licence: string;
  attribution: string;
  citation: string[];
  terms_pages: string[];
  /** Repo-relative paths of the raw files written. */
  raw: string[];
}

export interface SourceModule {
  name: string;
  acquire(ctx: AcquireContext): Promise<Acquired>;
}

/** What one curator contributes. Files are repo-relative paths with their exact text. */
export interface Fragment {
  entities: Entity[];
  observations: Observation[];
  /** Relationships held by an entity another curator creates (Earth representativeOf water). */
  relationsOnOthers: Relationship[];
  files: { path: string; text: string; sources: string[] }[];
  /** Values as the raw records gave them, for the no-defaults check. */
  rawValues: { subject: string; property: string; value: number | null }[];
  report: Record<string, unknown>;
}

export const emptyFragment = (): Fragment => ({ entities: [], observations: [], relationsOnOthers: [], files: [], rawValues: [], report: {} });
