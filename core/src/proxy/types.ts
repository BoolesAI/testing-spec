/**
 * TSpec Proxy Types
 * 
 * Type definitions for proxy request/response payloads.
 */

import type { TestCase } from '../parser/index.js';

/**
 * Common options for proxy requests
 */
export interface ProxyRequestOptions {
  /** Environment variables */
  env?: Record<string, string>;
  
  /** Parameters */
  params?: Record<string, string>;
}

/**
 * Run request options
 */
export interface ProxyRunOptions extends ProxyRequestOptions {
  /** Maximum concurrent test execution */
  concurrency?: number;
  
  /** Stop on first failure */
  failFast?: boolean;
}

/**
 * Base proxy request with file contents
 */
export interface ProxyRequest {
  /** List of file paths (relative) */
  files: string[];
  
  /** Map of file path to file content */
  fileContents: Record<string, string>;
}

/**
 * Run request payload
 */
export interface ProxyRunRequest extends ProxyRequest {
  /** Run options */
  options?: ProxyRunOptions;
}

/**
 * Validate request payload
 */
export interface ProxyValidateRequest extends ProxyRequest {
  /** No additional options */
}

/**
 * Parse request payload
 */
export interface ProxyParseRequest extends ProxyRequest {
  /** Parse options */
  options?: ProxyRequestOptions;
}

/**
 * Single assertion result
 */
export interface ProxyAssertionResult {
  /** Assertion type */
  type: string;
  
  /** Whether assertion passed */
  passed: boolean;
  
  /** Human-readable message */
  message?: string;
  
  /** Expected value */
  expected?: unknown;
  
  /** Actual value */
  actual?: unknown;
}

/**
 * Single test result
 */
export interface ProxyTestResult {
  /** Test case identifier */
  testCaseId: string;
  
  /** Source file path */
  file: string;
  
  /** Whether test passed */
  passed: boolean;
  
  /** Execution duration in ms */
  duration: number;
  
  /** Assertion results */
  assertions?: ProxyAssertionResult[];
  
  /** Error message if failed */
  error?: string;
}

/**
 * Run summary
 */
export interface ProxyRunSummary {
  /** Total test cases */
  total: number;
  
  /** Passed test cases */
  passed: number;
  
  /** Failed test cases */
  failed: number;
  
  /** Skipped test cases */
  skipped?: number;
  
  /** Pass rate percentage (0-100) */
  passRate: number;
  
  /** Total duration in ms */
  duration: number;
}

/**
 * Run response payload
 */
export interface ProxyRunResponse {
  /** Whether operation succeeded */
  success: boolean;
  
  /** Test results */
  results?: ProxyTestResult[];
  
  /** Summary statistics */
  summary?: ProxyRunSummary;
  
  /** Parse errors encountered */
  parseErrors?: ProxyParseError[];
  
  /** Error if success is false */
  error?: ProxyError;
}

/**
 * Single validation result
 */
export interface ProxyValidationResult {
  /** File path */
  file: string;
  
  /** Whether file is valid */
  valid: boolean;
  
  /** Validation errors */
  errors: string[];
}

/**
 * Validate summary
 */
export interface ProxyValidateSummary {
  /** Total files */
  total: number;
  
  /** Valid files */
  valid: number;
  
  /** Invalid files */
  invalid: number;
}

/**
 * Validate response payload
 */
export interface ProxyValidateResponse {
  /** Whether operation succeeded */
  success: boolean;
  
  /** Validation results per file */
  results?: ProxyValidationResult[];
  
  /** Summary statistics */
  summary?: ProxyValidateSummary;
  
  /** Error if success is false */
  error?: ProxyError;
}

/**
 * Parse error for a file
 */
export interface ProxyParseError {
  /** File path */
  file: string;
  
  /** Error message */
  message: string;
}

/**
 * Parse summary
 */
export interface ProxyParseSummary {
  /** Total files */
  totalFiles: number;
  
  /** Total test cases parsed */
  totalTestCases: number;
  
  /** Number of parse errors */
  parseErrors: number;
}

/**
 * Parse response payload
 */
export interface ProxyParseResponse {
  /** Whether operation succeeded */
  success: boolean;
  
  /** Parsed test cases */
  testCases?: TestCase[];
  
  /** Parse errors */
  parseErrors?: ProxyParseError[];
  
  /** Summary statistics */
  summary?: ProxyParseSummary;
  
  /** Error if success is false */
  error?: ProxyError;
}

/**
 * Proxy error codes
 */
export type ProxyErrorCode =
  | 'PROXY_CONNECTION_ERROR'
  | 'PROXY_TIMEOUT'
  | 'PROXY_AUTH_ERROR'
  | 'PROXY_VALIDATION_ERROR'
  | 'PROXY_EXECUTION_ERROR';

/**
 * Proxy error structure
 */
export interface ProxyError {
  /** Error code */
  code: ProxyErrorCode;
  
  /** Human-readable message */
  message: string;
  
  /** Additional details */
  details?: string;
}

/**
 * Create a proxy error
 */
export function createProxyError(
  code: ProxyErrorCode,
  message: string,
  details?: string
): ProxyError {
  return { code, message, details };
}
