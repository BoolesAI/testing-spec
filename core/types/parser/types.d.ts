/**
 * Represents a line range in a source file.
 * For single lines, start equals end.
 */
export interface LineRange {
    start: number;
    end: number;
}
/**
 * Represents a parsed related_code reference with optional line ranges.
 *
 * @example
 * // Plain path
 * { filePath: "src/auth/login.js", rawValue: "src/auth/login.js" }
 *
 * @example
 * // With line references
 * {
 *   filePath: "src/auth/login.js",
 *   lineRanges: [{ start: 1, end: 10 }, { start: 20, end: 20 }],
 *   rawValue: "src/auth/login.js[1-10,20]"
 * }
 */
export interface RelatedCodeReference {
    filePath: string;
    lineRanges?: LineRange[];
    rawValue: string;
}
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
    save_response_on_failure?: boolean;
    metrics?: string[];
    notifications?: Array<{
        type: string;
        channel?: string;
        condition?: 'failure' | 'success' | 'always';
    }>;
}
export type LifecycleActionType = 'script' | 'extract' | 'output';
export type LifecycleScope = 'test' | 'assert' | 'run' | 'data';
export interface LifecycleAction {
    action: LifecycleActionType;
    scope: LifecycleScope;
    source?: string;
    vars?: Record<string, string>;
    config?: OutputConfig;
}
export interface LifecycleConfig {
    setup?: LifecycleAction[];
    teardown?: LifecycleAction[];
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
export type ProtocolType = 'http' | 'grpc' | 'graphql' | 'websocket';
/**
 * Extended lifecycle action types for suite-level hooks
 */
export type SuiteLifecycleActionType = 'script' | 'http' | 'grpc' | 'extract' | 'output' | 'wait' | 'log';
/**
 * HTTP request action for lifecycle hooks
 */
export interface HttpLifecycleAction {
    action: 'http';
    request: {
        method: string;
        path: string;
        headers?: Record<string, string>;
        body?: unknown;
    };
    extract?: Record<string, string>;
}
/**
 * Wait action for lifecycle hooks
 */
export interface WaitLifecycleAction {
    action: 'wait';
    duration: string;
}
/**
 * Log action for lifecycle hooks
 */
export interface LogLifecycleAction {
    action: 'log';
    message: string;
    level?: 'info' | 'warn' | 'error' | 'debug';
}
/**
 * gRPC request action for lifecycle hooks
 */
export interface GrpcLifecycleAction {
    action: 'grpc';
    request: {
        service: string;
        method: string;
        message: unknown;
    };
    extract?: Record<string, string>;
}
/**
 * Union type for all suite lifecycle actions
 */
export type SuiteLifecycleAction = LifecycleAction | HttpLifecycleAction | WaitLifecycleAction | LogLifecycleAction | GrpcLifecycleAction;
/**
 * Suite metadata - extends test metadata with additional fields
 */
export interface SuiteMetadata {
    prompt?: string;
    related_code?: string[];
    test_category?: 'functional' | 'integration' | 'performance' | 'security';
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    timeout?: string;
    owner?: string;
}
/**
 * Test reference - either single file or glob pattern
 * Either 'file' or 'files' must be specified, not both
 */
export interface TestReference {
    file?: string;
    files?: string;
    skip?: boolean;
    only?: boolean;
    variables?: Record<string, unknown>;
    timeout?: string;
}
/**
 * Suite reference for nested suites
 */
export interface SuiteReference {
    file: string;
    skip?: boolean;
    only?: boolean;
}
/**
 * Retry configuration for suite execution
 */
export interface RetryConfig {
    count?: number;
    delay?: string;
    on_failure_only?: boolean;
}
/**
 * Execution configuration for suite
 */
export interface ExecutionConfig {
    parallel_tests?: boolean;
    parallel_suites?: boolean;
    concurrency?: number;
    order?: 'defined' | 'random';
    fail_fast?: boolean;
    retry?: RetryConfig;
    timeout?: string;
}
/**
 * Suite lifecycle configuration with before_each/after_each hooks
 */
export interface SuiteLifecycleConfig {
    setup?: SuiteLifecycleAction[];
    teardown?: SuiteLifecycleAction[];
}
/**
 * Suite definition - the main structure of a test suite
 */
export interface SuiteDefinition {
    name: string;
    description?: string;
    version?: string;
    extends?: string;
    depends_on?: string[];
    metadata?: SuiteMetadata;
    environment?: EnvironmentConfig;
    variables?: Record<string, unknown>;
    lifecycle?: SuiteLifecycleConfig;
    before_each?: SuiteLifecycleAction[];
    after_each?: SuiteLifecycleAction[];
    execution?: ExecutionConfig;
    tests?: TestReference[];
    suites?: SuiteReference[];
}
/**
 * Top-level structure for a .tsuite file
 */
export interface TSpecSuite {
    suite: SuiteDefinition;
}
/**
 * Suite result statistics
 */
export interface SuiteStats {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    error: number;
}
/**
 * Hook execution result
 */
export interface HookResult {
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
}
/**
 * Suite execution result
 */
export interface SuiteResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped' | 'error' | 'blocked';
    duration: number;
    stats: SuiteStats;
    setup?: HookResult;
    teardown?: HookResult;
    tests: SuiteTestResult[];
    suites?: SuiteResult[];
}
/**
 * Test execution result (for suite context)
 */
export interface SuiteTestResult {
    name: string;
    file: string;
    status: 'passed' | 'failed' | 'skipped' | 'error';
    duration: number;
    error?: string;
    assertions?: SuiteAssertionResult[];
}
/**
 * Assertion result (for suite context)
 */
export interface SuiteAssertionResult {
    type: string;
    passed: boolean;
    message?: string;
    expected?: unknown;
    actual?: unknown;
}
