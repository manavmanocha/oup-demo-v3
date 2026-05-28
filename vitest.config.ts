import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      pool: 'threads',
      environment: 'jsdom',
      setupFiles: ['./tests/setup/vitest.setup.ts'],
      include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/app/data/**/*.ts', 'src/app/context/**/*.tsx', 'src/app/components/**/*.tsx'],
      },
    },
  }),
);
