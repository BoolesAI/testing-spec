import { JSONPath } from 'jsonpath-plus';
import type { Response } from './types.js';

export function extractJsonPath(data: unknown, expression: string): unknown {
  try {
    const result = JSONPath({ path: expression, json: data as any });
    return Array.isArray(result) && result.length === 1 ? result[0] : result;
  } catch (error) {
    const err = error as Error;
    throw new Error(`JSONPath extraction failed: ${expression} - ${err.message}`);
  }
}

export function extractByPath(data: unknown, pathStr: string): unknown {
  const parts = pathStr.split('.');
  let current: unknown = data;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

export function extractVariables(response: Response, extractConfig: Record<string, string>): Record<string, unknown> {
  if (!extractConfig) {
    return {};
  }
  
  const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
  const extracted: Record<string, unknown> = {};
  
  for (const [varName, expression] of Object.entries(extractConfig)) {
    try {
      extracted[varName] = extractJsonPath(body, expression);
    } catch {
      extracted[varName] = undefined;
    }
  }
  
  return extracted;
}
