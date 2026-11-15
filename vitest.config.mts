import { defineConfig } from 'vitest/config';

const r = (p: string) => new URL(p, import.meta.url).pathname;

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@plugins\/(.*)$/, replacement: r('./src/plugins/$1') },
      { find: /^@types$/, replacement: r('./src/types') },
      { find: /^@$/, replacement: r('./src') }
    ]
  },
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**'],
      exclude: ['tests/**']
    }
  }
});
