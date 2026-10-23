import { defineConfig } from 'vite';

// The browser application lives under app/; data/ is served as static files so the curated
// snapshots are fetched by relative URL and never bundled into the code.
export default defineConfig({
  root: 'app',
  base: './',
  publicDir: '../data',
  build: { outDir: '../dist', emptyOutDir: true },
  test: { root: '.', include: ['tests/**/*.test.ts', 'app/src/**/*.test.ts'] },
});
