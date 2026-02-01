import type { AxiosResponse } from 'axios';
import type { Response } from '../../assertion/types.js';

export function mapAxiosResponse(axiosResponse: AxiosResponse, duration: number): Response {
  const normalizedHeaders = normalizeHeaders(axiosResponse.headers);
  const bodyData = axiosResponse.data;
  
  // Create envelope with body content spread at top level for direct access
  const envelope: any = {
    status: axiosResponse.status,
    header: normalizedHeaders,
    body: bodyData,
    responseTime: duration
  };
  
  // If body is an object, spread its fields at the top level for direct access
  if (bodyData && typeof bodyData === 'object' && !Array.isArray(bodyData)) {
    Object.assign(envelope, bodyData);
  }
  
  return {
    statusCode: axiosResponse.status,
    status: axiosResponse.status,
    body: bodyData,
    headers: normalizedHeaders,
    responseTime: duration,
    duration,
    _envelope: envelope
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
  const errorBody = {
    error: error.message,
    name: error.name
  };
  
  const envelope: any = {
    status: 0,
    header: {},
    body: errorBody,
    responseTime: duration,
    ...errorBody
  };
  
  return {
    statusCode: 0,
    status: 0,
    body: errorBody,
    headers: {},
    responseTime: duration,
    duration,
    _envelope: envelope
  };
}
