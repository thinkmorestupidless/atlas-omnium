import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// The living features under features/ run through playwright-bdd; the visual tier is plain
// Playwright. Both run against the preview of dist/, so what is tested is what would be deployed.
const featuresDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'tests/features/steps/**/*.ts',
  outputDir: '.features-gen',
  missingSteps: 'fail-on-run',
  // A Given sets a precondition up; a Then with the same words checks it.
  matchKeywords: true,
});

export default defineConfig({
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true },
  projects: [
    // The inspector arrives with US4 (T068 to T075); until then the scenarios that read it are skipped.
    { name: 'features', testDir: featuresDir, grepInvert: /@needs-inspector/ },
    { name: 'visual', testDir: 'tests/visual', snapshotPathTemplate: 'tests/visual/baselines/{arg}{ext}' },
  ],
});
