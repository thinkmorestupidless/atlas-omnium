// Fetch with a per-host rate limit and retries. The body is returned as bytes so it is kept exactly
// as the source sent it.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Http {
  get(url: string): Promise<Uint8Array>;
}

export const makeHttp = (minIntervalMsByHost: Record<string, number> = {}, retries = 4): Http => {
  const last = new Map<string, number>();
  return {
    async get(url: string) {
      const host = new URL(url).host;
      const gap = minIntervalMsByHost[host] ?? 250;
      for (let attempt = 0; ; attempt++) {
        const wait = (last.get(host) ?? 0) + gap - Date.now();
        if (wait > 0) await sleep(wait);
        last.set(host, Date.now());
        try {
          const res = await fetch(url, { headers: { 'user-agent': 'atlas-omnium ingest (https://github.com/thinkmorestupidless/atlas-omnium)' } });
          if (res.ok) return new Uint8Array(await res.arrayBuffer());
          if (res.status < 500 && res.status !== 429) throw new Error(`${res.status} ${res.statusText} from ${url}`);
          if (attempt >= retries) throw new Error(`${res.status} from ${url} after ${retries} retries`);
        } catch (e) {
          if (attempt >= retries || /^\d{3} /.test(String((e as Error).message))) throw e;
        }
        await sleep(1000 * 2 ** attempt);
      }
    },
  };
};

/** Replaces the global fetch with one that throws, so a rebuild provably uses no network. */
export const disableNetwork = (): void => {
  globalThis.fetch = (() => { throw new Error('the network is disabled during a rebuild'); }) as typeof fetch;
};
