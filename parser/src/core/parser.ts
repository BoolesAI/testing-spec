import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

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
  ai_prompt: string;
  related_code: string[];
  test_category: 'functional' | 'integration' | 'performance' | 'security';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  timeout: string;
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

export function parseYamlFile(filePath: string): TSpec {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return yaml.load(content) as TSpec;
}

export function parseYamlString(content: string): TSpec {
  return yaml.load(content) as TSpec;
}

export function validateTspec(spec: TSpec): ValidationResult {
  const errors: string[] = [];
  const requiredFields = ['version', 'description', 'metadata', 'assertions'] as const;
  
  for (const field of requiredFields) {
    if (!(field in spec)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  const protocolBlocks: ProtocolType[] = ['http', 'grpc', 'graphql', 'websocket'];
  const hasProtocol = protocolBlocks.some(p => p in spec);
  if (!hasProtocol) {
    errors.push('Missing protocol block (http, grpc, etc.)');
  }
  
  if (spec.metadata) {
    const requiredMetadata = ['ai_prompt', 'related_code', 'test_category', 'risk_level', 'tags', 'priority', 'timeout'] as const;
    for (const field of requiredMetadata) {
      if (!(field in spec.metadata)) {
        errors.push(`Missing required metadata field: ${field}`);
      }
    }
    
    const validCategories = ['functional', 'integration', 'performance', 'security'];
    if (spec.metadata.test_category && !validCategories.includes(spec.metadata.test_category)) {
      errors.push(`Invalid test_category: ${spec.metadata.test_category}. Must be one of: ${validCategories.join(', ')}`);
    }
    
    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    if (spec.metadata.risk_level && !validRiskLevels.includes(spec.metadata.risk_level)) {
      errors.push(`Invalid risk_level: ${spec.metadata.risk_level}. Must be one of: ${validRiskLevels.join(', ')}`);
    }
    
    const validPriorities = ['low', 'medium', 'high'];
    if (spec.metadata.priority && !validPriorities.includes(spec.metadata.priority)) {
      errors.push(`Invalid priority: ${spec.metadata.priority}. Must be one of: ${validPriorities.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function getProtocolType(spec: TSpec): ProtocolType | null {
  const protocols: ProtocolType[] = ['http', 'grpc', 'graphql', 'websocket'];
  for (const protocol of protocols) {
    if (protocol in spec) {
      return protocol;
    }
  }
  return null;
}

export function getBaseDir(filePath: string): string {
  return path.dirname(path.resolve(filePath));
}
