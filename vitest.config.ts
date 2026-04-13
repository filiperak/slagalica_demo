import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // exposes describe / test / expect / vi globally — no imports needed
    environmentMatchGlobs: [
      ['tests/frontend/**', 'jsdom'], // DOM environment for client-side tests
      ['tests/backend/**', 'node'],  // Node.js environment for server tests
    ],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['server/**', 'app/src/**'],
      exclude: ['**/*.d.ts', '**/node_modules/**'],
    },
  },
});
