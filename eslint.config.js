// The surface boundary of decision 0006: the core (model, navigation) never imports the surface
// (projections, renderers, ui, input) or anything that knows about the browser's build. A second
// surface reuses the core unchanged only while this holds.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const surface = ['projections', 'renderers', 'ui', 'input'];
const surfacePatterns = surface.flatMap((d) => [`../${d}`, `../${d}/*`, `**/src/${d}/*`]);

export default tseslint.config(
  { ignores: ['node_modules/', 'dist/', 'coverage/', '.features-gen/', 'test-results/', 'playwright-report/', 'data/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['app/src/model/**/*.ts', 'app/src/navigation/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: surfacePatterns, message: 'The core may not import the surface (decision 0006).' },
          { group: ['vite/*', 'vite'], message: 'The core knows nothing of the build.' },
        ],
      }],
    },
  },
);
