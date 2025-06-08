// Configure Vite with base directory as empty string for relative paths
import { defineConfig } from 'vite'

export default defineConfig({
  base: '', // Use relative paths instead of root-based paths
  test: {
    globals: true,
    environment: 'node',
  },
})