import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import os from 'os'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Cache outside Dropbox to avoid EBUSY file-lock conflicts
  cacheDir: path.join(os.tmpdir(), 'vite-restoration-calculator'),
})
