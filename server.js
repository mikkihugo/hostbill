import { createRequestHandler } from '@remix-run/node';
import * as build from './build/index.js';

const requestHandler = createRequestHandler({
  build,
  mode: 'production'
});

export default requestHandler;
