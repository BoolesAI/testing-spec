export {
  // Main API
  generateTestCases,
  generateTestCasesFromString,
  assertResults,
  assertMultipleResults,
  
  // Parser utilities
  parseYamlFile,
  parseYamlString,
  validateTspec,
  
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
  parseCSV,
  
  // Assertion utilities
  runAssertions,
  runAssertion,
  extractJsonPath,
  extractVariables,
  getAssertionSummary
} from './core/index.js';

export type {
  // Types
  TestCase,
  TestResult,
  GenerateOptions,
  GenerateFromStringOptions,
  AssertOptions,
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
  ParameterizedSpec,
  AssertionResult,
  AssertionSummary,
  Response
} from './core/index.js';
