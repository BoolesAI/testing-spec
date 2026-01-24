import { Command } from 'commander';
import { validateCommand } from './commands/validate.js';
import { runCommand } from './commands/run.js';
import { parseCommand } from './commands/parse.js';
import { listCommand } from './commands/list.js';
import { mcpCommand } from './commands/mcp.js';

const program = new Command();

program
  .name('tspec')
  .description('CLI for @boolesai/tspec testing framework')
  .version('1.0.0');

program.addCommand(validateCommand);
program.addCommand(runCommand);
program.addCommand(parseCommand);
program.addCommand(listCommand);
program.addCommand(mcpCommand);

program.parse();
