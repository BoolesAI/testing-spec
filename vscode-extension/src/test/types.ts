import * as vscode from 'vscode';

/**
 * Metadata extracted from a .tcase test file
 */
export interface TSpecTestMetadata {
  testCaseId: string;
  description: string;
  category?: string;
  priority?: string;
  tags?: string[];
  timeout?: string;
  assertions: TSpecAssertion[];
  suiteTestRefs?: SuiteTestReference[];  // For .tsuite files: parsed test references
}

/**
 * Reference to a test file in a .tsuite file
 */
export interface SuiteTestReference {
  file?: string;    // Single file path (relative to suite)
  files?: string;   // Glob pattern
  skip?: boolean;   // Whether to skip this test
}

/**
 * Single assertion definition from a .tcase file
 */
export interface TSpecAssertion {
  type: string;
  expression?: string;
  operator?: string;
  expected?: unknown;
  message?: string;
}

/**
 * Result of a single assertion after test execution
 */
export interface TSpecAssertionResult {
  passed: boolean;
  type: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
  expression?: string;
  operator?: string;
}

/**
 * Result of a single test case execution
 */
export interface TSpecTestResult {
  testCaseId: string;
  passed: boolean;
  duration: number;
  assertions: TSpecAssertionResult[];
  error?: string;
}

/**
 * Summary of test execution
 */
export interface TSpecTestSummary {
  total: number;
  passed: number;
  failed: number;
  passRate?: number;
  duration: number;
}

/**
 * Full CLI output structure
 */
export interface CLIOutput {
  results: TSpecTestResult[];
  summary: TSpecTestSummary;
  parseErrors?: string[];
}

/**
 * Options for CLI execution
 */
export interface CLIExecuteOptions {
  concurrency?: number;
  timeout?: number;
  envVars?: Record<string, string>;
  params?: Record<string, string>;
  verbose?: boolean;
  quiet?: boolean;
  failFast?: boolean;
}

/**
 * Configuration settings for testing
 */
export interface TSpecTestingConfig {
  enabled: boolean;
  cliPath: string;
  concurrency: number;
  defaultTimeout: number;
  watchMode: boolean;
  envVars: Record<string, string>;
}

/**
 * Custom data attached to TestItem via WeakMap
 */
export interface TestItemData {
  type: 'folder' | 'file' | 'assertion' | 'suite' | 'suite-child';
  uri?: vscode.Uri;
  metadata?: TSpecTestMetadata;
  assertion?: TSpecAssertion;
  assertionIndex?: number;
  // For suite-child items
  suiteUri?: vscode.Uri;        // Parent suite's URI
  childFilePath?: string;       // Actual .tcase file path to execute
}

/**
 * Stored test result for persistence and gutter decorations
 */
export interface StoredTestResult {
  filePath: string;
  testCaseId: string;
  passed: boolean;
  timestamp: number;
  duration: number;
}
