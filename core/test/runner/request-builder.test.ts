import { describe, it, expect } from 'vitest';
import { buildAxiosConfig, buildUrl } from '../../src/runner/http/request-builder.js';
import type { HttpRequest } from '../../src/parser/types.js';

describe('runner/http/request-builder', () => {
  describe('buildAxiosConfig', () => {
    it('should build basic config', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users'
      };
      
      const config = buildAxiosConfig(request);
      
      expect(config.method).toBe('GET');
      expect(config.url).toBe('/api/users');
      expect(config.timeout).toBe(30000);
    });

    it('should use baseUrl if provided', () => {
      const request: HttpRequest = {
        method: 'POST',
        path: '/api/login',
        _baseUrl: 'https://api.example.com'
      };
      
      const config = buildAxiosConfig(request);
      
      expect(config.url).toBe('https://api.example.com/api/login');
    });

    it('should merge headers', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users',
        headers: {
          'X-Custom-Header': 'custom-value'
        }
      };
      
      const config = buildAxiosConfig(request, {
        headers: {
          'Authorization': 'Bearer token'
        }
      });
      
      expect(config.headers).toEqual({
        'Authorization': 'Bearer token',
        'X-Custom-Header': 'custom-value'
      });
    });

    it('should handle query parameters', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users',
        query: {
          page: '1',
          limit: '10'
        }
      };
      
      const config = buildAxiosConfig(request);
      
      expect(config.params).toEqual({ page: '1', limit: '10' });
    });

    it('should handle request body', () => {
      const request: HttpRequest = {
        method: 'POST',
        path: '/api/users',
        body: {
          name: 'Alice',
          age: 30
        }
      };
      
      const config = buildAxiosConfig(request);
      
      expect(config.data).toEqual({ name: 'Alice', age: 30 });
    });

    it('should auto-detect Content-Type for JSON body', () => {
      const request: HttpRequest = {
        method: 'POST',
        path: '/api/users',
        body: { name: 'Alice' }
      };
      
      const config = buildAxiosConfig(request);
      
      expect(config.headers?.['Content-Type']).toBe('application/json');
    });

    it('should not override existing Content-Type', () => {
      const request: HttpRequest = {
        method: 'POST',
        path: '/api/users',
        body: 'plain text',
        headers: {
          'Content-Type': 'text/plain'
        }
      };
      
      const config = buildAxiosConfig(request);
      
      expect(config.headers?.['Content-Type']).toBe('text/plain');
    });

    it('should use custom timeout', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users'
      };
      
      const config = buildAxiosConfig(request, { timeout: 5000 });
      
      expect(config.timeout).toBe(5000);
    });

    it('should uppercase method name', () => {
      const request: HttpRequest = {
        method: 'post',
        path: '/api/users'
      };
      
      const config = buildAxiosConfig(request);
      
      expect(config.method).toBe('POST');
    });

    it('should not add params for empty query', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users',
        query: {}
      };
      
      const config = buildAxiosConfig(request);
      
      expect(config.params).toBeUndefined();
    });
  });

  describe('buildUrl', () => {
    it('should build URL without baseUrl', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users'
      };
      
      const url = buildUrl(request);
      
      expect(url).toBe('/api/users');
    });

    it('should build URL with baseUrl', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users',
        _baseUrl: 'https://api.example.com'
      };
      
      const url = buildUrl(request);
      
      expect(url).toBe('https://api.example.com/api/users');
    });

    it('should append query parameters', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users',
        query: {
          page: '1',
          limit: '10',
          sort: 'name'
        }
      };
      
      const url = buildUrl(request);
      
      expect(url).toBe('/api/users?page=1&limit=10&sort=name');
    });

    it('should handle baseUrl and query together', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users',
        _baseUrl: 'https://api.example.com',
        query: { page: '1' }
      };
      
      const url = buildUrl(request);
      
      expect(url).toBe('https://api.example.com/api/users?page=1');
    });

    it('should not append query for empty object', () => {
      const request: HttpRequest = {
        method: 'GET',
        path: '/api/users',
        query: {}
      };
      
      const url = buildUrl(request);
      
      expect(url).toBe('/api/users');
    });
  });
});
