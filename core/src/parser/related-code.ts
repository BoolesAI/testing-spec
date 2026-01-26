/**
 * Parsing and validation utilities for related_code field with line reference support.
 * 
 * Supported formats:
 * - Plain path: "src/auth/login.js"
 * - Single line: "src/auth/login.js[42]"
 * - Line range: "src/auth/login.js[10-20]"
 * - Multiple references: "src/auth/login.js[1,5-10,20-25,100]"
 */

import type { LineRange, RelatedCodeReference } from './types.js';

/**
 * Regex pattern for validating and parsing related_code entries.
 * 
 * Pattern breakdown:
 * - ^([^\[\]]+) - Capture group 1: File path (any chars except brackets)
 * - (?:\[...)? - Optional non-capturing group for line references
 * - ([0-9]+(?:-[0-9]+)?(?:,[0-9]+(?:-[0-9]+)?)*) - Capture group 2: Line specs
 * - $ - End of string
 */
export const RELATED_CODE_PATTERN = /^([^\[\]]+)(?:\[([0-9]+(?:-[0-9]+)?(?:,[0-9]+(?:-[0-9]+)?)*)\])?$/;

/**
 * Pattern for validating individual line spec (single line or range)
 */
const LINE_SPEC_PATTERN = /^([0-9]+)(?:-([0-9]+))?$/;

/**
 * Validation result for related_code format
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Parse a single line spec string into a LineRange object.
 * 
 * @param spec - Line spec string like "42" or "10-20"
 * @returns LineRange object or null if invalid
 */
function parseLineSpec(spec: string): LineRange | null {
  const match = spec.match(LINE_SPEC_PATTERN);
  if (!match) {
    return null;
  }

  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : start;

  return { start, end };
}

/**
 * Parse a related_code string into a structured RelatedCodeReference object.
 * 
 * @param input - The related_code string to parse
 * @returns RelatedCodeReference object or null if the format is invalid
 * 
 * @example
 * parseRelatedCodeReference("src/auth/login.js")
 * // Returns: { filePath: "src/auth/login.js", rawValue: "src/auth/login.js" }
 * 
 * @example
 * parseRelatedCodeReference("src/auth/login.js[1,5-10,20]")
 * // Returns: { 
 * //   filePath: "src/auth/login.js", 
 * //   lineRanges: [{ start: 1, end: 1 }, { start: 5, end: 10 }, { start: 20, end: 20 }],
 * //   rawValue: "src/auth/login.js[1,5-10,20]"
 * // }
 */
export function parseRelatedCodeReference(input: string): RelatedCodeReference | null {
  if (typeof input !== 'string' || !input.trim()) {
    return null;
  }

  const match = input.match(RELATED_CODE_PATTERN);
  if (!match) {
    return null;
  }

  const filePath = match[1].trim();
  const lineSpecsStr = match[2];

  // Plain path without line references
  if (!lineSpecsStr) {
    return {
      filePath,
      rawValue: input
    };
  }

  // Parse line specifications
  const lineSpecs = lineSpecsStr.split(',');
  const lineRanges: LineRange[] = [];

  for (const spec of lineSpecs) {
    const range = parseLineSpec(spec);
    if (!range) {
      return null;
    }
    lineRanges.push(range);
  }

  return {
    filePath,
    lineRanges,
    rawValue: input
  };
}

/**
 * Validate the format of a related_code string.
 * 
 * @param input - The related_code string to validate
 * @returns ValidationResult with valid flag and optional error message
 * 
 * @example
 * validateRelatedCodeFormat("src/auth/login.js[1-10]")
 * // Returns: { valid: true }
 * 
 * @example
 * validateRelatedCodeFormat("src/auth/login.js[10-5]")
 * // Returns: { valid: false, error: "Range end must be >= start in '10-5'" }
 */
export function validateRelatedCodeFormat(input: string): ValidationResult {
  if (typeof input !== 'string') {
    return { valid: false, error: 'related_code entry must be a string' };
  }

  if (!input.trim()) {
    return { valid: false, error: 'related_code entry cannot be empty' };
  }

  const match = input.match(RELATED_CODE_PATTERN);
  if (!match) {
    return { valid: false, error: `Invalid related_code format: "${input}". Expected "path" or "path[line_specs]"` };
  }

  const filePath = match[1].trim();
  const lineSpecsStr = match[2];

  // Validate file path is not empty
  if (!filePath) {
    return { valid: false, error: 'File path cannot be empty' };
  }

  // Plain path without line references is valid
  if (!lineSpecsStr) {
    return { valid: true };
  }

  // Validate each line specification
  const lineSpecs = lineSpecsStr.split(',');
  for (const spec of lineSpecs) {
    const specMatch = spec.match(LINE_SPEC_PATTERN);
    if (!specMatch) {
      return { valid: false, error: `Invalid line reference format: "${spec}"` };
    }

    const start = parseInt(specMatch[1], 10);
    const end = specMatch[2] ? parseInt(specMatch[2], 10) : start;

    // Line numbers must be >= 1 (1-based)
    if (start < 1) {
      return { valid: false, error: `Line number must be >= 1, got "${start}"` };
    }

    if (end < 1) {
      return { valid: false, error: `Line number must be >= 1, got "${end}"` };
    }

    // Range end must be >= start
    if (end < start) {
      return { valid: false, error: `Range end must be >= start in "${spec}"` };
    }
  }

  return { valid: true };
}

/**
 * Format a RelatedCodeReference object back to its string representation.
 * 
 * @param ref - The RelatedCodeReference to format
 * @returns The formatted string
 * 
 * @example
 * formatRelatedCodeReference({ filePath: "src/auth/login.js", lineRanges: [{ start: 1, end: 10 }] })
 * // Returns: "src/auth/login.js[1-10]"
 */
export function formatRelatedCodeReference(ref: RelatedCodeReference): string {
  if (!ref.lineRanges || ref.lineRanges.length === 0) {
    return ref.filePath;
  }

  const lineSpecs = ref.lineRanges.map(range => {
    if (range.start === range.end) {
      return `${range.start}`;
    }
    return `${range.start}-${range.end}`;
  });

  return `${ref.filePath}[${lineSpecs.join(',')}]`;
}
