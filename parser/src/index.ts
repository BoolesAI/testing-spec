// Main API - backward compatible exports
export {
  // Test case generation
  generateTestCases,
  generateTestCasesFromString,
  
  // Parser utilities
  parseYamlFile,
  parseYamlString,
  validateTspec,
  validateDslFormat,
  
  // Template utilities
  deepMerge,
  applyTemplateInheritance,
  
  // Variable utilities
  replaceVariables,
  buildVariableContext,
  getBuiltinFunctions,
  
  // Data-driven utilities
  generateParameterizedCases,
  loadDataFile,
  parseCSV
} from './parser/index.js';

// Assertion exports
export {
  runAssertions,
  runAssertion,
  extractJsonPath,
  extractVariables,
  getAssertionSummary,
  compareValues
} from './assertion/index.js';

// Runner exports
export {
  createRunner,
  executeTestCase,
  HttpRunner
} from './runner/index.js';

// Type exports
export type {
  // Parser types
  TestCase,
  GenerateOptions,
  GenerateFromStringOptions,
  TSpec,
  TSpecMetadata,
  ProtocolType,
  HttpRequest,
  GrpcRequest,
  GraphqlRequest,
  WebsocketRequest,
  Assertion,
  ValidationResult,
  EnvironmentConfig,
  DataConfig,
  OutputConfig,
  LifecycleConfig,
  VariableContext,
  DataFormat,
  DataRow,
  ParameterizedSpec
} from './parser/index.js';

export type {
  // Assertion types
  Response,
  AssertionResult,
  AssertionSummary,
  ComparisonOperator
} from './assertion/index.js';

export type {
  // Runner types
  TestRunner,
  TestResult,
  RunnerOptions,
  HttpRunnerOptions
} from './runner/index.js';

// Module namespaces for advanced usage
export * as parser from './parser/index.js';
export * as assertion from './assertion/index.js';
export * as runner from './runner/index.js';
