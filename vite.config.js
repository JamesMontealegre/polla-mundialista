import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'

function versionPlugin() {
  return {
    name: 'version-json',
    buildStart() {
      const version = { v: Date.now() }
      writeFileSync('public/version.json', JSON.stringify(version))
    },
  }
}

export default defineConfig({
  plugins: [react(), versionPlugin()],
})
