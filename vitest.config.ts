/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85
      },
      exclude: [
        'node_modules/**',
        'tests/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/build/**',
        '**/dist/**'
      ]
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      'server/**/*.{test,spec}.{js,ts}',
      'client/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ]
  }
});