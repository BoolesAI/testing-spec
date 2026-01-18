/**
 * TSpec Parser Type Definitions
 * @module @boolesai/tspec-parser
 */

export interface TestMetadata {
  ai_prompt?: string;
  tags?: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  category?: string;
  author?: string;
  created?: string;
  modified?: string;
  [key: string]: unknown;
}

export interface Environment {
  host?: string;
  scheme?: 'http' | 'https';
  port?: string | number;
  variables?: Record<string, string>;
}

export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: {
    json?: unknown;
    form?: Record<string, string>;
    raw?: string;
  };
  _baseUrl?: string;
}

export interface GrpcRequest {
  service: string;
  method: string;
  message?: unknown;
  metadata?: Record<string, string>;
}

export interface Assertion {
  type: 'status_code' | 'grpc_code' | 'response_time' | 'json_path' | 'proto_field' | 'header' | 'javascript';
  expected?: unknown;
  expression?: string;
  operator?: 'equals' | 'eq' | 'not_equals' | 'neq' | 'exists' | 'not_exists' | 'not_empty' | 'contains' | 'not_contains' | 'matches' | 'gt' | 'gte' | 'lt' | 'lte' | 'type' | 'length';
  max_ms?: number;
  name?: string;
  value?: unknown;
  path?: string;
  source?: string;
  message?: string;
  include?: string;
}

export interface AssertionResult {
  passed: boolean;
  type: string;
  expected?: unknown;
  actual?: unknown;
  message: string;
  expression?: string;
  operator?: string;
  name?: string;
  path?: string;
}

export interface TestCase {
  id: string;
  description: string;
  metadata?: TestMetadata;
  protocol: 'http' | 'grpc' | 'graphql' | 'websocket';
  request: HttpRequest | GrpcRequest | Record<string, unknown>;
  assertions: Assertion[];
  extract?: Record<string, string>;
  output?: Record<string, unknown>;
  lifecycle?: {
    setup?: unknown[];
    teardown?: unknown[];
  };
  environment?: Environment;
  _dataRow?: Record<string, unknown>;
  _raw?: Record<string, unknown>;
}

export interface GenerateOptions {
  params?: Record<string, unknown>;
  env?: Record<string, string>;
  extracted?: Record<string, unknown>;
  baseDir?: string;
}

export interface AssertOptions {
  baseDir?: string;
}

export interface AssertionSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  assertions: AssertionResult[];
  summary: AssertionSummary;
  extracted?: Record<string, unknown>;
}

export interface Response {
  statusCode?: number;
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
  responseTime?: number;
  duration?: number;
  grpcCode?: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BuiltinFunction {
  name: string;
  description: string;
}

// Main API functions
export function generateTestCases(filePath: string, options?: GenerateOptions): TestCase[];
export function generateTestCasesFromString(content: string, options?: GenerateOptions): TestCase[];
export function assertResults(response: Response, testCase: TestCase, options?: AssertOptions): TestResult;
export function assertMultipleResults(results: Array<{response: Response; testCase: TestCase}>, options?: AssertOptions): TestResult[];

// Parser utilities
export function parseYamlFile(filePath: string): Record<string, unknown>;
export function parseYamlString(content: string): Record<string, unknown>;
export function validateTspec(spec: Record<string, unknown>): ValidationResult;

// Template utilities
export function deepMerge(parent: Record<string, unknown>, child: Record<string, unknown>): Record<string, unknown>;
export function applyTemplateInheritance(spec: Record<string, unknown>, baseDir: string): Record<string, unknown>;

// Variable utilities
export function replaceVariables(obj: unknown, context: Record<string, unknown>): unknown;
export function buildVariableContext(spec: Record<string, unknown>, params?: Record<string, unknown>, extracted?: Record<string, unknown>): Record<string, unknown>;
export function getBuiltinFunctions(): BuiltinFunction[];

// Data-driven utilities
export function generateParameterizedCases(spec: Record<string, unknown>, baseDir: string): Record<string, unknown>[];
export function loadDataFile(filePath: string, format: string): Record<string, unknown>[];
export function parseCSV(content: string): Record<string, unknown>[];

// Assertion utilities
export function runAssertions(response: Response, assertions: Assertion[], baseDir?: string): AssertionResult[];
export function runAssertion(response: Response, assertion: Assertion, baseDir?: string): AssertionResult;
export function extractJsonPath(data: unknown, expression: string): unknown;
export function extractVariables(response: Response, extractConfig: Record<string, string>): Record<string, unknown>;
export function getAssertionSummary(results: AssertionResult[]): AssertionSummary;
