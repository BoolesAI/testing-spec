/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err.message);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'PROXY_EXECUTION_ERROR',
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
}
