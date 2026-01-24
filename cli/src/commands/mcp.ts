import { Command } from 'commander';
import { startMcpServer } from '../mcp/server.js';
import { setLoggerOptions } from '../utils/logger.js';

export const mcpCommand = new Command('mcp')
  .description('Start MCP server for tool integration')
  .action(async () => {
    setLoggerOptions({ quiet: true });
    await startMcpServer();
  });
