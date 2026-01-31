/**
 * Parsing and validation utilities for related_code field with line reference support.
 *
 * Supported formats:
 * - Plain path: "src/auth/login.js"
 * - Single line: "src/auth/login.js[42]"
 * - Line range: "src/auth/login.js[10-20]"
 * - Multiple references: "src/auth/login.js[1,5-10,20-25,100]"
 */
import type { RelatedCodeReference } from './types.js';
/**
 * Regex pattern for validating and parsing related_code entries.
 *
 * Pattern breakdown:
 * - ^([^\[\]]+) - Capture group 1: File path (any chars except brackets)
 * - (?:\[...)? - Optional non-capturing group for line references
 * - ([0-9]+(?:-[0-9]+)?(?:,[0-9]+(?:-[0-9]+)?)*) - Capture group 2: Line specs
 * - $ - End of string
 */
export declare const RELATED_CODE_PATTERN: RegExp;
/**
 * Validation result for related_code format
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
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
export declare function parseRelatedCodeReference(input: string): RelatedCodeReference | null;
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
export declare function validateRelatedCodeFormat(input: string): ValidationResult;
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
export declare function formatRelatedCodeReference(ref: RelatedCodeReference): string;
