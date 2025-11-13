import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ['**/.*'],
      appDirectory: 'app',
      assetsBuildDirectory: 'public/build',
      publicPath: '/build/',
      serverBuildPath: 'build/index.js',
      future: {
        v3_fetcherPersist: true,
        v3_lazyRouteDiscovery: true,
        v3_relativeSplatPath: true,
        v3_singleFetch: true,
        v3_throwAbortReason: true
      }
    })
  ],
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true
  }
});
