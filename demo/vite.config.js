import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js'
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [
        'koa',
        '@koa/router',
        'koa-bodyparser',
        '@prisma/client',
        'dotenv',
        /^node:.*/
      ]
    }
  }
});
