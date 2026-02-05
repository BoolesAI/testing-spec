import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { 
  parseTestCases, 
  scheduler, 
  clearTemplateCache,
  executeSuite,
  isSuiteFile,
  getPluginManager,
  registry,
  version,
  type SuiteResult,
  type SuiteTestResult,
  ProxyClient,
  loadConfig,
  isProxyEnabled,
  getProxyConfig,
  readTestFiles,
  type ProxyTestResult,
  type ProxyAssertionResult,
  type ProxyParseError
} from '@boolesai/tspec';
import { findConfigFile } from '@boolesai/tspec/plugin';
import type { TestCase, TestResult } from '@boolesai/tspec';
import { discoverTSpecFiles, discoverAllTestFiles, type TSpecFileDescriptor, type TSuiteFileDescriptor } from '../utils/files.js';
import { formatTestResults, formatJson, type FormattedTestResult, type TestResultSummary } from '../utils/formatter.js';
import { logger, setLoggerOptions } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface RunOptions {
  output?: OutputFormat;
  concurrency?: string;
  verbose?: boolean;
  quiet?: boolean;
  failFast?: boolean;
  config?: string;
  noAutoInstall?: boolean;
  noProxy?: boolean;
  proxyUrl?: string;
  env: Record<string, string>;
  params: Record<string, string>;
}

export interface RunParams {
  files: string[];
  output?: OutputFormat;
  concurrency?: number;
  verbose?: boolean;
  quiet?: boolean;
  failFast?: boolean;
  config?: string;
  noAutoInstall?: boolean;
  noProxy?: boolean;
  proxyUrl?: string;
  env?: Record<string, string>;
  params?: Record<string, string>;
}

export interface RunExecutionResult {
  success: boolean;
  output: string;
  data: {
    results: FormattedTestResult[];
    summary: TestResultSummary;
    parseErrors: Array<{ file: string; error: string }>;
  };
}

interface FileRunResult {
  file: string;
  testCases: number;
  results: TestResult[];
  parseError?: string;
}

function parseKeyValue(value: string, previous: Record<string, string> = {}): Record<string, string> {
  const [key, val] = value.split('=');
  if (key && val !== undefined) {
    previous[key] = val;
  }
  return previous;
}

function formatResult(result: TestResult): FormattedTestResult {
  return {
    testCaseId: result.testCaseId,
    passed: result.passed,
    duration: result.duration,
    extracted: Object.keys(result.extracted).length > 0 ? result.extracted : undefined,
    assertions: result.assertions.map(a => ({
      passed: a.passed,
      type: a.type,
      message: a.message
    }))
  };
}

async function runFileTestCasesInternal(
  descriptor: TSpecFileDescriptor,
  env: Record<string, string>,
  params: Record<string, string>,
  concurrency: number,
  failFast: boolean,
  onProgress?: (text: string) => void
): Promise<FileRunResult> {
  const result: FileRunResult = {
    file: descriptor.path,
    testCases: 0,
    results: []
  };

  // Parse file on-demand
  let testCases: TestCase[];
  try {
    testCases = parseTestCases(descriptor.path, { env, params });
    result.testCases = testCases.length;
  } catch (err) {
    result.parseError = err instanceof Error ? err.message : String(err);
    return result;
  }

  if (testCases.length === 0) {
    return result;
  }

  // Execute test cases for this file
  onProgress?.(`Running: ${descriptor.relativePath} (${testCases.length} test(s))...`);

  if (failFast) {
    // For fail-fast, execute sequentially
    for (const testCase of testCases) {
      try {
        const scheduleResult = await scheduler.schedule([testCase], { concurrency: 1 });
        result.results.push(...scheduleResult.results);
        
        if (!scheduleResult.results[0]?.passed) {
          break; // Stop on first failure within file
        }
      } catch {
        break;
      }
    }
  } else {
    // Execute all test cases for this file with concurrency
    const scheduleResult = await scheduler.schedule(testCases, { concurrency });
    result.results = scheduleResult.results;
  }

  return result;
}

/**
 * Execute test cases - core logic extracted for MCP integration
 */
export async function executeRun(params: RunParams): Promise<RunExecutionResult> {
  clearTemplateCache();
  
  // Initialize plugin manager if config file exists
  const configPath = params.config || findConfigFile();
  
  // Check for proxy configuration
  if (!params.noProxy) {
    const config = await loadConfig(configPath || undefined);
    const proxyUrl = params.proxyUrl;
    
    // Use CLI-provided proxy URL or check config
    if (proxyUrl || isProxyEnabled(config, 'run')) {
      const proxyConfig = proxyUrl 
        ? { url: proxyUrl, timeout: 30000, headers: {}, enabled: true, operations: ['run' as const, 'validate' as const, 'parse' as const] }
        : getProxyConfig(config);
      
      if (proxyConfig) {
        return executeRunViaProxy(params, proxyConfig);
      }
    }
  }
  
  // Local execution
  if (configPath) {
    const pluginManager = getPluginManager(version);
    await pluginManager.initialize(configPath, { 
      skipAutoInstall: params.noAutoInstall 
    });
    registry.enablePluginManager();
  }
  if (configPath) {
    const pluginManager = getPluginManager(version);
    await pluginManager.initialize(configPath, { 
      skipAutoInstall: params.noAutoInstall 
    });
    registry.enablePluginManager();
  }
  
  const concurrency = params.concurrency ?? 5;
  const env = params.env ?? {};
  const paramValues = params.params ?? {};
  const failFast = params.failFast ?? false;
  const output = params.output ?? 'text';
  const verbose = params.verbose ?? false;
  const quiet = params.quiet ?? false;
  
  // Discover both .tcase and .tsuite files
  const { tspecFiles, suiteFiles, errors: resolveErrors } = await discoverAllTestFiles(params.files);
  
  if (tspecFiles.length === 0 && suiteFiles.length === 0) {
    return {
      success: false,
      output: 'No .tcase or .tsuite files found',
      data: {
        results: [],
        summary: { total: 0, passed: 0, failed: 0, passRate: 0, duration: 0 },
        parseErrors: []
      }
    };
  }
  
  // If there are suite files, execute them
  if (suiteFiles.length > 0) {
    return executeSuiteRun(suiteFiles, tspecFiles, { 
      env, 
      params: paramValues, 
      concurrency, 
      failFast, 
      output, 
      verbose, 
      quiet 
    });
  }
  
  // Otherwise, execute tspec files directly
  return executeTspecRun(tspecFiles, { 
    env, 
    params: paramValues, 
    concurrency, 
    failFast, 
    output, 
    verbose, 
    quiet 
  });
}

interface ExecuteOptions {
  env: Record<string, string>;
  params: Record<string, string>;
  concurrency: number;
  failFast: boolean;
  output: OutputFormat;
  verbose: boolean;
  quiet: boolean;
}

/**
 * Execute .tcase files directly (original behavior)
 */
async function executeTspecRun(
  fileDescriptors: TSpecFileDescriptor[],
  options: ExecuteOptions
): Promise<RunExecutionResult> {
  const { env, params: paramValues, concurrency, failFast, output, verbose, quiet } = options;
  
  // Parse and execute one file at a time
  const allResults: TestResult[] = [];
  const parseErrors: Array<{ file: string; error: string }> = [];
  let totalTestCases = 0;
  let stopped = false;
  
  for (const descriptor of fileDescriptors) {
    if (stopped) break;
    
    const fileResult = await runFileTestCasesInternal(
      descriptor, env, paramValues, concurrency, failFast
    );
    
    if (fileResult.parseError) {
      parseErrors.push({ file: fileResult.file, error: fileResult.parseError });
      continue;
    }
    
    totalTestCases += fileResult.testCases;
    allResults.push(...fileResult.results);
    
    if (failFast && fileResult.results.some(r => !r.passed)) {
      stopped = true;
    }
  }
  
  if (totalTestCases === 0 && parseErrors.length === fileDescriptors.length) {
    const errorOutput = ['No test cases found - all files failed to parse']
      .concat(parseErrors.map(({ file, error }) => `  ${file}: ${error}`))
      .join('\n');
    return {
      success: false,
      output: errorOutput,
      data: {
        results: [],
        summary: { total: 0, passed: 0, failed: 0, passRate: 0, duration: 0 },
        parseErrors
      }
    };
  }
  
  // Calculate summary
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.length - passed;
  const summary: TestResultSummary = {
    total: allResults.length,
    passed,
    failed,
    passRate: allResults.length > 0 ? (passed / allResults.length) * 100 : 0,
    duration: 0
  };
  
  const formattedResults = allResults.map(formatResult);
  
  // Generate output string
  let outputStr: string;
  if (output === 'json') {
    outputStr = formatJson({ results: formattedResults, summary, parseErrors });
  } else {
    const parts: string[] = [];
    if (!quiet) {
      parts.push(formatTestResults(formattedResults, summary, { format: output, verbose }));
    } else {
      parts.push(`${summary.passed}/${summary.total} tests passed (${summary.passRate.toFixed(1)}%)`);
    }
    if (parseErrors.length > 0) {
      parts.push(`\n${parseErrors.length} file(s) failed to parse:`);
      parseErrors.forEach(({ file, error }) => parts.push(`  ${file}: ${error}`));
    }
    outputStr = parts.join('\n');
  }
  
  return {
    success: failed === 0,
    output: outputStr,
    data: { results: formattedResults, summary, parseErrors }
  };
}

/**
 * Execute .tsuite files
 */
async function executeSuiteRun(
  suiteFiles: TSuiteFileDescriptor[],
  additionalTspecFiles: TSpecFileDescriptor[],
  options: ExecuteOptions
): Promise<RunExecutionResult> {
  const { env, params: paramValues, failFast, output, verbose, quiet } = options;
  const isJsonOutput = output === 'json';
  
  const allResults: FormattedTestResult[] = [];
  const parseErrors: Array<{ file: string; error: string }> = [];
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let stopped = false;
  
  // Execute suite files
  for (const suiteDescriptor of suiteFiles) {
    if (stopped) break;
    
    // Skip template files
    if (suiteDescriptor.isTemplate) continue;
    
    try {
      const suiteResult = await executeSuite(suiteDescriptor.path, {
        env,
        params: paramValues,
        silent: isJsonOutput,
        onSuiteStart: isJsonOutput ? undefined : (name) => {
          if (!quiet) logger.log(chalk.blue(`\nSuite: ${name}`));
        },
        onTestStart: isJsonOutput ? undefined : (file) => {
          if (verbose) logger.log(chalk.gray(`  Running: ${file}`));
        },
        onTestComplete: isJsonOutput ? undefined : (file, result) => {
          const statusIcon = result.status === 'passed' ? chalk.green('✓') : chalk.red('✗');
          if (!quiet) logger.log(`  ${statusIcon} ${result.name} (${result.duration}ms)`);
        }
      });
      
      // Aggregate results
      totalTests += suiteResult.stats.total;
      totalPassed += suiteResult.stats.passed;
      totalFailed += suiteResult.stats.failed + suiteResult.stats.error;
      
      // Convert suite test results to formatted results
      for (const testResult of suiteResult.tests) {
        allResults.push({
          testCaseId: testResult.name,
          passed: testResult.status === 'passed',
          duration: testResult.duration,
          assertions: (testResult.assertions || []).map(a => ({
            passed: a.passed,
            type: a.type,
            message: a.message || ''
          }))
        });
      }
      
      // Handle nested suites
      if (suiteResult.suites) {
        for (const nestedSuite of suiteResult.suites) {
          totalTests += nestedSuite.stats.total;
          totalPassed += nestedSuite.stats.passed;
          totalFailed += nestedSuite.stats.failed + nestedSuite.stats.error;
          
          for (const testResult of nestedSuite.tests) {
            allResults.push({
              testCaseId: `${nestedSuite.name}/${testResult.name}`,
              passed: testResult.status === 'passed',
              duration: testResult.duration,
              assertions: (testResult.assertions || []).map(a => ({
                passed: a.passed,
                type: a.type,
                message: a.message || ''
              }))
            });
          }
        }
      }
      
      if (failFast && (suiteResult.status === 'failed' || suiteResult.status === 'error')) {
        stopped = true;
      }
      
    } catch (err) {
      parseErrors.push({ 
        file: suiteDescriptor.path, 
        error: err instanceof Error ? err.message : String(err) 
      });
    }
  }
  
  // Also run any additional tspec files not in suites
  if (additionalTspecFiles.length > 0 && !stopped) {
    const tspecResult = await executeTspecRun(additionalTspecFiles, options);
    allResults.push(...tspecResult.data.results);
    parseErrors.push(...tspecResult.data.parseErrors);
    totalTests += tspecResult.data.summary.total;
    totalPassed += tspecResult.data.summary.passed;
    totalFailed += tspecResult.data.summary.failed;
  }
  
  // Calculate summary
  const summary: TestResultSummary = {
    total: totalTests,
    passed: totalPassed,
    failed: totalFailed,
    passRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
    duration: 0
  };
  
  // Generate output string
  let outputStr: string;
  if (output === 'json') {
    outputStr = formatJson({ results: allResults, summary, parseErrors });
  } else {
    const parts: string[] = [];
    if (!quiet) {
      parts.push('\n' + chalk.bold('Results:'));
      parts.push(formatTestResults(allResults, summary, { format: output, verbose }));
    } else {
      parts.push(`${summary.passed}/${summary.total} tests passed (${summary.passRate.toFixed(1)}%)`);
    }
    if (parseErrors.length > 0) {
      parts.push(`\n${parseErrors.length} file(s) failed to parse:`);
      parseErrors.forEach(({ file, error }) => parts.push(`  ${file}: ${error}`));
    }
    outputStr = parts.join('\n');
  }
  
  return {
    success: totalFailed === 0 && parseErrors.length === 0,
    output: outputStr,
    data: { results: allResults, summary, parseErrors }
  };
}

/**
 * Execute tests via proxy server
 */
async function executeRunViaProxy(
  params: RunParams,
  proxyConfig: { url: string; timeout?: number; headers?: Record<string, string> }
): Promise<RunExecutionResult> {
  const output = params.output ?? 'text';
  
  // Discover files first
  const { tspecFiles, suiteFiles } = await discoverAllTestFiles(params.files);
  const allFiles = [...tspecFiles.map(f => f.path), ...suiteFiles.map(f => f.path)];
  
  if (allFiles.length === 0) {
    return {
      success: false,
      output: 'No .tcase or .tsuite files found',
      data: {
        results: [],
        summary: { total: 0, passed: 0, failed: 0, passRate: 0, duration: 0 },
        parseErrors: []
      }
    };
  }
  
  // Read file contents
  const fileResult = readTestFiles(allFiles);
  
  if (fileResult.errors.length > 0 && Object.keys(fileResult.fileContents).length === 0) {
    return {
      success: false,
      output: `Failed to read test files: ${fileResult.errors.map(e => e.error).join(', ')}`,
      data: {
        results: [],
        summary: { total: 0, passed: 0, failed: 0, passRate: 0, duration: 0 },
        parseErrors: fileResult.errors.map(e => ({ file: e.file, error: e.error }))
      }
    };
  }
  
  // Create proxy client and execute
  const client = new ProxyClient({
    url: proxyConfig.url,
    timeout: proxyConfig.timeout,
    headers: proxyConfig.headers
  });
  
  const result = await client.executeRun(
    allFiles,
    fileResult.fileContents,
    {
      concurrency: params.concurrency,
      failFast: params.failFast,
      env: params.env,
      params: params.params
    }
  );
  
  if (!result.success || !result.data) {
    const errorMsg = result.error 
      ? `${result.error.code}: ${result.error.message}${result.error.details ? ` (${result.error.details})` : ''}`
      : 'Unknown proxy error';
    
    return {
      success: false,
      output: output === 'json' 
        ? formatJson({ error: errorMsg, results: [], summary: { total: 0, passed: 0, failed: 0, passRate: 0, duration: 0 }, parseErrors: [] })
        : `Proxy error: ${errorMsg}`,
      data: {
        results: [],
        summary: { total: 0, passed: 0, failed: 0, passRate: 0, duration: 0 },
        parseErrors: []
      }
    };
  }
  
  // Transform proxy response to local format
  const proxyResponse = result.data;
  const formattedResults: FormattedTestResult[] = (proxyResponse.results || []).map(r => ({
    testCaseId: r.testCaseId,
    passed: r.passed,
    duration: r.duration,
    assertions: (r.assertions || []).map(a => ({
      passed: a.passed,
      type: a.type,
      message: a.message || ''
    }))
  }));
  
  const summary: TestResultSummary = proxyResponse.summary 
    ? {
        total: proxyResponse.summary.total,
        passed: proxyResponse.summary.passed,
        failed: proxyResponse.summary.failed,
        passRate: proxyResponse.summary.passRate,
        duration: proxyResponse.summary.duration
      }
    : { total: 0, passed: 0, failed: 0, passRate: 0, duration: 0 };
  
  const parseErrors = (proxyResponse.parseErrors || []).map(e => ({
    file: e.file,
    error: e.message
  }));
  
  // Generate output
  let outputStr: string;
  if (output === 'json') {
    outputStr = formatJson({ results: formattedResults, summary, parseErrors });
  } else {
    const parts: string[] = [];
    parts.push(chalk.cyan(`[Proxy: ${proxyConfig.url}]`));
    parts.push(formatTestResults(formattedResults, summary, { format: output, verbose: params.verbose }));
    if (parseErrors.length > 0) {
      parts.push(`\n${parseErrors.length} file(s) failed to parse:`);
      parseErrors.forEach(({ file, error }) => parts.push(`  ${file}: ${error}`));
    }
    outputStr = parts.join('\n');
  }
  
  return {
    success: summary.failed === 0 && parseErrors.length === 0,
    output: outputStr,
    data: { results: formattedResults, summary, parseErrors }
  };
}

export const runCommand = new Command('run')
  .description('Execute test cases and report results')
  .argument('<files...>', 'Files or glob patterns to run')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .option('-c, --concurrency <number>', 'Max concurrent tests', '5')
  .option('-e, --env <key=value>', 'Environment variables', parseKeyValue, {})
  .option('-p, --params <key=value>', 'Parameters', parseKeyValue, {})
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Only output summary')
  .option('--fail-fast', 'Stop on first failure')
  .option('--config <path>', 'Path to tspec.config.json for plugin loading')
  .option('--no-auto-install', 'Skip automatic plugin installation')
  .option('--no-proxy', 'Disable proxy for this execution')
  .option('--proxy-url <url>', 'Override proxy URL for this execution')
  .action(async (files: string[], options: RunOptions) => {
    setLoggerOptions({ verbose: options.verbose, quiet: options.quiet });
    
    const spinner = (options.quiet || options.output === 'json') ? null : ora('Running tests...').start();
    
    try {
      const result = await executeRun({
        files,
        output: options.output,
        concurrency: parseInt(options.concurrency || '5', 10),
        verbose: options.verbose,
        quiet: options.quiet,
        failFast: options.failFast,
        config: options.config,
        noAutoInstall: options.noAutoInstall,
        noProxy: options.noProxy,
        proxyUrl: options.proxyUrl,
        env: options.env,
        params: options.params
      });
      
      spinner?.stop();
      
      if (options.output === 'text' && !options.quiet) {
        // Use chalk for colored output in CLI mode
        const summary = result.data.summary;
        if (summary.failed > 0) {
          logger.log(result.output);
        } else {
          logger.log(result.output);
        }
      } else if (options.quiet) {
        const summary = result.data.summary;
        const statusColor = summary.failed === 0 ? chalk.green : chalk.red;
        logger.log(statusColor(`${summary.passed}/${summary.total} tests passed (${summary.passRate.toFixed(1)}%)`));
      } else {
        logger.log(result.output);
      }
      
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      spinner?.stop();
      const message = err instanceof Error ? err.message : String(err);
      
      if (options.output === 'json') {
        // Output JSON error for programmatic consumers (VSCode extension, etc.)
        const errorOutput = formatJson({
          results: [],
          summary: { total: 0, passed: 0, failed: 0, passRate: 0, duration: 0 },
          parseErrors: [],
          error: message
        });
        logger.log(errorOutput);
      } else {
        spinner?.fail('Execution failed');
        logger.error(message);
      }
      process.exit(2);
    }
  });
