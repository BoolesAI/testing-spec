import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { validateCommand } from './commands/validate.js';
import { runCommand } from './commands/run.js';
import { parseCommand } from './commands/parse.js';
import { listCommand } from './commands/list.js';
import { mcpCommand } from './commands/mcp.js';
import { pluginListCommand } from './commands/plugin-list.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('tspec')
  .description('CLI for @boolesai/tspec testing framework')
  .version(packageJson.version);

program.addCommand(validateCommand);
program.addCommand(runCommand);
program.addCommand(parseCommand);
program.addCommand(listCommand);
program.addCommand(mcpCommand);
program.addCommand(pluginListCommand);

await program.parseAsync();
