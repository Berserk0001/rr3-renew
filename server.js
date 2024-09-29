#!/usr/bin/env node
'use strict';

import fastify from 'fastify';
import { processRequest } from './src/proxy.js';

const app = fastify({
       
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
