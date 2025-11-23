import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import type { Plugin } from 'vite';

// Plugin to remove exports from content script after build
function removeExportsFromContentScript(): Plugin {
  return {
    name: 'remove-exports-from-content-script',
    generateBundle(_options, bundle) {
      // Find and modify the content script bundle
      const contentScript = bundle['content/main.js'];
      if (contentScript && contentScript.type === 'chunk') {
        // Remove export statements at the end
        contentScript.code = contentScript.code.replace(/export\s*\{[^}]*\};?\s*$/gm, '');
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    removeExportsFromContentScript(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/manifest.json',
          dest: '.',
        },
        {
          src: 'public/css/*',
          dest: 'css',
        },
        {
          src: 'public/templates/*',
          dest: 'templates',
        },
        {
          src: 'icons/*',
          dest: 'icons',
        },
        {
          src: 'popup.js',
          dest: '.',
        },
      ],
    }),
  ],
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        main: './index.html',
        background: './src/background.ts',
        'content/main': './src/content/main.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          if (chunkInfo.name === 'content/main') {
            return 'content/main.js';
          }
          return 'assets/[name]-[hash].js';
        },
      },
    },
  },
});