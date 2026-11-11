import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
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
        onboarding: './onboarding.html',
        background: './src/background.ts',
        // Content scripts are built separately as IIFEs (vite.content.config.ts).
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
