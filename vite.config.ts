import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', emptyOutDir: true,
    rollupOptions: {
      input: { popup: 'popup.html', dashboard: 'dashboard.html', onboarding: 'onboarding.html', background: 'src/background/index.ts', content: 'src/content/index.ts' },
      output: { entryFileNames: '[name].js', chunkFileNames: 'assets/[name]-[hash].js', assetFileNames: 'assets/[name]-[hash][extname]' }
    }
  }
});
