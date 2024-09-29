#!/usr/bin/env node
'use strict';

import fastify from 'fastify';
import { processRequest } from './src/proxy.js';

const app = fastify({
  http2: true,      // Enable HTTP/2
   // Fallback to HTTP/1.1 for non-HTTP/2 clients
  logger: true
});

const PORT = process.env.PORT || 8080;

app.get('/', processRequest);


app.listen({ host: '0.0.0.0', port: PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
