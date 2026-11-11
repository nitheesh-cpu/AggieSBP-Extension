import { defineConfig } from 'vite';

// Content scripts run as classic scripts, so they cannot `import` anything.
// Each one is built on its own as a self-contained IIFE; building them together
// with the popup lets Rollup hoist shared code into an imported chunk, which
// breaks with "Cannot use import statement outside a module".
//
// Usage: vite build -c vite.content.config.ts --mode <main|howdy>
const CONTENT_ENTRIES: Record<string, string> = {
  main: './src/content/main.ts',
  howdy: './src/content/howdy.ts',
};

export default defineConfig(({ mode }) => {
  const entry = CONTENT_ENTRIES[mode];
  if (!entry) {
    throw new Error(`Unknown content script "${mode}". Expected one of: ${Object.keys(CONTENT_ENTRIES).join(', ')}`);
  }

  return {
    publicDir: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      outDir: 'build',
      emptyOutDir: false,
      lib: {
        entry,
        formats: ['iife'],
        name: `aggiesbp_content_${mode}`,
        fileName: () => `content/${mode}.js`,
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  };
});
