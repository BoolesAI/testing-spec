import { Command } from 'commander';
import ora from 'ora';
import { parseTestCases, clearTemplateCache } from '@boolesai/tspec';
import { discoverTSpecFiles } from '../utils/files.js';
import { formatParsedTestCase, formatJson } from '../utils/formatter.js';
import { logger, setLoggerOptions } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface ParseOptions {
  output?: OutputFormat;
  verbose?: boolean;
  quiet?: boolean;
}

export interface ParseParams {
  files: string[];
  output?: OutputFormat;
  verbose?: boolean;
  env?: Record<string, string>;
  params?: Record<string, string>;
}

export interface ParseExecutionResult {
  success: boolean;
  output: string;
  data: {
    testCases: unknown[];
    parseErrors: Array<{ file: string; error: string }>;
    summary: { totalFiles: number; totalTestCases: number; parseErrors: number };
  };
}

function parseKeyValue(value: string, previous: Record<string, string> = {}): Record<string, string> {
  const [key, val] = value.split('=');
  if (key && val !== undefined) {
    previous[key] = val;
  }
  return previous;
}

/**
 * Parse test cases - core logic extracted for MCP integration
 */
export async function executeParse(params: ParseParams): Promise<ParseExecutionResult> {
  clearTemplateCache();
  
  const output = params.output ?? 'text';
  const verbose = params.verbose ?? false;
  const env = params.env ?? {};
  const paramValues = params.params ?? {};
  
  // Discover files
  const { files: fileDescriptors } = await discoverTSpecFiles(params.files);
  
  if (fileDescriptors.length === 0) {
    return {
      success: false,
      output: 'No .tcase files found',
      data: {
        testCases: [],
        parseErrors: [],
        summary: { totalFiles: 0, totalTestCases: 0, parseErrors: 0 }
      }
    };
  }
  
  const allTestCases: unknown[] = [];
  const parseErrors: Array<{ file: string; error: string }> = [];
  
  // Parse each file
  for (const descriptor of fileDescriptors) {
    try {
      const testCases = parseTestCases(descriptor.path, { env, params: paramValues });
      allTestCases.push(...testCases);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      parseErrors.push({ file: descriptor.path, error: message });
    }
  }
  
  const summary = {
    totalFiles: fileDescriptors.length,
    totalTestCases: allTestCases.length,
    parseErrors: parseErrors.length
  };
  
  // Generate output
  let outputStr: string;
  if (output === 'json') {
    outputStr = formatJson({ testCases: allTestCases, errors: parseErrors, summary });
  } else {
    const parts: string[] = [];
    parts.push(`Parsed ${allTestCases.length} test case(s) from ${fileDescriptors.length} file(s)`);
    parts.push('');
    for (const testCase of allTestCases) {
      parts.push(formatParsedTestCase(testCase, { format: output, verbose }));
      parts.push('');
    }
    if (parseErrors.length > 0) {
      parts.push(`${parseErrors.length} file(s) failed to parse:`);
      parseErrors.forEach(({ file, error }) => parts.push(`  ${file}: ${error}`));
    }
    outputStr = parts.join('\n');
  }
  
  return {
    success: parseErrors.length === 0,
    output: outputStr,
    data: { testCases: allTestCases, parseErrors, summary }
  };
}

export const parseCommand = new Command('parse')
  .description('Parse and display test case information without execution')
  .argument('<files...>', 'Files or glob patterns to parse')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .option('-v, --verbose', 'Show detailed information')
  .option('-q, --quiet', 'Minimal output')
  .option('-e, --env <key=value>', 'Environment variables', parseKeyValue, {})
  .option('-p, --params <key=value>', 'Parameters', parseKeyValue, {})
  .action(async (files: string[], options: ParseOptions & { env: Record<string, string>; params: Record<string, string> }) => {
    setLoggerOptions({ verbose: options.verbose, quiet: options.quiet });
    
    const spinner = options.quiet ? null : ora('Parsing...').start();
    
    try {
      const result = await executeParse({
        files,
        output: options.output,
        verbose: options.verbose,
        env: options.env,
        params: options.params
      });
      
      spinner?.stop();
      logger.log(result.output);
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      spinner?.fail('Parse failed');
      const message = err instanceof Error ? err.message : String(err);
      logger.error(message);
      process.exit(2);
    }
  });
