import type { TSpec, ValidationResult } from './types.js';
export interface SchemaValidationOptions {
    strict?: boolean;
}
export declare function validateTspec(spec: TSpec, options?: SchemaValidationOptions): ValidationResult;
export declare function validateDslFormat(content: string): ValidationResult;
