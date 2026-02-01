/**
 * HTTP Protocol Schema
 */

import type { ProtocolSchema } from '@boolesai/tspec/plugin';

export const httpSchema: ProtocolSchema = {
  protocol: 'http',
  requestSchema: {
    type: 'object',
    required: ['method', 'path'],
    properties: {
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        description: 'HTTP method'
      },
      path: {
        type: 'string',
        description: 'Request path (can include path parameters)'
      },
      headers: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Request headers'
      },
      body: {
        oneOf: [
          { type: 'object' },
          { type: 'string' },
          { type: 'array' }
        ],
        description: 'Request body (JSON, text, or form data)'
      },
      query: {
        type: 'object',
        additionalProperties: { type: 'string' },
        description: 'Query parameters'
      }
    }
  },
  examples: [
    {
      description: 'Simple GET request',
      request: {
        method: 'GET',
        path: '/api/users'
      }
    },
    {
      description: 'GET request with headers',
      request: {
        method: 'GET',
        path: '/api/users/1',
        headers: {
          'Authorization': 'Bearer ${token}'
        }
      }
    },
    {
      description: 'POST request with JSON body',
      request: {
        method: 'POST',
        path: '/api/users',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    },
    {
      description: 'GET request with query parameters',
      request: {
        method: 'GET',
        path: '/api/users',
        query: {
          page: '1',
          limit: '10'
        }
      }
    }
  ]
};
