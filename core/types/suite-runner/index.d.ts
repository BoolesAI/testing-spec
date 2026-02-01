import type { SuiteLifecycleAction, TestReference, SuiteResult, SuiteTestResult, HookResult, EnvironmentConfig } from '../parser/types.js';
import type { Response } from '../assertion/types.js';
/**
 * Context for suite lifecycle action execution
 */
export interface SuiteLifecycleContext {
    variables: Record<string, unknown>;
    extractedVars: Record<string, unknown>;
    response?: Response;
    environment?: EnvironmentConfig;
}
/**
 * Options for suite execution
 */
export interface SuiteRunnerOptions {
    params?: Record<string, unknown>;
    env?: Record<string, string>;
    extracted?: Record<string, unknown>;
    cwd?: string;
    onTestStart?: (testFile: string) => void;
    onTestComplete?: (testFile: string, result: SuiteTestResult) => void;
    onSuiteStart?: (suiteName: string) => void;
    onSuiteComplete?: (suiteName: string, result: SuiteResult) => void;
}
/**
 * Create a new suite lifecycle context
 */
export declare function createSuiteLifecycleContext(variables?: Record<string, unknown>, environment?: EnvironmentConfig): SuiteLifecycleContext;
/**
 * Execute a single suite lifecycle action
 */
export declare function executeSuiteLifecycleAction(action: SuiteLifecycleAction, context: SuiteLifecycleContext): Promise<void>;
/**
 * Execute all suite lifecycle actions
 */
export declare function executeSuiteLifecycleActions(actions: SuiteLifecycleAction[] | undefined, context: SuiteLifecycleContext): Promise<HookResult>;
/**
 * Resolve test files from test references
 */
export declare function resolveTestFiles(tests: TestReference[] | undefined, baseDir: string): Promise<string[]>;
/**
 * Execute a test suite
 */
export declare function executeSuite(suitePath: string, options?: SuiteRunnerOptions): Promise<SuiteResult>;
