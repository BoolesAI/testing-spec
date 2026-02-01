import path from 'path';
import { parseYamlFile, parseYamlString, getProtocolType, getBaseDir } from './yaml-parser.js';
import { validateTspec, validateDslFormat, validateSuite, validateSuiteDslFormat, isSuiteContent } from './schema.js';
import { applyTemplateInheritance, deepMerge } from './template.js';
import { replaceVariables, buildVariableContext, getBuiltinFunctions } from './variables.js';
import { generateParameterizedCases, loadDataFile, parseCSV } from './data-driver.js';
import type { 
  TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, 
  Assertion, ValidationResult, EnvironmentConfig, DataConfig, OutputConfig, LifecycleConfig, 
  LifecycleAction, LifecycleScope, LifecycleActionType, LineRange, RelatedCodeReference,
  // Suite types
  TSpecSuite, SuiteDefinition, SuiteMetadata, TestReference, SuiteReference,
  ExecutionConfig, RetryConfig, SuiteLifecycleConfig, SuiteLifecycleAction,
  SuiteResult, SuiteTestResult, HookResult, SuiteStats, SuiteAssertionResult
} from './types.js';
import type { VariableContext } from './variables.js';
import type { DataFormat, DataRow, ParameterizedSpec } from './data-driver.js';

export interface TestCase {
  id: string;
  description: string;
  metadata: TSpecMetadata;
  protocol: ProtocolType | null;
  request: HttpRequest | GrpcRequest | GraphqlRequest | WebsocketRequest | undefined;
  assertions: Assertion[];
  lifecycle?: TSpec['lifecycle'];
  environment?: EnvironmentConfig;
  variables?: Record<string, unknown>;
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

export function validateTestCase(filePath: string): ValidationResult {
  try {
    const spec = parseYamlFile(filePath);
    return validateTspec(spec);
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

export function parseTestCases(filePath: string, options: GenerateOptions = {}): TestCase[] {
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
      lifecycle: processedSpec.lifecycle,
      environment: processedSpec.environment,
      variables: processedSpec.variables,
      _dataRow: caseSpec._dataRow,
      _raw: processedSpec
    };
  });
  
  return testCases;
}

export function parseTestCasesFromString(content: string, options: GenerateFromStringOptions = {}): TestCase[] {
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
      lifecycle: processedSpec.lifecycle,
      environment: processedSpec.environment,
      variables: processedSpec.variables,
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

// ============================================================================
// Suite Parsing
// ============================================================================

/**
 * Suite file extensions pattern
 */
const SUITE_EXTENSIONS = /\.(http|grpc|graphql|ws)?\.?tsuite$/i;
const SUITE_TEMPLATE_EXTENSION = /\.tsuite\.yaml$/i;

/**
 * Checks if a file path is a suite file
 */
export function isSuiteFile(filePath: string): boolean {
  return SUITE_EXTENSIONS.test(filePath);
}

/**
 * Checks if a file path is a suite template file
 */
export function isSuiteTemplateFile(filePath: string): boolean {
  return SUITE_TEMPLATE_EXTENSION.test(filePath);
}

/**
 * Gets the protocol type from a suite file path
 */
export function getSuiteProtocolType(filePath: string): string | null {
  const match = filePath.match(/\.(http|grpc|graphql|ws)\.tsuite$/i);
  if (match) {
    const proto = match[1].toLowerCase();
    return proto === 'ws' ? 'websocket' : proto;
  }
  return null; // Mixed protocol suite
}

export interface ParseSuiteOptions {
  params?: Record<string, unknown>;
  env?: Record<string, string>;
  extracted?: Record<string, unknown>;
}

/**
 * Parsed suite with resolved test files
 */
export interface ParsedSuite {
  name: string;
  description?: string;
  version?: string;
  filePath: string;
  
  metadata?: SuiteMetadata;
  environment?: EnvironmentConfig;
  variables?: Record<string, unknown>;
  
  lifecycle?: SuiteLifecycleConfig;
  before_each?: SuiteLifecycleAction[];
  after_each?: SuiteLifecycleAction[];
  
  execution?: ExecutionConfig;
  depends_on?: string[];
  
  tests: ResolvedTestReference[];
  nestedSuites: ParsedSuite[];
  
  _raw: TSpecSuite;
}

/**
 * Resolved test reference with actual file paths
 */
export interface ResolvedTestReference {
  file: string;           // Resolved absolute path
  skip?: boolean;
  only?: boolean;
  variables?: Record<string, unknown>;
  timeout?: string;
}

/**
 * Validates a suite file
 */
export function validateSuiteFile(filePath: string): ValidationResult {
  try {
    const spec = parseYamlFile(filePath) as unknown as TSpecSuite;
    return validateSuite(spec);
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

/**
 * Parses a suite file and returns the raw TSpecSuite object
 */
export function parseSuiteFile(filePath: string): TSpecSuite {
  const spec = parseYamlFile(filePath) as unknown as TSpecSuite;
  
  const validation = validateSuite(spec);
  if (!validation.valid) {
    throw new Error(`Invalid suite file: ${validation.errors.join(', ')}`);
  }
  
  return spec;
}

/**
 * Parses a suite from string content
 */
export function parseSuiteFromString(content: string): TSpecSuite {
  const spec = parseYamlString(content) as unknown as TSpecSuite;
  
  const validation = validateSuite(spec);
  if (!validation.valid) {
    throw new Error(`Invalid suite content: ${validation.errors.join(', ')}`);
  }
  
  return spec;
}

/**
 * Applies template inheritance to a suite
 */
export function applySuiteTemplateInheritance(suite: TSpecSuite, baseDir: string): TSpecSuite {
  if (!suite.suite.extends) {
    return suite;
  }
  
  const templatePath = path.resolve(baseDir, suite.suite.extends);
  const templateSpec = parseYamlFile(templatePath) as unknown as TSpecSuite;
  
  // Recursively apply template inheritance
  const resolvedTemplate = applySuiteTemplateInheritance(templateSpec, path.dirname(templatePath));
  
  // Deep merge: template first, then suite (suite overrides template)
  const mergedSuite: TSpecSuite = {
    suite: {
      // Required field from suite
      name: suite.suite.name,
      
      // Merge optional fields
      description: suite.suite.description ?? resolvedTemplate.suite.description,
      version: suite.suite.version ?? resolvedTemplate.suite.version,
      
      // Merge metadata
      metadata: suite.suite.metadata || resolvedTemplate.suite.metadata
        ? deepMerge(
            (resolvedTemplate.suite.metadata || {}) as unknown as Record<string, unknown>, 
            (suite.suite.metadata || {}) as unknown as Record<string, unknown>
          ) as unknown as SuiteMetadata
        : undefined,
      
      // Merge environment
      environment: suite.suite.environment || resolvedTemplate.suite.environment
        ? deepMerge(
            (resolvedTemplate.suite.environment || {}) as unknown as Record<string, unknown>, 
            (suite.suite.environment || {}) as unknown as Record<string, unknown>
          ) as unknown as EnvironmentConfig
        : undefined,
      
      // Merge variables
      variables: suite.suite.variables || resolvedTemplate.suite.variables
        ? deepMerge(resolvedTemplate.suite.variables || {}, suite.suite.variables || {})
        : undefined,
      
      // Merge lifecycle (append arrays)
      lifecycle: mergeSuiteLifecycle(resolvedTemplate.suite.lifecycle, suite.suite.lifecycle),
      
      // Merge before_each/after_each (append arrays)
      before_each: mergeLifecycleActions(resolvedTemplate.suite.before_each, suite.suite.before_each),
      after_each: mergeLifecycleActions(resolvedTemplate.suite.after_each, suite.suite.after_each),
      
      // Merge execution config
      execution: suite.suite.execution || resolvedTemplate.suite.execution
        ? deepMerge(
            (resolvedTemplate.suite.execution || {}) as unknown as Record<string, unknown>, 
            (suite.suite.execution || {}) as unknown as Record<string, unknown>
          ) as unknown as ExecutionConfig
        : undefined,
      
      // depends_on from suite only (not inherited)
      depends_on: suite.suite.depends_on,
      
      // Tests and suites from suite only (not inherited)
      tests: suite.suite.tests,
      suites: suite.suite.suites
    }
  };
  
  return mergedSuite;
}

/**
 * Merges suite lifecycle configs (appending arrays)
 */
function mergeSuiteLifecycle(
  parent?: SuiteLifecycleConfig, 
  child?: SuiteLifecycleConfig
): SuiteLifecycleConfig | undefined {
  if (!parent && !child) return undefined;
  
  return {
    setup: mergeLifecycleActions(parent?.setup, child?.setup),
    teardown: mergeLifecycleActions(parent?.teardown, child?.teardown)
  };
}

/**
 * Merges lifecycle action arrays (parent first, then child)
 */
function mergeLifecycleActions(
  parent?: SuiteLifecycleAction[], 
  child?: SuiteLifecycleAction[]
): SuiteLifecycleAction[] | undefined {
  if (!parent && !child) return undefined;
  return [...(parent || []), ...(child || [])];
}

// Re-exports
export { parseYamlFile, parseYamlString, getProtocolType, getBaseDir } from './yaml-parser.js';
export { validateTspec, validateDslFormat, validateSuite, validateSuiteDslFormat, isSuiteContent } from './schema.js';
export { parseRelatedCodeReference, validateRelatedCodeFormat, formatRelatedCodeReference, RELATED_CODE_PATTERN } from './related-code.js';
export { deepMerge, applyTemplateInheritance, clearTemplateCache } from './template.js';
export { replaceVariables, buildVariableContext, getBuiltinFunctions } from './variables.js';
export { generateParameterizedCases, loadDataFile, parseCSV } from './data-driver.js';

// Type exports
export type { 
  TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, 
  Assertion, ValidationResult, EnvironmentConfig, DataConfig, OutputConfig, LifecycleConfig, 
  LifecycleAction, LifecycleScope, LifecycleActionType, LineRange, RelatedCodeReference,
  // Suite types
  TSpecSuite, SuiteDefinition, SuiteMetadata, TestReference, SuiteReference,
  ExecutionConfig, RetryConfig, SuiteLifecycleConfig, SuiteLifecycleAction,
  SuiteResult, SuiteTestResult, HookResult, SuiteStats, SuiteAssertionResult
} from './types.js';
export type { VariableContext } from './variables.js';
export type { DataFormat, DataRow, ParameterizedSpec } from './data-driver.js';
