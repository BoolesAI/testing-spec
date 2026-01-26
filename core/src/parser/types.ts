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
  extract?: Record<string, string>;
  output?: OutputConfig;
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
  format?: string;
  path?: string;
}

export interface LifecycleConfig {
  before?: string[];
  after?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type ProtocolType = 'http' | 'grpc' | 'graphql' | 'websocket';
