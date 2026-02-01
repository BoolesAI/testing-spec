/**
 * HTTP Plugin Types
 */

import type { TestCase } from '@boolesai/tspec';

/**
 * HTTP request configuration
 */
export interface HttpRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  _baseUrl?: string;
}

/**
 * HTTP runner options
 */
export interface HttpRunnerOptions {
  timeout?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
  validateStatus?: (status: number) => boolean;
  headers?: Record<string, string>;
}

/**
 * Build request options
 */
export interface BuildRequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP response
 */
export interface HttpResponse {
  statusCode?: number;
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
  responseTime?: number;
  duration?: number;
  _envelope?: {
    status: number;
    header: Record<string, string>;
    body: unknown;
    responseTime: number;
  };
}
