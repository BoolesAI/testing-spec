import { glob } from 'glob';
import path from 'path';
import type { 
  TSpecSuite, 
  SuiteDefinition, 
  SuiteLifecycleAction,
  SuiteLifecycleConfig,
  TestReference,
  SuiteReference,
  SuiteResult,
  SuiteTestResult,
  HookResult,
  SuiteStats,
  EnvironmentConfig
} from '../parser/types.js';
import type { TestCase } from '../parser/index.js';
import type { Response } from '../assertion/types.js';
import { 
  parseSuiteFile, 
  applySuiteTemplateInheritance,
  parseTestCases,
  getBaseDir
} from '../parser/index.js';
import { executeTestCase } from '../runner/index.js';
import { HttpRunner } from '../runner/http/index.js';

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
  silent?: boolean;  // Suppress console output from lifecycle actions
  onTestStart?: (testFile: string) => void;
  onTestComplete?: (testFile: string, result: SuiteTestResult) => void;
  onSuiteStart?: (suiteName: string) => void;
  onSuiteComplete?: (suiteName: string, result: SuiteResult) => void;
}

/**
 * Create a new suite lifecycle context
 */
export function createSuiteLifecycleContext(
  variables: Record<string, unknown> = {},
  environment?: EnvironmentConfig
): SuiteLifecycleContext {
  return {
    variables: { ...variables },
    extractedVars: {},
    response: undefined,
    environment
  };
}

/**
 * Execute a single suite lifecycle action
 */
export async function executeSuiteLifecycleAction(
  action: SuiteLifecycleAction,
  context: SuiteLifecycleContext,
  silent?: boolean
): Promise<void> {
  switch (action.action) {
    case 'script':
      await executeScriptAction(action, context);
      break;
    case 'http':
      await executeHttpAction(action as { action: 'http'; request: { method: string; path: string; headers?: Record<string, string>; body?: unknown }; extract?: Record<string, string> }, context);
      break;
    case 'grpc':
      await executeGrpcAction(action as { action: 'grpc'; request: { service: string; method: string; message: unknown }; extract?: Record<string, string> }, context);
      break;
    case 'extract':
      await executeExtractAction(action, context);
      break;
    case 'output':
      // Output action - store config for later use
      break;
    case 'wait':
      await executeWaitAction(action as { action: 'wait'; duration: string }, context);
      break;
    case 'log':
      executeLogAction(action as { action: 'log'; message: string; level?: 'info' | 'warn' | 'error' | 'debug' }, context, silent);
      break;
    default:
      throw new Error(`Unknown suite lifecycle action type: ${(action as SuiteLifecycleAction).action}`);
  }
}

/**
 * Execute all suite lifecycle actions
 */
export async function executeSuiteLifecycleActions(
  actions: SuiteLifecycleAction[] | undefined,
  context: SuiteLifecycleContext,
  silent?: boolean
): Promise<HookResult> {
  const startTime = Date.now();
  
  if (!actions || actions.length === 0) {
    return {
      status: 'passed',
      duration: 0
    };
  }

  try {
    for (const action of actions) {
      await executeSuiteLifecycleAction(action, context, silent);
    }
    return {
      status: 'passed',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Execute a script action
 */
async function executeScriptAction(
  action: SuiteLifecycleAction,
  context: SuiteLifecycleContext
): Promise<void> {
  if (!('source' in action) || !action.source) {
    throw new Error('Script action requires source field');
  }

  try {
    const { execSync } = await import('child_process');
    
    // Execute shell script
    const result = execSync(action.source, {
      encoding: 'utf-8',
      env: {
        ...process.env,
        ...Object.fromEntries(
          Object.entries(context.variables).map(([k, v]) => [k, String(v)])
        )
      }
    });
    
    // Try to parse JSON output as variables
    try {
      const parsed = JSON.parse(result.trim());
      if (parsed && typeof parsed === 'object') {
        Object.assign(context.extractedVars, parsed);
      }
    } catch {
      // Not JSON, ignore
    }
  } catch (error) {
    const err = error as Error;
    throw new Error(`Script action failed: ${err.message}`);
  }
}

/**
 * Execute an HTTP action
 */
async function executeHttpAction(
  action: { action: 'http'; request: { method: string; path: string; headers?: Record<string, string>; body?: unknown }; extract?: Record<string, string> },
  context: SuiteLifecycleContext
): Promise<void> {
  const { request, extract } = action;
  
  // Build base URL from environment
  let baseUrl = 'http://localhost';
  if (context.environment) {
    const scheme = context.environment.scheme || 'http';
    const host = context.environment.host || 'localhost';
    const port = context.environment.port;
    baseUrl = `${scheme}://${host}`;
    if (port && port !== '443' && port !== '80' && port !== 443 && port !== 80) {
      baseUrl += `:${port}`;
    }
  }
  
  const httpRunner = new HttpRunner({});
  
  // Create a minimal test case for the HTTP runner
  const testCase = {
    id: 'lifecycle_http',
    description: 'Lifecycle HTTP action',
    metadata: {},
    protocol: 'http' as const,
    request: {
      method: request.method,
      path: request.path,
      headers: request.headers,
      body: request.body,
      _baseUrl: baseUrl
    },
    assertions: [],
    _raw: {} as any
  };
  
  const response = await httpRunner.execute(testCase);
  context.response = response;
  
  // Extract variables if specified
  if (extract && response) {
    const { extractVariables } = await import('../assertion/extractors.js');
    const extracted = extractVariables(response, extract);
    Object.assign(context.extractedVars, extracted);
  }
}

/**
 * Execute a gRPC action (placeholder)
 */
async function executeGrpcAction(
  action: { action: 'grpc'; request: { service: string; method: string; message: unknown }; extract?: Record<string, string> },
  context: SuiteLifecycleContext
): Promise<void> {
  // gRPC is not yet implemented, throw informative error
  throw new Error('gRPC lifecycle action is not yet supported');
}

/**
 * Execute an extract action
 */
async function executeExtractAction(
  action: SuiteLifecycleAction,
  context: SuiteLifecycleContext
): Promise<void> {
  if (!('vars' in action) || !action.vars) {
    throw new Error('Extract action requires vars field');
  }

  if (!context.response) {
    throw new Error('Extract action requires response to be available');
  }

  const { extractVariables } = await import('../assertion/extractors.js');
  const extracted = extractVariables(context.response, action.vars);
  Object.assign(context.extractedVars, extracted);
}

/**
 * Execute a wait action
 */
async function executeWaitAction(
  action: { action: 'wait'; duration: string },
  context: SuiteLifecycleContext
): Promise<void> {
  const duration = parseDuration(action.duration);
  await new Promise(resolve => setTimeout(resolve, duration));
}

/**
 * Execute a log action
 */
function executeLogAction(
  action: { action: 'log'; message: string; level?: 'info' | 'warn' | 'error' | 'debug' },
  context: SuiteLifecycleContext,
  silent?: boolean
): void {
  if (silent) return;  // Skip all console output in silent mode
  
  const level = action.level || 'info';
  const message = replaceVariablesInString(action.message, {
    ...context.variables,
    ...context.extractedVars
  });
  
  switch (level) {
    case 'error':
      console.error(`[SUITE] ${message}`);
      break;
    case 'warn':
      console.warn(`[SUITE] ${message}`);
      break;
    case 'debug':
      console.debug(`[SUITE] ${message}`);
      break;
    default:
      console.log(`[SUITE] ${message}`);
  }
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/i);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'ms').toLowerCase();
  
  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return value;
  }
}

/**
 * Replace variables in a string
 */
function replaceVariablesInString(str: string, variables: Record<string, unknown>): string {
  return str.replace(/\$\{([^}]+)\}/g, (match, key) => {
    const value = variables[key.trim()];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Resolve test files from test references
 */
export async function resolveTestFiles(
  tests: TestReference[] | undefined,
  baseDir: string
): Promise<string[]> {
  if (!tests || tests.length === 0) {
    return [];
  }
  
  const resolvedFiles: string[] = [];
  
  for (const ref of tests) {
    if (ref.skip) {
      continue;
    }
    
    if (ref.file) {
      // Single file reference
      const filePath = path.resolve(baseDir, ref.file);
      resolvedFiles.push(filePath);
    } else if (ref.files) {
      // Glob pattern
      const matches = await glob(ref.files, { cwd: baseDir, absolute: true });
      resolvedFiles.push(...matches);
    }
  }
  
  return [...new Set(resolvedFiles)]; // Deduplicate
}

/**
 * Execute a test suite
 */
export async function executeSuite(
  suitePath: string,
  options: SuiteRunnerOptions = {}
): Promise<SuiteResult> {
  const { params = {}, env = {}, extracted = {}, cwd, silent, onTestStart, onTestComplete, onSuiteStart, onSuiteComplete } = options;
  const baseDir = cwd || getBaseDir(suitePath);
  const startTime = Date.now();
  
  // Parse and validate suite
  let suite = parseSuiteFile(suitePath);
  suite = applySuiteTemplateInheritance(suite, baseDir);
  
  const suiteDef = suite.suite;
  
  onSuiteStart?.(suiteDef.name);
  
  // Create lifecycle context
  const context = createSuiteLifecycleContext(
    { ...suiteDef.variables, ...params },
    suiteDef.environment
  );
  
  // Merge environment variables
  Object.assign(context.variables, env);
  Object.assign(context.extractedVars, extracted);
  
  const stats: SuiteStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    error: 0
  };
  
  const testResults: SuiteTestResult[] = [];
  const nestedSuiteResults: SuiteResult[] = [];
  let setupResult: HookResult | undefined;
  let teardownResult: HookResult | undefined;
  
  // Execute suite setup
  if (suiteDef.lifecycle?.setup) {
    setupResult = await executeSuiteLifecycleActions(suiteDef.lifecycle.setup, context, silent);
    if (setupResult.status === 'failed') {
      // Setup failed, skip all tests
      return {
        name: suiteDef.name,
        status: 'error',
        duration: Date.now() - startTime,
        stats,
        setup: setupResult,
        tests: [],
        suites: []
      };
    }
  }
  
  // Resolve test files
  const testFiles = await resolveTestFiles(suiteDef.tests, baseDir);
  
  // Check for fail-fast and parallel settings
  const failFast = suiteDef.execution?.fail_fast ?? false;
  const parallelTests = suiteDef.execution?.parallel_tests ?? false;
  const concurrency = suiteDef.execution?.concurrency ?? 5;
  
  // Execute tests
  let shouldStop = false;
  
  if (parallelTests) {
    // Parallel execution with concurrency limit
    const results = await executeTestsInParallel(
      testFiles,
      suiteDef,
      context,
      baseDir,
      concurrency,
      failFast,
      options
    );
    testResults.push(...results);
  } else {
    // Sequential execution
    for (const testFile of testFiles) {
      if (shouldStop) {
        testResults.push({
          name: path.basename(testFile),
          file: testFile,
          status: 'skipped',
          duration: 0,
          error: 'Skipped due to fail-fast'
        });
        stats.skipped++;
        stats.total++;
        continue;
      }
      
      onTestStart?.(testFile);
      
      const result = await executeTestFile(testFile, suiteDef, context, baseDir, options);
      testResults.push(result);
      
      stats.total++;
      switch (result.status) {
        case 'passed':
          stats.passed++;
          break;
        case 'failed':
          stats.failed++;
          if (failFast) shouldStop = true;
          break;
        case 'error':
          stats.error++;
          if (failFast) shouldStop = true;
          break;
        case 'skipped':
          stats.skipped++;
          break;
      }
      
      onTestComplete?.(testFile, result);
    }
  }
  
  // Execute nested suites
  if (suiteDef.suites && !shouldStop) {
    const parallelSuites = suiteDef.execution?.parallel_suites ?? false;
    
    for (const suiteRef of suiteDef.suites) {
      if (suiteRef.skip) continue;
      if (shouldStop && failFast) break;
      
      const nestedSuitePath = path.resolve(baseDir, suiteRef.file);
      const nestedResult = await executeSuite(nestedSuitePath, {
        ...options,
        params: { ...context.variables, ...context.extractedVars },
        extracted: context.extractedVars,
        cwd: path.dirname(nestedSuitePath)
      });
      
      nestedSuiteResults.push(nestedResult);
      
      // Aggregate stats
      stats.total += nestedResult.stats.total;
      stats.passed += nestedResult.stats.passed;
      stats.failed += nestedResult.stats.failed;
      stats.skipped += nestedResult.stats.skipped;
      stats.error += nestedResult.stats.error;
      
      if (nestedResult.status === 'failed' || nestedResult.status === 'error') {
        if (failFast) shouldStop = true;
      }
    }
  }
  
  // Execute suite teardown
  if (suiteDef.lifecycle?.teardown) {
    teardownResult = await executeSuiteLifecycleActions(suiteDef.lifecycle.teardown, context, silent);
  }
  
  // Determine overall status
  let status: SuiteResult['status'] = 'passed';
  if (stats.error > 0) {
    status = 'error';
  } else if (stats.failed > 0) {
    status = 'failed';
  } else if (stats.total === stats.skipped) {
    status = 'skipped';
  }
  
  const result: SuiteResult = {
    name: suiteDef.name,
    status,
    duration: Date.now() - startTime,
    stats,
    setup: setupResult,
    teardown: teardownResult,
    tests: testResults,
    suites: nestedSuiteResults.length > 0 ? nestedSuiteResults : undefined
  };
  
  onSuiteComplete?.(suiteDef.name, result);
  
  return result;
}

/**
 * Execute a single test file within a suite context
 */
async function executeTestFile(
  testFile: string,
  suiteDef: SuiteDefinition,
  context: SuiteLifecycleContext,
  baseDir: string,
  options: SuiteRunnerOptions
): Promise<SuiteTestResult> {
  const startTime = Date.now();
  const allAssertions: Array<{type: string; passed: boolean; message?: string; expected?: unknown; actual?: unknown}> = [];
  
  try {
    // Execute before_each hooks
    if (suiteDef.before_each) {
      const beforeResult = await executeSuiteLifecycleActions(suiteDef.before_each, context, options.silent);
      if (beforeResult.status === 'failed') {
        return {
          name: path.basename(testFile),
          file: testFile,
          status: 'error',
          duration: Date.now() - startTime,
          error: `before_each failed: ${beforeResult.error}`
        };
      }
    }
    
    // Parse and execute test cases
    const testCases = parseTestCases(testFile, {
      params: { ...context.variables, ...context.extractedVars },
      env: options.env,
      extracted: context.extractedVars
    });
    
    // Execute each test case
    for (const testCase of testCases) {
      // Apply suite environment
      if (suiteDef.environment && testCase.request && 'method' in testCase.request) {
        const httpRequest = testCase.request as { _baseUrl?: string };
        if (!httpRequest._baseUrl && context.environment) {
          const scheme = context.environment.scheme || 'http';
          const host = context.environment.host || 'localhost';
          const port = context.environment.port;
          let baseUrl = `${scheme}://${host}`;
          if (port && port !== '443' && port !== '80' && port !== 443 && port !== 80) {
            baseUrl += `:${port}`;
          }
          httpRequest._baseUrl = baseUrl;
        }
      }
      
      const result = await executeTestCase(testCase, {});
      
      // Collect assertions from ALL test cases
      if (result.assertions) {
        allAssertions.push(...result.assertions.map(a => ({
          type: a.type,
          passed: a.passed,
          message: a.message,
          expected: a.expected,
          actual: a.actual
        })));
      }
      
      // Merge extracted variables
      if (result.extracted) {
        Object.assign(context.extractedVars, result.extracted);
      }
      
      // Execute after_each hooks
      if (suiteDef.after_each) {
        context.response = result.response;
        await executeSuiteLifecycleActions(suiteDef.after_each, context, options.silent);
      }
      
      if (!result.passed) {
        return {
          name: testCase.description || path.basename(testFile),
          file: testFile,
          status: 'failed',
          duration: Date.now() - startTime,
          error: result.assertions?.find(a => !a.passed)?.message || 'Assertion failed',
          assertions: allAssertions
        };
      }
    }
    
    return {
      name: testCases[0]?.description || path.basename(testFile),
      file: testFile,
      status: 'passed',
      duration: Date.now() - startTime,
      assertions: allAssertions
    };
    
  } catch (error) {
    return {
      name: path.basename(testFile),
      file: testFile,
      status: 'error',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Execute tests in parallel with concurrency limit
 */
async function executeTestsInParallel(
  testFiles: string[],
  suiteDef: SuiteDefinition,
  context: SuiteLifecycleContext,
  baseDir: string,
  concurrency: number,
  failFast: boolean,
  options: SuiteRunnerOptions
): Promise<SuiteTestResult[]> {
  const results: SuiteTestResult[] = [];
  const queue = [...testFiles];
  let shouldStop = false;
  
  const workers: Promise<void>[] = [];
  
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push((async () => {
      while (queue.length > 0 && !shouldStop) {
        const testFile = queue.shift();
        if (!testFile) break;
        
        options.onTestStart?.(testFile);
        
        // Create isolated context for parallel execution
        const testContext = createSuiteLifecycleContext(
          { ...context.variables },
          context.environment
        );
        Object.assign(testContext.extractedVars, context.extractedVars);
        
        const result = await executeTestFile(testFile, suiteDef, testContext, baseDir, options);
        results.push(result);
        
        options.onTestComplete?.(testFile, result);
        
        if (failFast && (result.status === 'failed' || result.status === 'error')) {
          shouldStop = true;
        }
      }
    })());
  }
  
  await Promise.all(workers);
  
  return results;
}
