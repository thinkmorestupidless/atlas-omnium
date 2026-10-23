// The sources and curators of release 001-prototype, in the order they run. A curator runs when
// every source it needs has raw files.
import type { Curator } from './curate/index';
import type { SourceModule } from './lib/types';

export const SOURCES: Record<string, SourceModule> = {};
export const CURATORS: Curator[] = [];
