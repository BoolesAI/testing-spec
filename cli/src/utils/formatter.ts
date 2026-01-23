import chalk from 'chalk';
import type { ValidationResult } from '@boolesai/tspec';

export type OutputFormat = 'json' | 'text' | 'table';

export interface FormatOptions {
  format?: OutputFormat;
  verbose?: boolean;
  quiet?: boolean;
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function formatValidationResult(result: ValidationResult, filePath: string): string {
  if (result.valid) {
    return chalk.green(`✓ ${filePath}`);
  }
  const errors = result.errors.map(e => chalk.red(`  - ${e}`)).join('\n');
  return `${chalk.red(`✗ ${filePath}`)}\n${errors}`;
}

export function formatValidationResults(
  results: Array<{ file: string; result: ValidationResult }>,
  options: FormatOptions = {}
): string {
  const { format = 'text' } = options;

  if (format === 'json') {
    return formatJson(results.map(r => ({
      file: r.file,
      valid: r.result.valid,
      errors: r.result.errors
    })));
  }

  const lines = results.map(r => formatValidationResult(r.result, r.file));
  const passed = results.filter(r => r.result.valid).length;
  const failed = results.length - passed;

  lines.push('');
  lines.push(chalk.bold(`Validation Summary: ${passed} passed, ${failed} failed`));

  return lines.join('\n');
}

export interface TestResultSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  duration: number;
}

export interface FormattedTestResult {
  testCaseId: string;
  passed: boolean;
  duration: number;
  assertions: Array<{
    passed: boolean;
    type: string;
    message: string;
  }>;
}

export function formatTestResult(result: FormattedTestResult, verbose = false): string {
  const status = result.passed
    ? chalk.green('✓ PASS')
    : chalk.red('✗ FAIL');
  
  const duration = chalk.gray(`(${result.duration}ms)`);
  let output = `${status} ${result.testCaseId} ${duration}`;

  if (verbose || !result.passed) {
    const assertionLines = result.assertions
      .filter(a => verbose || !a.passed)
      .map(a => {
        const icon = a.passed ? chalk.green('  ✓') : chalk.red('  ✗');
        return `${icon} [${a.type}] ${a.message}`;
      });
    if (assertionLines.length > 0) {
      output += '\n' + assertionLines.join('\n');
    }
  }

  return output;
}

export function formatTestSummary(summary: TestResultSummary): string {
  const passRate = summary.passRate.toFixed(1);
  const statusColor = summary.failed === 0 ? chalk.green : chalk.red;
  
  return [
    '',
    chalk.bold('─'.repeat(50)),
    chalk.bold('Test Summary'),
    `  Total:    ${summary.total}`,
    `  ${chalk.green('Passed:')}  ${summary.passed}`,
    `  ${chalk.red('Failed:')}  ${summary.failed}`,
    `  Pass Rate: ${statusColor(passRate + '%')}`,
    `  Duration:  ${summary.duration}ms`,
    chalk.bold('─'.repeat(50))
  ].join('\n');
}

export function formatTestResults(
  results: FormattedTestResult[],
  summary: TestResultSummary,
  options: FormatOptions = {}
): string {
  const { format = 'text', verbose = false } = options;

  if (format === 'json') {
    return formatJson({ results, summary });
  }

  const lines = results.map(r => formatTestResult(r, verbose));
  lines.push(formatTestSummary(summary));

  return lines.join('\n');
}

export function formatProtocolList(protocols: string[], options: FormatOptions = {}): string {
  const { format = 'text' } = options;

  if (format === 'json') {
    return formatJson({ protocols });
  }

  return [
    chalk.bold('Supported Protocols:'),
    ...protocols.map(p => `  - ${p}`)
  ].join('\n');
}

export function formatParsedTestCase(testCase: unknown, options: FormatOptions = {}): string {
  const { format = 'text' } = options;

  if (format === 'json') {
    return formatJson(testCase);
  }

  // For text format, show a simplified view
  const tc = testCase as Record<string, unknown>;
  const lines: string[] = [];
  
  lines.push(chalk.bold(`Test Case: ${tc.id || 'unknown'}`));
  if (tc.description) lines.push(`  Description: ${tc.description}`);
  if (tc.type) lines.push(`  Protocol: ${tc.type}`);
  
  return lines.join('\n');
}
