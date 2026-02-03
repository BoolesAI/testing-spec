/**
 * HTTP Request Builder
 */

import type { AxiosRequestConfig, Method } from 'axios';
import type { HttpRequest, BuildRequestOptions } from './types.js';

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
    // Unwrap body if it has a format wrapper (json, text, form, etc.)
    let bodyData: unknown = request.body;
    if (typeof request.body === 'object' && !Array.isArray(request.body) && request.body !== null) {
      const bodyObj = request.body as Record<string, unknown>;
      if ('json' in bodyObj) {
        bodyData = bodyObj.json;
        if (!config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
          config.headers = {
            ...config.headers,
            'Content-Type': 'application/json'
          };
        }
      } else if ('text' in bodyObj) {
        bodyData = bodyObj.text;
        if (!config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
          config.headers = {
            ...config.headers,
            'Content-Type': 'text/plain'
          };
        }
      } else if ('form' in bodyObj) {
        bodyData = bodyObj.form;
        if (!config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
          config.headers = {
            ...config.headers,
            'Content-Type': 'application/x-www-form-urlencoded'
          };
        }
      }
    }
    
    config.data = bodyData;
    
    // Auto-detect content type if not set and no wrapper was used
    if (!config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
      if (typeof bodyData === 'object') {
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
