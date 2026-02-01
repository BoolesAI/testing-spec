import type { TSpec, ValidationResult, TSpecSuite } from './types.js';
export interface SchemaValidationOptions {
    strict?: boolean;
}
export declare function validateTspec(spec: TSpec, options?: SchemaValidationOptions): ValidationResult;
export declare function validateDslFormat(content: string): ValidationResult;
/**
 * Validates a TSpecSuite object
 */
export declare function validateSuite(spec: TSpecSuite, options?: SchemaValidationOptions): ValidationResult;
/**
 * Validates DSL format for suite files
 */
export declare function validateSuiteDslFormat(content: string): ValidationResult;
/**
 * Detects if content is a suite file based on structure
 */
export declare function isSuiteContent(content: string): boolean;
