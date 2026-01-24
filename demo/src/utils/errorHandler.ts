import type { Context, Next } from 'koa';
import { Prisma } from '@prisma/client';

export interface ApiError {
  error: string;
  message: string;
  details?: string[];
  timestamp: string;
}

export function errorHandler() {
  return async (ctx: Context, next: Next): Promise<void> => {
    try {
      await next();
    } catch (err) {
      const error = err as Error & { status?: number; statusCode?: number };
      
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          ctx.status = 409;
          ctx.body = {
            error: 'Conflict',
            message: 'A record with this value already exists',
            timestamp: new Date().toISOString()
          } as ApiError;
          return;
        }
        if (err.code === 'P2025') {
          ctx.status = 404;
          ctx.body = {
            error: 'Not Found',
            message: 'Record not found',
            timestamp: new Date().toISOString()
          } as ApiError;
          return;
        }
      }

      ctx.status = error.status || error.statusCode || 500;
      ctx.body = {
        error: ctx.status >= 500 ? 'Internal Server Error' : 'Bad Request',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      } as ApiError;

      if (ctx.status >= 500) {
        console.error('Server error:', err);
      }
    }
  };
}
