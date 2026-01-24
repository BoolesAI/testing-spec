import { Command } from 'commander';
import { startMcpServer } from '../mcp/server.js';

export const mcpCommand = new Command('mcp')
  .description('Start MCP server for tool integration')
  .action(async () => {
    await startMcpServer();
  });
