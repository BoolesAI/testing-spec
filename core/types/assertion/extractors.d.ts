import type { Response } from './types.js';
export declare function extractJsonPath(data: unknown, expression: string): unknown;
export declare function extractByPath(data: unknown, pathStr: string): unknown;
export declare function extractVariables(response: Response, extractConfig: Record<string, string>): Record<string, unknown>;
/**
 * Extract value using regex pattern with capture groups
 * @param input - Source string to extract from
 * @param pattern - Regex pattern with optional capture groups
 * @param group - Capture group index (0 = full match, 1+ = capture group)
 * @returns Extracted string or null if no match
 */
export declare function extractRegex(input: string, pattern: string, group?: number): string | null;
/**
 * Coerce any value to string
 * @param value - Value to coerce
 * @returns String representation of the value
 */
export declare function coerceToString(value: unknown): string;
/**
 * Coerce any value to number
 * @param value - Value to coerce
 * @returns Numeric value or null if conversion fails
 */
export declare function coerceToNumber(value: unknown): number | null;
/**
 * Extract value from XML using XPath expression
 * @param xmlString - XML string to parse
 * @param xpathExpr - XPath expression
 * @returns Extracted value(s) or null
 */
export declare function extractXmlPath(xmlString: string, xpathExpr: string): unknown;
