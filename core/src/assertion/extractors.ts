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

/**
 * Extract value using regex pattern with capture groups
 * @param input - Source string to extract from
 * @param pattern - Regex pattern with optional capture groups
 * @param group - Capture group index (0 = full match, 1+ = capture group)
 * @returns Extracted string or null if no match
 */
export function extractRegex(input: string, pattern: string, group: number = 0): string | null {
  try {
    const regex = new RegExp(pattern);
    const match = input.match(regex);
    
    if (!match) {
      return null;
    }
    
    if (group < 0 || group >= match.length) {
      return null;
    }
    
    return match[group] ?? null;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Regex extraction failed: ${pattern} - ${err.message}`);
  }
}

/**
 * Coerce any value to string
 * @param value - Value to coerce
 * @returns String representation of the value
 */
export function coerceToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Coerce any value to number
 * @param value - Value to coerce
 * @returns Numeric value or null if conversion fails
 */
export function coerceToNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  return null;
}

/**
 * Extract value from XML using XPath expression
 * @param xmlString - XML string to parse
 * @param xpathExpr - XPath expression
 * @returns Extracted value(s) or null
 */
export function extractXmlPath(xmlString: string, xpathExpr: string): unknown {
  // Dynamic import xpath and @xmldom/xmldom for XML parsing
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const xpath = require('xpath');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DOMParser } = require('@xmldom/xmldom');
  
  try {
    const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
    const nodes = xpath.select(xpathExpr, doc);
    
    if (!nodes || (Array.isArray(nodes) && nodes.length === 0)) {
      return null;
    }
    
    // Handle different node types
    if (Array.isArray(nodes)) {
      const values = nodes.map((node: any) => {
        if (node.nodeType === 2) { // Attribute
          return node.value;
        }
        if (node.nodeType === 3) { // Text
          return node.data;
        }
        if (node.textContent !== undefined) {
          return node.textContent;
        }
        return node.toString();
      });
      
      return values.length === 1 ? values[0] : values;
    }
    
    // Single value result (string, number, boolean from XPath functions)
    return nodes;
  } catch (error) {
    const err = error as Error;
    throw new Error(`XPath extraction failed: ${xpathExpr} - ${err.message}`);
  }
}
