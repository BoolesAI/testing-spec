/**
 * Web Protocol Schema
 */

import type { ProtocolSchema } from '@boolesai/tspec/plugin';

export const webSchema: ProtocolSchema = {
  protocol: 'web',
  requestSchema: {
    type: 'object',
    required: ['actions'],
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: 'Initial URL to navigate to'
      },
      viewport: {
        type: 'object',
        properties: {
          width: { type: 'number' },
          height: { type: 'number' }
        },
        description: 'Browser viewport dimensions'
      },
      headless: {
        type: 'boolean',
        default: true,
        description: 'Run browser in headless mode'
      },
      context: {
        type: 'object',
        properties: {
          locale: { type: 'string' },
          timezone: { type: 'string' },
          colorScheme: { 
            type: 'string',
            enum: ['light', 'dark', 'no-preference']
          }
        },
        description: 'Browser context options'
      },
      wait: {
        type: 'object',
        properties: {
          timeout: { type: 'number' },
          waitUntil: {
            type: 'string',
            enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']
          }
        },
        description: 'Wait configuration'
      },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['action'],
          properties: {
            action: {
              type: 'string',
              enum: ['navigate', 'click', 'fill', 'select', 'check', 'uncheck', 
                     'hover', 'press', 'wait', 'screenshot', 'scroll', 
                     'evaluate', 'upload', 'extract']
            }
          }
        },
        description: 'Actions to perform'
      }
    }
  },
  examples: [
    {
      description: 'Navigate and take screenshot',
      request: {
        url: 'https://example.com',
        actions: [
          { action: 'wait', for: 'selector', selector: 'body' },
          { action: 'screenshot', path: 'homepage.png' }
        ]
      }
    },
    {
      description: 'Login form test',
      request: {
        url: 'https://example.com/login',
        viewport: { width: 1920, height: 1080 },
        actions: [
          { action: 'fill', selector: '#email', value: 'test@example.com' },
          { action: 'fill', selector: '#password', value: 'password123' },
          { action: 'click', selector: 'button[type="submit"]' },
          { action: 'wait', for: 'navigation' },
          { action: 'extract', name: 'welcomeText', selector: '.welcome-message' }
        ]
      }
    },
    {
      description: 'Extract page data',
      request: {
        url: 'https://example.com/products',
        actions: [
          { action: 'wait', for: 'selector', selector: '.product-list' },
          { action: 'extract', name: 'title', selector: 'h1' },
          { action: 'extract', name: 'productCount', selector: '.product-count', property: 'textContent' },
          { action: 'screenshot', path: 'products.png', fullPage: true }
        ]
      }
    }
  ]
};
