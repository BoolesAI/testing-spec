/**
 * TSpec HTTP Protocol Plugin
 * 
 * Provides HTTP/HTTPS protocol support for TSpec test cases.
 */

import type { TSpecPlugin, PluginContext, PluginValidationResult } from '@boolesai/tspec/plugin';
import { HttpRunner } from './runner.js';
import { httpSchema } from './schema.js';
import type { HttpRunnerOptions } from './types.js';

/**
 * Plugin version
 */
export const VERSION = '1.0.0';

/**
 * Create the HTTP plugin instance
 */
export function createPlugin(context: PluginContext): TSpecPlugin {
  const options = context.config as HttpRunnerOptions || {};
  
  return {
    metadata: {
      name: 'http',
      version: VERSION,
      description: 'HTTP/HTTPS protocol support for TSpec',
      protocols: ['http', 'https'],
      compatibility: '>=1.2.0',
      author: 'TSpec Team',
      homepage: 'https://github.com/boolesai/testing-spec',
      tags: ['http', 'https', 'rest', 'api']
    },
    
    schemas: [httpSchema],
    
    createRunner(protocol: string, runnerOptions: HttpRunnerOptions) {
      // Merge plugin config with runner options
      const mergedOptions = { ...options, ...runnerOptions };
      return new HttpRunner(mergedOptions);
    },
    
    validateRequest(protocol: string, request: unknown): PluginValidationResult {
      const errors: string[] = [];
      
      if (!request || typeof request !== 'object') {
        errors.push('HTTP request must be an object');
        return { valid: false, errors };
      }
      
      const req = request as Record<string, unknown>;
      
      if (!req.method) {
        errors.push('http.method is required');
      } else {
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        if (typeof req.method === 'string' && !validMethods.includes(req.method.toUpperCase())) {
          errors.push(`http.method must be one of: ${validMethods.join(', ')}`);
        }
      }
      
      if (!req.path) {
        errors.push('http.path is required');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    },
    
    async healthCheck() {
      // Verify axios is available
      try {
        await import('axios');
        return {
          healthy: true,
          message: 'HTTP plugin is ready'
        };
      } catch {
        return {
          healthy: false,
          message: 'axios dependency not found'
        };
      }
    }
  };
}

// Default export for plugin loading
export default createPlugin;

// Re-export types and utilities
export { HttpRunner } from './runner.js';
export { httpSchema } from './schema.js';
export { buildAxiosConfig, buildUrl } from './request-builder.js';
export { mapAxiosResponse, createErrorResponse } from './response-mapper.js';
export type { HttpRequest, HttpRunnerOptions, HttpResponse } from './types.js';
