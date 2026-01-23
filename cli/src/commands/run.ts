import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { parseTestCases, scheduler } from '@boolesai/tspec';
import type { TestCase, TestResult, ScheduleResult } from '@boolesai/tspec';
import { resolveFiles, getTspecFiles } from '../utils/files.js';
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
    
    const concurrency = parseInt(options.concurrency || '5', 10);
    const spinner = options.quiet ? null : ora('Resolving files...').start();
    
    try {
      // Resolve files
      const { files: resolvedFiles, errors: resolveErrors } = await resolveFiles(files);
      const tspecFiles = getTspecFiles(resolvedFiles);
      
      if (resolveErrors.length > 0 && !options.quiet) {
        resolveErrors.forEach(err => logger.warn(err));
      }
      
      if (tspecFiles.length === 0) {
        spinner?.fail('No .tspec files found');
        process.exit(2);
      }
      
      // Parse test cases
      if (spinner) spinner.text = `Parsing ${tspecFiles.length} file(s)...`;
      
      const allTestCases: TestCase[] = [];
      const parseErrors: Array<{ file: string; error: string }> = [];
      
      for (const file of tspecFiles) {
        try {
          const testCases = parseTestCases(file, {
            env: options.env,
            params: options.params
          });
          allTestCases.push(...testCases);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          parseErrors.push({ file, error: message });
        }
      }
      
      if (allTestCases.length === 0) {
        spinner?.fail('No test cases found');
        if (parseErrors.length > 0) {
          parseErrors.forEach(({ file, error }) => logger.error(`  ${file}: ${error}`));
        }
        process.exit(2);
      }
      
      // Execute tests
      if (spinner) spinner.text = `Running ${allTestCases.length} test(s) with concurrency ${concurrency}...`;
      
      let scheduleResult: ScheduleResult;
      
      if (options.failFast) {
        // For fail-fast, execute sequentially and stop on first failure
        const results: TestResult[] = [];
        let stopped = false;
        
        for (const testCase of allTestCases) {
          if (stopped) break;
          
          if (spinner) spinner.text = `Running: ${testCase.id}...`;
          
          try {
            const result = await scheduler.schedule([testCase], { concurrency: 1 });
            results.push(...result.results);
            
            if (!result.results[0]?.passed) {
              stopped = true;
            }
          } catch (err) {
            stopped = true;
          }
        }
        
        const passed = results.filter(r => r.passed).length;
        const failed = results.length - passed;
        
        scheduleResult = {
          results,
          duration: 0,
          summary: {
            total: results.length,
            passed,
            failed,
            passRate: results.length > 0 ? (passed / results.length) * 100 : 0
          }
        };
      } else {
        scheduleResult = await scheduler.schedule(allTestCases, { concurrency });
      }
      
      spinner?.stop();
      
      // Format and output results
      const formattedResults = scheduleResult.results.map(formatResult);
      const summary: TestResultSummary = {
        ...scheduleResult.summary,
        duration: scheduleResult.duration
      };
      
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
      process.exit(scheduleResult.summary.failed > 0 ? 1 : 0);
    } catch (err) {
      spinner?.fail('Execution failed');
      const message = err instanceof Error ? err.message : String(err);
      logger.error(message);
      process.exit(2);
    }
  });
