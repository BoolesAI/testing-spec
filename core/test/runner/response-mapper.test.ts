import { describe, it, expect } from 'vitest';
import { mapAxiosResponse, createErrorResponse } from '../../src/runner/http/response-mapper.js';
import type { AxiosResponse } from 'axios';

describe('runner/http/response-mapper', () => {
  describe('mapAxiosResponse', () => {
    it('should map axios response correctly', () => {
      const axiosResponse: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        data: { id: '12345', name: 'Alice' },
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'abc123'
        },
        config: {} as any
      };
      
      const response = mapAxiosResponse(axiosResponse, 150);
      
      expect(response.statusCode).toBe(200);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: '12345', name: 'Alice' });
      expect(response.headers).toEqual({
        'content-type': 'application/json',
        'x-request-id': 'abc123'
      });
      expect(response.responseTime).toBe(150);
      expect(response.duration).toBe(150);
    });

    it('should handle empty response body', () => {
      const axiosResponse: AxiosResponse = {
        status: 204,
        statusText: 'No Content',
        data: null,
        headers: {},
        config: {} as any
      };
      
      const response = mapAxiosResponse(axiosResponse, 50);
      
      expect(response.statusCode).toBe(204);
      expect(response.body).toBeNull();
    });

    it('should normalize headers', () => {
      const axiosResponse: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value',
          'undefined-header': undefined,
          'null-header': null
        },
        config: {} as any
      };
      
      const response = mapAxiosResponse(axiosResponse, 100);
      
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value'
      });
      expect(response.headers?.['undefined-header']).toBeUndefined();
      expect(response.headers?.['null-header']).toBeUndefined();
    });

    it('should convert header values to strings', () => {
      const axiosResponse: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        data: {},
        headers: {
          'content-length': 1234,
          'x-rate-limit': 100
        },
        config: {} as any
      };
      
      const response = mapAxiosResponse(axiosResponse, 100);
      
      expect(response.headers?.['content-length']).toBe('1234');
      expect(response.headers?.['x-rate-limit']).toBe('100');
      expect(typeof response.headers?.['content-length']).toBe('string');
    });

    it('should handle text response', () => {
      const axiosResponse: AxiosResponse = {
        status: 200,
        statusText: 'OK',
        data: 'Plain text response',
        headers: { 'content-type': 'text/plain' },
        config: {} as any
      };
      
      const response = mapAxiosResponse(axiosResponse, 75);
      
      expect(response.body).toBe('Plain text response');
      expect(response.headers?.['content-type']).toBe('text/plain');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response from Error', () => {
      const error = new Error('Network error');
      const response = createErrorResponse(error, 200);
      
      expect(response.statusCode).toBe(0);
      expect(response.status).toBe(0);
      expect(response.body).toEqual({
        error: 'Network error',
        name: 'Error'
      });
      expect(response.headers).toEqual({});
      expect(response.responseTime).toBe(200);
      expect(response.duration).toBe(200);
    });

    it('should handle custom error names', () => {
      const error = new TypeError('Type error occurred');
      const response = createErrorResponse(error, 150);
      
      expect(response.body).toEqual({
        error: 'Type error occurred',
        name: 'TypeError'
      });
    });

    it('should set zero duration if not provided', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error, 0);
      
      expect(response.responseTime).toBe(0);
      expect(response.duration).toBe(0);
    });
  });
});
