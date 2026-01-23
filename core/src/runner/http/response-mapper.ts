import type { AxiosResponse } from 'axios';
import type { Response } from '../../assertion/types.js';

export function mapAxiosResponse(axiosResponse: AxiosResponse, duration: number): Response {
  return {
    statusCode: axiosResponse.status,
    status: axiosResponse.status,
    body: axiosResponse.data,
    headers: normalizeHeaders(axiosResponse.headers),
    responseTime: duration,
    duration
  };
}

function normalizeHeaders(headers: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && value !== null) {
      normalized[key] = String(value);
    }
  }
  
  return normalized;
}

export function createErrorResponse(error: Error, duration: number): Response {
  return {
    statusCode: 0,
    status: 0,
    body: {
      error: error.message,
      name: error.name
    },
    headers: {},
    responseTime: duration,
    duration
  };
}
