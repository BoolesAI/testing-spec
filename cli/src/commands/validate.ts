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

export const validateCommand = new Command('validate')
  .description('Validate .tspec files for schema correctness')
  .argument('<files...>', 'Files or glob patterns to validate')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .option('-q, --quiet', 'Only output errors')
  .action(async (files: string[], options: ValidateOptions) => {
    setLoggerOptions({ quiet: options.quiet });
    
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
      
      if (spinner) spinner.text = `Validating ${fileDescriptors.length} file(s)...`;
      
      // Validate each file individually (lazy loading - content read on-demand)
      const results = fileDescriptors.map(descriptor => ({
        file: descriptor.path,
        result: validateTestCase(descriptor.path)
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
