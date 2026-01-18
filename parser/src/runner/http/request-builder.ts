import type { HttpRequest } from '../../parser/types.js';
import type { AxiosRequestConfig, Method } from 'axios';

export interface BuildRequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export function buildAxiosConfig(request: HttpRequest, options: BuildRequestOptions = {}): AxiosRequestConfig {
  const { timeout = 30000, headers: defaultHeaders = {} } = options;

  const baseUrl = request._baseUrl || '';
  const url = baseUrl ? `${baseUrl}${request.path}` : request.path;

  const config: AxiosRequestConfig = {
    method: request.method.toUpperCase() as Method,
    url,
    timeout,
    headers: {
      ...defaultHeaders,
      ...request.headers
    }
  };

  // Handle query parameters
  if (request.query && Object.keys(request.query).length > 0) {
    config.params = request.query;
  }

  // Handle request body
  if (request.body) {
    config.data = request.body;
    
    // Auto-detect content type if not set
    if (!config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
      if (typeof request.body === 'object') {
        config.headers = {
          ...config.headers,
          'Content-Type': 'application/json'
        };
      }
    }
  }

  return config;
}

export function buildUrl(request: HttpRequest): string {
  const baseUrl = request._baseUrl || '';
  let url = baseUrl ? `${baseUrl}${request.path}` : request.path;

  if (request.query && Object.keys(request.query).length > 0) {
    const params = new URLSearchParams(request.query);
    url += `?${params.toString()}`;
  }

  return url;
}
