import { Command } from 'commander';
import ora from 'ora';
import { validateTestCase } from '@boolesai/tspec';
import { resolveFiles, getTspecFiles } from '../utils/files.js';
import { formatValidationResults } from '../utils/formatter.js';
import { logger, setLoggerOptions } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface ValidateOptions {
  output?: OutputFormat;
  quiet?: boolean;
}

export const validateCommand = new Command('validate')
  .description('Validate .tspec files for schema correctness')
  .argument('<files...>', 'Files or glob patterns to validate')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .option('-q, --quiet', 'Only output errors')
  .action(async (files: string[], options: ValidateOptions) => {
    setLoggerOptions({ quiet: options.quiet });
    
    const spinner = options.quiet ? null : ora('Resolving files...').start();
    
    try {
      const { files: resolvedFiles, errors: resolveErrors } = await resolveFiles(files);
      const tspecFiles = getTspecFiles(resolvedFiles);
      
      if (resolveErrors.length > 0 && !options.quiet) {
        resolveErrors.forEach(err => logger.warn(err));
      }
      
      if (tspecFiles.length === 0) {
        spinner?.fail('No .tspec files found');
        process.exit(2);
      }
      
      if (spinner) spinner.text = `Validating ${tspecFiles.length} file(s)...`;
      
      const results = tspecFiles.map(file => ({
        file,
        result: validateTestCase(file)
      }));
      
      spinner?.stop();
      
      const output = formatValidationResults(results, { format: options.output });
      logger.log(output);
      
      const hasErrors = results.some(r => !r.result.valid);
      process.exit(hasErrors ? 1 : 0);
    } catch (err) {
      spinner?.fail('Validation failed');
      const message = err instanceof Error ? err.message : String(err);
      logger.error(message);
      process.exit(2);
    }
  });
