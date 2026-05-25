import { defineConfig } from 'vitest/config'
import path from 'path'

const root = path.resolve(__dirname, '..')

export default defineConfig({
  root,
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      'server-only': path.resolve(root, 'tests/unit/stubs/server-only.ts'),
    },
  },
})
