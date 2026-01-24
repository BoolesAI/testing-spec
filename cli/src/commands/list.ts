import { Command } from 'commander';
import { registry } from '@boolesai/tspec';
import { formatProtocolList } from '../utils/formatter.js';
import { logger } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface ListOptions {
  output?: OutputFormat;
}

export interface ListParams {
  output?: OutputFormat;
}

export interface ListExecutionResult {
  success: boolean;
  output: string;
  data: {
    protocols: string[];
  };
}

/**
 * List protocols - core logic extracted for MCP integration
 */
export async function executeList(params: ListParams): Promise<ListExecutionResult> {
  const output = params.output ?? 'text';
  const protocols = registry.getRegisteredTypes();
  const outputStr = formatProtocolList(protocols, { format: output });
  
  return {
    success: true,
    output: outputStr,
    data: { protocols }
  };
}

export const listCommand = new Command('list')
  .description('List supported protocols and configuration')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .action(async (options: ListOptions) => {
    try {
      const result = await executeList({ output: options.output });
      logger.log(result.output);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to list protocols: ${message}`);
      process.exit(2);
    }
  });
