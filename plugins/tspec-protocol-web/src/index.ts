/**
 * TSpec Web Protocol Plugin
 * 
 * Provides browser UI testing support for TSpec test cases using Puppeteer.
 */

import type { TSpecPlugin, PluginContext, PluginValidationResult } from '@boolesai/tspec/plugin';
import { WebRunner } from './runner.js';
import { webSchema } from './schema.js';
import type { WebRunnerOptions, WebRequest } from './types.js';

/**
 * Plugin version
 */
export const VERSION = '1.0.0';

/**
 * Create the Web plugin instance
 */
export function createPlugin(context: PluginContext): TSpecPlugin {
  const options = context.config as WebRunnerOptions || {};
  
  return {
    metadata: {
      name: 'web',
      version: VERSION,
      description: 'Web browser UI testing support for TSpec using Puppeteer',
      protocols: ['web'],
      compatibility: '>=1.2.0',
      author: 'TSpec Team',
      homepage: 'https://github.com/boolesai/testing-spec',
      tags: ['web', 'browser', 'puppeteer', 'e2e', 'ui-testing']
    },
    
    schemas: [webSchema],
    
    createRunner(protocol: string, runnerOptions: WebRunnerOptions) {
      // Merge plugin config with runner options
      const mergedOptions = { ...options, ...runnerOptions };
      return new WebRunner(mergedOptions);
    },
    
    validateRequest(protocol: string, request: unknown): PluginValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (!request || typeof request !== 'object') {
        errors.push('Web request must be an object');
        return { valid: false, errors };
      }
      
      const req = request as Partial<WebRequest>;
      
      if (!req.actions || !Array.isArray(req.actions)) {
        errors.push('web.actions is required and must be an array');
      } else if (req.actions.length === 0) {
        warnings.push('web.actions is empty - no actions will be performed');
      } else {
        // Validate each action
        const validActions = [
          'navigate', 'click', 'fill', 'select', 'check', 'uncheck',
          'hover', 'press', 'wait', 'screenshot', 'scroll',
          'evaluate', 'upload', 'extract'
        ];
        
        req.actions.forEach((action, index) => {
          if (!action.action) {
            errors.push(`web.actions[${index}].action is required`);
          } else if (!validActions.includes(action.action)) {
            errors.push(`web.actions[${index}].action must be one of: ${validActions.join(', ')}`);
          }
        });
      }
      
      if (req.viewport) {
        if (typeof req.viewport.width !== 'number' || req.viewport.width <= 0) {
          errors.push('web.viewport.width must be a positive number');
        }
        if (typeof req.viewport.height !== 'number' || req.viewport.height <= 0) {
          errors.push('web.viewport.height must be a positive number');
        }
      }
      
      return {
        valid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    },
    
    async healthCheck() {
      // Verify puppeteer is available
      try {
        await import('puppeteer');
        return {
          healthy: true,
          message: 'Web plugin is ready (Puppeteer available)'
        };
      } catch {
        return {
          healthy: false,
          message: 'puppeteer dependency not found - run: npm install puppeteer'
        };
      }
    }
  };
}

// Default export for plugin loading
export default createPlugin;

// Re-export types and utilities
export { WebRunner } from './runner.js';
export { webSchema } from './schema.js';
export type { 
  WebRequest, 
  WebAction, 
  WebResponse, 
  WebRunnerOptions,
  WebActionType,
  ScreenshotInfo,
  ConsoleMessage
} from './types.js';
