import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// The living features under features/ run through playwright-bdd; the visual tier is plain
// Playwright. Both run against the preview of dist/, so what is tested is what would be deployed.
const featuresDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'tests/features/steps/**/*.ts',
  outputDir: '.features-gen',
});

export default defineConfig({
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true },
  projects: [
    { name: 'features', testDir: featuresDir },
    { name: 'visual', testDir: 'tests/visual', snapshotPathTemplate: 'tests/visual/baselines/{arg}{ext}' },
  ],
});
