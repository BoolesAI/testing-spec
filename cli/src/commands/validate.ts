import { Command } from 'commander';
import ora from 'ora';
import { validateTestCase } from '@boolesai/tspec';
import { discoverTSpecFiles } from '../utils/files.js';
import { formatValidationResults } from '../utils/formatter.js';
import { logger, setLoggerOptions } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface ValidateOptions {
  output?: OutputFormat;
  quiet?: boolean;
}

export interface ValidateParams {
  files: string[];
  output?: OutputFormat;
}

export interface ValidateExecutionResult {
  success: boolean;
  output: string;
  data: {
    results: Array<{ file: string; valid: boolean; errors: string[] }>;
  };
}

/**
 * Validate test cases - core logic extracted for MCP integration
 */
export async function executeValidate(params: ValidateParams): Promise<ValidateExecutionResult> {
  const output = params.output ?? 'text';
  
  // Discover files
  const { files: fileDescriptors } = await discoverTSpecFiles(params.files);
  
  if (fileDescriptors.length === 0) {
    return {
      success: false,
      output: 'No .tspec files found',
      data: { results: [] }
    };
  }
  
  // Validate each file
  const results = fileDescriptors.map(descriptor => {
    const result = validateTestCase(descriptor.path);
    return {
      file: descriptor.path,
      valid: result.valid,
      errors: result.errors || []
    };
  });
  
  const outputStr = formatValidationResults(
    results.map(r => ({ file: r.file, result: { valid: r.valid, errors: r.errors } })),
    { format: output }
  );
  
  const hasErrors = results.some(r => !r.valid);
  
  return {
    success: !hasErrors,
    output: outputStr,
    data: { results }
  };
}

export const validateCommand = new Command('validate')
  .description('Validate .tspec files for schema correctness')
  .argument('<files...>', 'Files or glob patterns to validate')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .option('-q, --quiet', 'Only output errors')
  .action(async (files: string[], options: ValidateOptions) => {
    setLoggerOptions({ quiet: options.quiet });
    
    const spinner = options.quiet ? null : ora('Validating...').start();
    
    try {
      const result = await executeValidate({
        files,
        output: options.output
      });
      
      spinner?.stop();
      logger.log(result.output);
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      spinner?.fail('Validation failed');
      const message = err instanceof Error ? err.message : String(err);
      logger.error(message);
      process.exit(2);
    }
  });
