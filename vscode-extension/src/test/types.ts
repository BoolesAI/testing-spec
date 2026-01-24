import * as vscode from 'vscode';

/**
 * Metadata extracted from a .tspec test file
 */
export interface TSpecTestMetadata {
  testCaseId: string;
  description: string;
  category?: string;
  priority?: string;
  tags?: string[];
  timeout?: string;
  assertions: TSpecAssertion[];
}

/**
 * Single assertion definition from a .tspec file
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
  type: 'folder' | 'file' | 'assertion';
  uri?: vscode.Uri;
  metadata?: TSpecTestMetadata;
  assertion?: TSpecAssertion;
  assertionIndex?: number;
}
