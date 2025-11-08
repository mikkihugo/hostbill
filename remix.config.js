import { defineConfig } from '@remix-run/dev';
import { getLoadContext } from './server/load-context.js';

export default defineConfig({
  appDirectory: 'app',
  assetsBuildDirectory: 'public/build',
  publicPath: '/build/',
  serverBuildPath: 'build/index.js',
  serverMainFields: ['module', 'main'],
  serverMinVersion: '22',
  serverDependenciesToBundle: [
    'genaiscript',
    '@genaiscript/core',
    '@genaiscript/api'
  ],
  serverBuildTarget: 'node-cjs',
  dev: {
    port: 3000
  },
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
    v3_singleFetchAPI: true,
    v3_lazyRouteDiscovery: true
  }
});
