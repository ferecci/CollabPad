import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/server': path.resolve(__dirname, 'src/server'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
    },
  },
});
