import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { parseTestCases, scheduler, clearTemplateCache } from '@boolesai/tspec';
import type { TestCase, TestResult, ScheduleResult } from '@boolesai/tspec';
import { discoverTSpecFiles, type TSpecFileDescriptor } from '../utils/files.js';
import { formatTestResults, formatJson, type FormattedTestResult, type TestResultSummary } from '../utils/formatter.js';
import { logger, setLoggerOptions } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface RunOptions {
  output?: OutputFormat;
  concurrency?: string;
  verbose?: boolean;
  quiet?: boolean;
  failFast?: boolean;
  env: Record<string, string>;
  params: Record<string, string>;
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
    assertions: result.assertions.map(a => ({
      passed: a.passed,
      type: a.type,
      message: a.message
    }))
  };
}

async function runFileTestCases(
  descriptor: TSpecFileDescriptor,
  options: RunOptions,
  concurrency: number,
  spinner: ReturnType<typeof ora> | null
): Promise<FileRunResult> {
  const result: FileRunResult = {
    file: descriptor.path,
    testCases: 0,
    results: []
  };

  // Parse file on-demand
  let testCases: TestCase[];
  try {
    testCases = parseTestCases(descriptor.path, {
      env: options.env,
      params: options.params
    });
    result.testCases = testCases.length;
  } catch (err) {
    result.parseError = err instanceof Error ? err.message : String(err);
    return result;
  }

  if (testCases.length === 0) {
    return result;
  }

  // Execute test cases for this file
  if (spinner) spinner.text = `Running: ${descriptor.relativePath} (${testCases.length} test(s))...`;

  if (options.failFast) {
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
  .action(async (files: string[], options: RunOptions) => {
    setLoggerOptions({ verbose: options.verbose, quiet: options.quiet });
    
    // Clear template cache to ensure fresh reads for this run
    clearTemplateCache();
    
    const concurrency = parseInt(options.concurrency || '5', 10);
    const spinner = options.quiet ? null : ora('Discovering files...').start();
    
    try {
      // Discover files without loading content
      const { files: fileDescriptors, errors: resolveErrors } = await discoverTSpecFiles(files);
      
      if (resolveErrors.length > 0 && !options.quiet) {
        resolveErrors.forEach(err => logger.warn(err));
      }
      
      if (fileDescriptors.length === 0) {
        spinner?.fail('No .tspec files found');
        process.exit(2);
      }
      
      if (spinner) spinner.text = `Running ${fileDescriptors.length} file(s)...`;
      
      // Parse and execute one file at a time (lazy loading)
      const allResults: TestResult[] = [];
      const parseErrors: Array<{ file: string; error: string }> = [];
      let totalTestCases = 0;
      let stopped = false;
      
      for (const descriptor of fileDescriptors) {
        if (stopped) break;
        
        const fileResult = await runFileTestCases(descriptor, options, concurrency, spinner);
        
        if (fileResult.parseError) {
          parseErrors.push({ file: fileResult.file, error: fileResult.parseError });
          continue;
        }
        
        totalTestCases += fileResult.testCases;
        allResults.push(...fileResult.results);
        
        // Check fail-fast across files
        if (options.failFast && fileResult.results.some(r => !r.passed)) {
          stopped = true;
        }
      }
      
      spinner?.stop();
      
      if (totalTestCases === 0 && parseErrors.length === fileDescriptors.length) {
        logger.error('No test cases found - all files failed to parse');
        parseErrors.forEach(({ file, error }) => logger.error(`  ${file}: ${error}`));
        process.exit(2);
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
      
      // Format and output results
      const formattedResults = allResults.map(formatResult);
      
      if (options.output === 'json') {
        logger.log(formatJson({
          results: formattedResults,
          summary,
          parseErrors
        }));
      } else {
        if (!options.quiet) {
          const output = formatTestResults(formattedResults, summary, {
            format: options.output,
            verbose: options.verbose
          });
          logger.log(output);
        } else {
          // Quiet mode: just show summary line
          const statusColor = summary.failed === 0 ? chalk.green : chalk.red;
          logger.log(statusColor(`${summary.passed}/${summary.total} tests passed (${summary.passRate.toFixed(1)}%)`));
        }
        
        if (parseErrors.length > 0) {
          logger.newline();
          logger.warn(`${parseErrors.length} file(s) failed to parse:`);
          for (const { file, error } of parseErrors) {
            logger.error(`  ${file}: ${error}`);
          }
        }
      }
      
      // Exit code: 0 if all passed, 1 if any failed
      process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
      spinner?.fail('Execution failed');
      const message = err instanceof Error ? err.message : String(err);
      logger.error(message);
      process.exit(2);
    }
  });
