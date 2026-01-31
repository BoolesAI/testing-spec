import type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, Assertion, ValidationResult, EnvironmentConfig } from './types.js';
import type { DataRow } from './data-driver.js';
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
    typeFilter?: string;
}
export interface GenerateFromStringOptions extends GenerateOptions {
    baseDir?: string;
}
export declare function validateTestCase(filePath: string): ValidationResult;
export declare function parseTestCases(filePath: string, options?: GenerateOptions): TestCase[];
export declare function parseTestCasesFromString(content: string, options?: GenerateFromStringOptions): TestCase[];
export declare function getTypeFromFilePath(filePath: string): string | null;
export { parseYamlFile, parseYamlString, getProtocolType, getBaseDir } from './yaml-parser.js';
export { validateTspec, validateDslFormat } from './schema.js';
export { parseRelatedCodeReference, validateRelatedCodeFormat, formatRelatedCodeReference, RELATED_CODE_PATTERN } from './related-code.js';
export { deepMerge, applyTemplateInheritance, clearTemplateCache } from './template.js';
export { replaceVariables, buildVariableContext, getBuiltinFunctions } from './variables.js';
export { generateParameterizedCases, loadDataFile, parseCSV } from './data-driver.js';
export type { TSpec, TSpecMetadata, ProtocolType, HttpRequest, GrpcRequest, GraphqlRequest, WebsocketRequest, Assertion, ValidationResult, EnvironmentConfig, DataConfig, OutputConfig, LifecycleConfig, LifecycleAction, LifecycleScope, LifecycleActionType, LineRange, RelatedCodeReference } from './types.js';
export type { VariableContext } from './variables.js';
export type { DataFormat, DataRow, ParameterizedSpec } from './data-driver.js';
