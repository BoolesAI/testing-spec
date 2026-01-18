import { parseYamlFile, parseYamlString, validateTspec, getProtocolType, getBaseDir } from './parser.js';
import type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, Assertion, EnvironmentConfig } from './parser.js';
import { applyTemplateInheritance } from './template.js';
import { replaceVariables, buildVariableContext } from './variables.js';
import { generateParameterizedCases, type ParameterizedSpec, type DataRow } from './data-driver.js';
import { runAssertions, extractVariables, getAssertionSummary, extractJsonPath, type AssertionResult, type AssertionSummary, type Response } from './assertions.js';
import path from 'path';

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

export function generateTestCases(filePath: string, options: GenerateOptions = {}): TestCase[] {
  const { params = {}, env = {}, extracted = {} } = options;
  
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

export function assertResults(response: Response, testCase: TestCase, options: AssertOptions = {}): TestResult {
  const { baseDir = process.cwd() } = options;
  
  const assertionResults = runAssertions(response, testCase.assertions, baseDir);
  
  const extracted = testCase.extract ? extractVariables(response, testCase.extract) : {};
  
  const summary = getAssertionSummary(assertionResults);
  
  const passed = assertionResults.every(r => r.passed);
  
  return {
    testCaseId: testCase.id,
    passed,
    assertions: assertionResults,
    summary,
    extracted
  };
}

export function assertMultipleResults(
  results: Array<{ response: Response; testCase: TestCase }>,
  options: AssertOptions = {}
): TestResult[] {
  return results.map(({ response, testCase }) => assertResults(response, testCase, options));
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

// Re-export utilities for advanced usage
export { parseYamlFile, parseYamlString, validateTspec } from './parser.js';
export type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, Assertion, ValidationResult, EnvironmentConfig, DataConfig, OutputConfig, LifecycleConfig } from './parser.js';
export { deepMerge, applyTemplateInheritance } from './template.js';
export { replaceVariables, buildVariableContext, getBuiltinFunctions } from './variables.js';
export type { VariableContext } from './variables.js';
export { generateParameterizedCases, loadDataFile, parseCSV } from './data-driver.js';
export type { DataFormat, DataRow, ParameterizedSpec } from './data-driver.js';
export { runAssertions, runAssertion, extractJsonPath, extractVariables, getAssertionSummary } from './assertions.js';
export type { AssertionResult, AssertionSummary, Response } from './assertions.js';
