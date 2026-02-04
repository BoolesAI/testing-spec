import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { 
  validateTestCase,
  ProxyClient,
  loadConfig,
  isProxyEnabled,
  getProxyConfig,
  readTestFiles,
  type ProxyValidationResult
} from '@boolesai/tspec';
import { findConfigFile } from '@boolesai/tspec/plugin';
import { discoverTSpecFiles } from '../utils/files.js';
import { formatValidationResults, formatJson } from '../utils/formatter.js';
import { logger, setLoggerOptions } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface ValidateOptions {
  output?: OutputFormat;
  quiet?: boolean;
  noProxy?: boolean;
  proxyUrl?: string;
  config?: string;
}

export interface ValidateParams {
  files: string[];
  output?: OutputFormat;
  noProxy?: boolean;
  proxyUrl?: string;
  config?: string;
}

export interface ValidateExecutionResult {
  success: boolean;
  output: string;
  data: {
    results: Array<{ file: string; valid: boolean; errors: string[] }>;
  };
}

/**
 * Validate test cases via proxy server
 */
async function executeValidateViaProxy(
  params: ValidateParams,
  proxyConfig: { url: string; timeout?: number; headers?: Record<string, string> }
): Promise<ValidateExecutionResult> {
  const output = params.output ?? 'text';
  
  // Discover files first
  const { files: fileDescriptors } = await discoverTSpecFiles(params.files);
  const allFiles = fileDescriptors.map(f => f.path);
  
  if (allFiles.length === 0) {
    return {
      success: false,
      output: 'No .tcase files found',
      data: { results: [] }
    };
  }
  
  // Read file contents
  const fileResult = readTestFiles(allFiles);
  
  if (fileResult.errors.length > 0 && Object.keys(fileResult.fileContents).length === 0) {
    return {
      success: false,
      output: `Failed to read test files: ${fileResult.errors.map(e => e.error).join(', ')}`,
      data: { results: [] }
    };
  }
  
  // Create proxy client and execute
  const client = new ProxyClient({
    url: proxyConfig.url,
    timeout: proxyConfig.timeout,
    headers: proxyConfig.headers
  });
  
  const result = await client.executeValidate(allFiles, fileResult.fileContents);
  
  if (!result.success || !result.data) {
    const errorMsg = result.error 
      ? `${result.error.code}: ${result.error.message}${result.error.details ? ` (${result.error.details})` : ''}`
      : 'Unknown proxy error';
    
    return {
      success: false,
      output: output === 'json' 
        ? formatJson({ error: errorMsg, results: [] })
        : `Proxy error: ${errorMsg}`,
      data: { results: [] }
    };
  }
  
  // Transform proxy response to local format
  const proxyResponse = result.data;
  const results = (proxyResponse.results || []).map(r => ({
    file: r.file,
    valid: r.valid,
    errors: r.errors
  }));
  
  const hasErrors = results.some(r => !r.valid);
  
  // Generate output
  let outputStr: string;
  if (output === 'json') {
    outputStr = formatJson({ results });
  } else {
    const parts: string[] = [];
    parts.push(chalk.cyan(`[Proxy: ${proxyConfig.url}]`));
    parts.push(formatValidationResults(
      results.map(r => ({ file: r.file, result: { valid: r.valid, errors: r.errors } })),
      { format: output }
    ));
    outputStr = parts.join('\n');
  }
  
  return {
    success: !hasErrors,
    output: outputStr,
    data: { results }
  };
}

/**
 * Validate test cases - core logic extracted for MCP integration
 */
export async function executeValidate(params: ValidateParams): Promise<ValidateExecutionResult> {
  const output = params.output ?? 'text';
  
  // Check for proxy configuration
  if (!params.noProxy) {
    const configPath = params.config || findConfigFile() || undefined;
    const config = await loadConfig(configPath);
    const proxyUrl = params.proxyUrl;
    
    // Use CLI-provided proxy URL or check config
    if (proxyUrl || isProxyEnabled(config, 'validate')) {
      const proxyConfig = proxyUrl 
        ? { url: proxyUrl, timeout: 30000, headers: {}, enabled: true, operations: ['run' as const, 'validate' as const, 'parse' as const] }
        : getProxyConfig(config);
      
      if (proxyConfig) {
        return executeValidateViaProxy(params, proxyConfig);
      }
    }
  }
  
  // Local execution
  // Discover files
  const { files: fileDescriptors } = await discoverTSpecFiles(params.files);
  
  if (fileDescriptors.length === 0) {
    return {
      success: false,
      output: 'No .tcase files found',
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
  .description('Validate .tcase files for schema correctness')
  .argument('<files...>', 'Files or glob patterns to validate')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .option('-q, --quiet', 'Only output errors')
  .option('--config <path>', 'Path to tspec.config.json')
  .option('--no-proxy', 'Disable proxy for this execution')
  .option('--proxy-url <url>', 'Override proxy URL for this execution')
  .action(async (files: string[], options: ValidateOptions) => {
    setLoggerOptions({ quiet: options.quiet });
    
    const spinner = options.quiet ? null : ora('Validating...').start();
    
    try {
      const result = await executeValidate({
        files,
        output: options.output,
        noProxy: options.noProxy,
        proxyUrl: options.proxyUrl,
        config: options.config
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
