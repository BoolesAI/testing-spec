import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'parser/index': resolve(__dirname, 'src/parser/index.ts'),
        'assertion/index': resolve(__dirname, 'src/assertion/index.ts'),
        'runner/index': resolve(__dirname, 'src/runner/index.ts'),
        'mcp-server': resolve(__dirname, 'src/mcp/server.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      }
    },
    rollupOptions: {
      external: [
        'axios',
        'js-yaml',
        'jsonpath-plus',
        'fs',
        'path',
        'crypto',
        'readline',
        /^node:/
      ]
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false
  }
});
