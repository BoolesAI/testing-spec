/**
 * Represents a line range in a source file.
 * For single lines, start equals end.
 */
export interface LineRange {
  start: number;
  end: number;
}

/**
 * Represents a parsed related_code reference with optional line ranges.
 * 
 * @example
 * // Plain path
 * { filePath: "src/auth/login.js", rawValue: "src/auth/login.js" }
 * 
 * @example
 * // With line references
 * { 
 *   filePath: "src/auth/login.js", 
 *   lineRanges: [{ start: 1, end: 10 }, { start: 20, end: 20 }],
 *   rawValue: "src/auth/login.js[1-10,20]"
 * }
 */
export interface RelatedCodeReference {
  filePath: string;
  lineRanges?: LineRange[];
  rawValue: string;
}

export interface TSpec {
  version: string;
  description: string;
  metadata: TSpecMetadata;
  assertions: Assertion[];
  http?: HttpRequest;
  grpc?: GrpcRequest;
  graphql?: GraphqlRequest;
  websocket?: WebsocketRequest;
  extends?: string;
  variables?: Record<string, unknown>;
  environment?: EnvironmentConfig;
  data?: DataConfig;
  lifecycle?: LifecycleConfig;
}

export interface TSpecMetadata {
  prompt?: string;
  related_code?: string[];
  test_category?: 'functional' | 'integration' | 'performance' | 'security';
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  timeout?: string;
}

export interface Assertion {
  type: string;
  include?: string;
  expected?: unknown;
  expression?: string;
  operator?: string;
  path?: string;
  name?: string;
  value?: unknown;
  pattern?: string;
  extract_group?: number;
  max_ms?: number;
  source?: string;
  message?: string;
}

export interface HttpRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  _baseUrl?: string;
}

export interface GrpcRequest {
  service: string;
  method: string;
  message: unknown;
}

export interface GraphqlRequest {
  query: string;
  variables?: Record<string, unknown>;
}

export interface WebsocketRequest {
  url: string;
  messages: unknown[];
}

export interface EnvironmentConfig {
  scheme?: string;
  host?: string;
  port?: string | number;
  variables?: Record<string, string>;
}

export interface DataConfig {
  source?: string;
  format?: string;
  driver?: string;
  current_row?: number;
  variables?: Record<string, unknown>;
}

export interface OutputConfig {
  save_response_on_failure?: boolean;
  metrics?: string[];
  notifications?: Array<{
    type: string;
    channel?: string;
    condition?: 'failure' | 'success' | 'always';
  }>;
}

// Lifecycle action types
export type LifecycleActionType = 'script' | 'extract' | 'output';
export type LifecycleScope = 'test' | 'assert' | 'run' | 'data';

export interface LifecycleAction {
  action: LifecycleActionType;
  scope: LifecycleScope;
  source?: string;               // For script action
  vars?: Record<string, string>; // For extract action
  config?: OutputConfig;         // For output action
}

export interface LifecycleConfig {
  setup?: LifecycleAction[];
  teardown?: LifecycleAction[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type ProtocolType = 'http' | 'grpc' | 'graphql' | 'websocket';
