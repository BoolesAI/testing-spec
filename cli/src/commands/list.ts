import { Command } from 'commander';
import { registry } from '@boolesai/tspec';
import { formatProtocolList } from '../utils/formatter.js';
import { logger } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface ListOptions {
  output?: OutputFormat;
}

export const listCommand = new Command('list')
  .description('List supported protocols and configuration')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .action(async (options: ListOptions) => {
    try {
      const protocols = registry.getRegisteredTypes();
      const output = formatProtocolList(protocols, { format: options.output });
      logger.log(output);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to list protocols: ${message}`);
      process.exit(2);
    }
  });
