import type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, WebRequest, Assertion, ValidationResult, EnvironmentConfig, TSpecSuite, SuiteMetadata, ExecutionConfig, SuiteLifecycleConfig, SuiteLifecycleAction } from './types.js';
import type { DataRow } from './data-driver.js';
export interface TestCase {
    id: string;
    description: string;
    metadata: TSpecMetadata;
    protocol: ProtocolType | null;
    request: HttpRequest | GrpcRequest | GraphqlRequest | WebsocketRequest | WebRequest | undefined;
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
    typeFilter?: string;
}
export interface GenerateFromStringOptions extends GenerateOptions {
    baseDir?: string;
}
export declare function validateTestCase(filePath: string): ValidationResult;
export declare function parseTestCases(filePath: string, options?: GenerateOptions): TestCase[];
export declare function parseTestCasesFromString(content: string, options?: GenerateFromStringOptions): TestCase[];
export declare function getTypeFromFilePath(filePath: string): string | null;
/**
 * Checks if a file path is a suite file
 */
export declare function isSuiteFile(filePath: string): boolean;
/**
 * Checks if a file path is a suite template file
 */
export declare function isSuiteTemplateFile(filePath: string): boolean;
/**
 * Gets the protocol type from a suite file path
 */
export declare function getSuiteProtocolType(filePath: string): string | null;
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
    file: string;
    skip?: boolean;
    only?: boolean;
    variables?: Record<string, unknown>;
    timeout?: string;
}
/**
 * Validates a suite file
 */
export declare function validateSuiteFile(filePath: string): ValidationResult;
/**
 * Parses a suite file and returns the raw TSpecSuite object
 */
export declare function parseSuiteFile(filePath: string): TSpecSuite;
/**
 * Parses a suite from string content
 */
export declare function parseSuiteFromString(content: string): TSpecSuite;
/**
 * Applies template inheritance to a suite
 */
export declare function applySuiteTemplateInheritance(suite: TSpecSuite, baseDir: string): TSpecSuite;
export { parseYamlFile, parseYamlString, getProtocolType, getBaseDir } from './yaml-parser.js';
export { validateTspec, validateDslFormat, validateSuite, validateSuiteDslFormat, isSuiteContent } from './schema.js';
export { parseRelatedCodeReference, validateRelatedCodeFormat, formatRelatedCodeReference, RELATED_CODE_PATTERN } from './related-code.js';
export { deepMerge, applyTemplateInheritance, clearTemplateCache } from './template.js';
export { replaceVariables, buildVariableContext, getBuiltinFunctions } from './variables.js';
export { generateParameterizedCases, loadDataFile, parseCSV } from './data-driver.js';
export type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, Assertion, ValidationResult, EnvironmentConfig, DataConfig, OutputConfig, LifecycleConfig, LifecycleAction, LifecycleScope, LifecycleActionType, LineRange, RelatedCodeReference, TSpecSuite, SuiteDefinition, SuiteMetadata, TestReference, SuiteReference, ExecutionConfig, RetryConfig, SuiteLifecycleConfig, SuiteLifecycleAction, SuiteResult, SuiteTestResult, HookResult, SuiteStats, SuiteAssertionResult } from './types.js';
export type { VariableContext } from './variables.js';
export type { DataFormat, DataRow, ParameterizedSpec } from './data-driver.js';
