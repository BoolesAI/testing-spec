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

function parseKeyValue(value: string, previous: Record<string, string> = {}): Record<string, string> {
  const [key, val] = value.split('=');
  if (key && val !== undefined) {
    previous[key] = val;
  }
  return previous;
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
    
    // Clear template cache to ensure fresh reads for this parse
    clearTemplateCache();
    
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
      
      if (spinner) spinner.text = `Parsing ${fileDescriptors.length} file(s)...`;
      
      const allTestCases: unknown[] = [];
      const parseErrors: Array<{ file: string; error: string }> = [];
      
      // Parse each file individually (lazy loading - content read on-demand)
      for (const descriptor of fileDescriptors) {
        try {
          const testCases = parseTestCases(descriptor.path, {
            env: options.env,
            params: options.params
          });
          allTestCases.push(...testCases);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          parseErrors.push({ file: descriptor.path, error: message });
        }
      }
      
      spinner?.stop();
      
      if (options.output === 'json') {
        logger.log(formatJson({
          testCases: allTestCases,
          errors: parseErrors,
          summary: {
            totalFiles: fileDescriptors.length,
            totalTestCases: allTestCases.length,
            parseErrors: parseErrors.length
          }
        }));
      } else {
        logger.info(`Parsed ${allTestCases.length} test case(s) from ${fileDescriptors.length} file(s)`);
        logger.newline();
        
        for (const testCase of allTestCases) {
          logger.log(formatParsedTestCase(testCase, { format: options.output, verbose: options.verbose }));
          logger.newline();
        }
        
        if (parseErrors.length > 0) {
          logger.newline();
          logger.warn(`${parseErrors.length} file(s) failed to parse:`);
          for (const { file, error } of parseErrors) {
            logger.error(`  ${file}: ${error}`);
          }
        }
      }
      
      process.exit(parseErrors.length > 0 ? 1 : 0);
    } catch (err) {
      spinner?.fail('Parse failed');
      const message = err instanceof Error ? err.message : String(err);
      logger.error(message);
      process.exit(2);
    }
  });
