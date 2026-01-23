import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: [
        '@boolesai/tspec',
        'commander',
        'chalk',
        'glob',
        'ora',
        'fs',
        'path',
        'url',
        /^node:/
      ]
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false
  }
});
