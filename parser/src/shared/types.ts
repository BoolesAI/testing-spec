import type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, Assertion, EnvironmentConfig } from '../parser/types.js';
import type { DataRow } from '../parser/data-driver.js';
import type { AssertionResult, AssertionSummary } from '../assertion/types.js';

export interface TestCase {
  id: string;
  description: string;
  metadata: TSpecMetadata;
  protocol: ProtocolType | null;
  request: HttpRequest | GrpcRequest | GraphqlRequest | WebsocketRequest | undefined;
  assertions: Assertion[];
  extract?: Record<string, string>;
  output?: TSpec['output'];
  lifecycle?: TSpec['lifecycle'];
  environment?: EnvironmentConfig;
  _dataRow?: DataRow;
  _raw: TSpec;
}

export interface GenerateOptions {
  params?: Record<string, unknown>;
  env?: Record<string, string>;
  extracted?: Record<string, unknown>;
}

export interface GenerateFromStringOptions extends GenerateOptions {
  baseDir?: string;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  assertions: AssertionResult[];
  summary: AssertionSummary;
  extracted: Record<string, unknown>;
}

export interface AssertOptions {
  baseDir?: string;
}

export interface Response {
  statusCode?: number;
  status?: number;
  grpcCode?: number;
  code?: number;
  body: unknown;
  headers?: Record<string, string>;
  responseTime?: number;
  duration?: number;
}
