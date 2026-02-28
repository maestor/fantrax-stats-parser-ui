import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      exclude: [
        'src/main.ts',
        'src/environments/**',
        'src/app/app.config.ts',
        'src/app/app.routes.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 98,
        lines: 98,
        functions: 98,
        branches: 96,
      },
    },
  },
});
