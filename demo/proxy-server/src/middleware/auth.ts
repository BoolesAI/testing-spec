/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Creates an authentication middleware that validates Bearer tokens
 */
export function authMiddleware(validToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip auth for health check
    if (req.path === '/health') {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'PROXY_AUTH_ERROR',
          message: 'Missing Authorization header'
        }
      });
      return;
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'PROXY_AUTH_ERROR',
          message: 'Invalid Authorization header format. Use: Bearer <token>'
        }
      });
      return;
    }
    
    const token = parts[1];
    if (token !== validToken) {
      res.status(403).json({
        success: false,
        error: {
          code: 'PROXY_AUTH_ERROR',
          message: 'Invalid token'
        }
      });
      return;
    }
    
    next();
  };
}
