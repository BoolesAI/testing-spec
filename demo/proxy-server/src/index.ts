/**
 * TSpec Proxy Server
 * 
 * Demo implementation of a TSpec proxy server for remote test execution.
 */

import express from 'express';
import cors from 'cors';
import { runRouter } from './routes/run.js';
import { validateRouter } from './routes/validate.js';
import { parseRouter } from './routes/parse.js';
import { errorHandler } from './middleware/error.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 8080;
const AUTH_TOKEN = process.env.TSPEC_PROXY_TOKEN;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Optional authentication
if (AUTH_TOKEN) {
  app.use(authMiddleware(AUTH_TOKEN));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// API routes
app.use('/run', runRouter);
app.use('/validate', validateRouter);
app.use('/parse', parseRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`TSpec Proxy Server running on http://localhost:${PORT}`);
  if (AUTH_TOKEN) {
    console.log('Authentication enabled');
  } else {
    console.log('Authentication disabled (set TSPEC_PROXY_TOKEN to enable)');
  }
});

export { app };
