import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.js'
    },
    outDir: 'out',
    sourcemap: 'inline',
    minify: false,
    target: 'node20',
    rollupOptions: {
      external: ['vscode'],
      output: {
        format: 'cjs',
        exports: 'named'
      }
    }
  },
  resolve: {
    conditions: ['node']
  }
})
