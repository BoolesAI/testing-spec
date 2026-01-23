import path from 'path';
import { parseYamlFile, parseYamlString, getProtocolType, getBaseDir } from './yaml-parser.js';
import { validateTspec, validateDslFormat } from './schema.js';
import { applyTemplateInheritance, deepMerge } from './template.js';
import { replaceVariables, buildVariableContext, getBuiltinFunctions } from './variables.js';
import { generateParameterizedCases, loadDataFile, parseCSV } from './data-driver.js';
import type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, Assertion, ValidationResult, EnvironmentConfig, DataConfig, OutputConfig, LifecycleConfig } from './types.js';
import type { VariableContext } from './variables.js';
import type { DataFormat, DataRow, ParameterizedSpec } from './data-driver.js';

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
  typeFilter?: string;  // '*' for all types, or specific type like 'http', 'grpc', etc.
}

export interface GenerateFromStringOptions extends GenerateOptions {
  baseDir?: string;
}

export function generateTestCases(filePath: string, options: GenerateOptions = {}): TestCase[] {
  const { params = {}, env = {}, extracted = {}, typeFilter = '*' } = options;
  
  // Extract type from file extension and check filter
  const fileType = getTypeFromFilePath(filePath);
  if (typeFilter !== '*' && fileType !== typeFilter) {
    return [];
  }
  
  const baseDir = getBaseDir(filePath);
  let spec = parseYamlFile(filePath);
  
  const validation = validateTspec(spec);
  if (!validation.valid) {
    throw new Error(`Invalid tspec file: ${validation.errors.join(', ')}`);
  }
  
  spec = applyTemplateInheritance(spec, baseDir);
  
  const parameterizedSpecs = generateParameterizedCases(spec, baseDir);
  
  const testCases = parameterizedSpecs.map((caseSpec, index) => {
    const context = buildVariableContext(caseSpec, params, extracted);
    
    context.env = { ...context.env, ...env };
    
    const processedSpec = replaceVariables(caseSpec, context);
    
    const protocol = getProtocolType(processedSpec);
    const request = protocol ? processedSpec[protocol] : undefined;
    
    if (protocol === 'http' && processedSpec.environment && request) {
      const envConfig = processedSpec.environment;
      (request as HttpRequest)._baseUrl = buildBaseUrl(envConfig);
    }
    
    const dataRowSuffix = caseSpec._dataRowIndex !== undefined ? `_row${caseSpec._dataRowIndex}` : '';
    const id = generateTestCaseId(filePath, index, dataRowSuffix);
    
    return {
      id,
      description: processedSpec.description,
      metadata: processedSpec.metadata,
      protocol,
      request,
      assertions: processedSpec.assertions,
      extract: processedSpec.extract,
      output: processedSpec.output,
      lifecycle: processedSpec.lifecycle,
      environment: processedSpec.environment,
      _dataRow: caseSpec._dataRow,
      _raw: processedSpec
    };
  });
  
  return testCases;
}

export function generateTestCasesFromString(content: string, options: GenerateFromStringOptions = {}): TestCase[] {
  const { baseDir = process.cwd(), params = {}, env = {}, extracted = {} } = options;
  
  let spec = parseYamlString(content);
  
  const validation = validateTspec(spec);
  if (!validation.valid) {
    throw new Error(`Invalid tspec content: ${validation.errors.join(', ')}`);
  }
  
  spec = applyTemplateInheritance(spec, baseDir);
  
  const parameterizedSpecs = generateParameterizedCases(spec, baseDir);
  
  const testCases = parameterizedSpecs.map((caseSpec, index) => {
    const context = buildVariableContext(caseSpec, params, extracted);
    context.env = { ...context.env, ...env };
    
    const processedSpec = replaceVariables(caseSpec, context);
    const protocol = getProtocolType(processedSpec);
    const request = protocol ? processedSpec[protocol] : undefined;
    
    if (protocol === 'http' && processedSpec.environment && request) {
      (request as HttpRequest)._baseUrl = buildBaseUrl(processedSpec.environment);
    }
    
    const dataRowSuffix = caseSpec._dataRowIndex !== undefined ? `_row${caseSpec._dataRowIndex}` : '';
    const id = `inline_${index}${dataRowSuffix}`;
    
    return {
      id,
      description: processedSpec.description,
      metadata: processedSpec.metadata,
      protocol,
      request,
      assertions: processedSpec.assertions,
      extract: processedSpec.extract,
      output: processedSpec.output,
      lifecycle: processedSpec.lifecycle,
      environment: processedSpec.environment,
      _dataRow: caseSpec._dataRow,
      _raw: processedSpec
    };
  });
  
  return testCases;
}

function buildBaseUrl(envConfig: EnvironmentConfig): string {
  const scheme = envConfig.scheme || 'https';
  const host = envConfig.host || 'localhost';
  const port = envConfig.port;
  
  let url = `${scheme}://${host}`;
  if (port && port !== '443' && port !== '80' && port !== 443 && port !== 80) {
    url += `:${port}`;
  }
  if (envConfig.variables?.base_path) {
    url += envConfig.variables.base_path;
  }
  
  return url;
}

function generateTestCaseId(filePath: string, index: number, suffix = ''): string {
  const baseName = path.basename(filePath, path.extname(filePath));
  const cleanName = baseName.replace(/\.(http|grpc|graphql|websocket)$/, '');
  return `${cleanName}${suffix}`;
}

export function getTypeFromFilePath(filePath: string): string | null {
  const match = filePath.match(/\.(http|grpc|graphql|websocket)\.tspec$/i);
  return match ? match[1].toLowerCase() : null;
}

// Re-exports
export { parseYamlFile, parseYamlString, getProtocolType, getBaseDir } from './yaml-parser.js';
export { validateTspec, validateDslFormat } from './schema.js';
export { deepMerge, applyTemplateInheritance } from './template.js';
export { replaceVariables, buildVariableContext, getBuiltinFunctions } from './variables.js';
export { generateParameterizedCases, loadDataFile, parseCSV } from './data-driver.js';

// Type exports
export type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, Assertion, ValidationResult, EnvironmentConfig, DataConfig, OutputConfig, LifecycleConfig } from './types.js';
export type { VariableContext } from './variables.js';
export type { DataFormat, DataRow, ParameterizedSpec } from './data-driver.js';
