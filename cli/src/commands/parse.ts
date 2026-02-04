import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { 
  parseTestCases, 
  clearTemplateCache,
  ProxyClient,
  loadConfig,
  isProxyEnabled,
  getProxyConfig,
  readTestFiles,
  type ProxyParseError
} from '@boolesai/tspec';
import { findConfigFile } from '@boolesai/tspec/plugin';
import { discoverTSpecFiles } from '../utils/files.js';
import { formatParsedTestCase, formatJson } from '../utils/formatter.js';
import { logger, setLoggerOptions } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface ParseOptions {
  output?: OutputFormat;
  verbose?: boolean;
  quiet?: boolean;
  noProxy?: boolean;
  proxyUrl?: string;
  config?: string;
}

export interface ParseParams {
  files: string[];
  output?: OutputFormat;
  verbose?: boolean;
  env?: Record<string, string>;
  params?: Record<string, string>;
  noProxy?: boolean;
  proxyUrl?: string;
  config?: string;
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
 * Parse test cases via proxy server
 */
async function executeParseViaProxy(
  params: ParseParams,
  proxyConfig: { url: string; timeout?: number; headers?: Record<string, string> }
): Promise<ParseExecutionResult> {
  const output = params.output ?? 'text';
  const verbose = params.verbose ?? false;
  
  // Discover files first
  const { files: fileDescriptors } = await discoverTSpecFiles(params.files);
  const allFiles = fileDescriptors.map(f => f.path);
  
  if (allFiles.length === 0) {
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
  
  // Read file contents
  const fileResult = readTestFiles(allFiles);
  
  if (fileResult.errors.length > 0 && Object.keys(fileResult.fileContents).length === 0) {
    return {
      success: false,
      output: `Failed to read test files: ${fileResult.errors.map(e => e.error).join(', ')}`,
      data: {
        testCases: [],
        parseErrors: fileResult.errors.map(e => ({ file: e.file, error: e.error })),
        summary: { totalFiles: 0, totalTestCases: 0, parseErrors: fileResult.errors.length }
      }
    };
  }
  
  // Create proxy client and execute
  const client = new ProxyClient({
    url: proxyConfig.url,
    timeout: proxyConfig.timeout,
    headers: proxyConfig.headers
  });
  
  const result = await client.executeParse(
    allFiles,
    fileResult.fileContents,
    { env: params.env, params: params.params }
  );
  
  if (!result.success || !result.data) {
    const errorMsg = result.error 
      ? `${result.error.code}: ${result.error.message}${result.error.details ? ` (${result.error.details})` : ''}`
      : 'Unknown proxy error';
    
    return {
      success: false,
      output: output === 'json' 
        ? formatJson({ error: errorMsg, testCases: [], errors: [], summary: { totalFiles: 0, totalTestCases: 0, parseErrors: 0 } })
        : `Proxy error: ${errorMsg}`,
      data: {
        testCases: [],
        parseErrors: [],
        summary: { totalFiles: 0, totalTestCases: 0, parseErrors: 0 }
      }
    };
  }
  
  // Transform proxy response to local format
  const proxyResponse = result.data;
  const testCases = proxyResponse.testCases || [];
  const parseErrors = (proxyResponse.parseErrors || []).map(e => ({
    file: e.file,
    error: e.message
  }));
  const summary = proxyResponse.summary || {
    totalFiles: allFiles.length,
    totalTestCases: testCases.length,
    parseErrors: parseErrors.length
  };
  
  // Generate output
  let outputStr: string;
  if (output === 'json') {
    outputStr = formatJson({ testCases, errors: parseErrors, summary });
  } else {
    const parts: string[] = [];
    parts.push(chalk.cyan(`[Proxy: ${proxyConfig.url}]`));
    parts.push(`Parsed ${testCases.length} test case(s) from ${summary.totalFiles} file(s)`);
    parts.push('');
    for (const testCase of testCases) {
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
    data: { testCases, parseErrors, summary }
  };
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
  
  // Check for proxy configuration
  if (!params.noProxy) {
    const configPath = params.config || findConfigFile() || undefined;
    const config = await loadConfig(configPath);
    const proxyUrl = params.proxyUrl;
    
    // Use CLI-provided proxy URL or check config
    if (proxyUrl || isProxyEnabled(config, 'parse')) {
      const proxyConfig = proxyUrl 
        ? { url: proxyUrl, timeout: 30000, headers: {}, enabled: true, operations: ['run' as const, 'validate' as const, 'parse' as const] }
        : getProxyConfig(config);
      
      if (proxyConfig) {
        return executeParseViaProxy(params, proxyConfig);
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
  .option('--config <path>', 'Path to tspec.config.json')
  .option('--no-proxy', 'Disable proxy for this execution')
  .option('--proxy-url <url>', 'Override proxy URL for this execution')
  .action(async (files: string[], options: ParseOptions & { env: Record<string, string>; params: Record<string, string> }) => {
    setLoggerOptions({ verbose: options.verbose, quiet: options.quiet });
    
    const spinner = options.quiet ? null : ora('Parsing...').start();
    
    try {
      const result = await executeParse({
        files,
        output: options.output,
        verbose: options.verbose,
        env: options.env,
        params: options.params,
        noProxy: options.noProxy,
        proxyUrl: options.proxyUrl,
        config: options.config
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
