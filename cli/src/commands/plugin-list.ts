import { Command } from 'commander';
import chalk from 'chalk';
import { PluginManager, version } from '@boolesai/tspec';
import { findConfigFile } from '@boolesai/tspec/plugin';
import { logger } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface PluginListOptions {
  output?: OutputFormat;
  verbose?: boolean;
  health?: boolean;
  config?: string;
}

export interface PluginListParams {
  output?: OutputFormat;
  verbose?: boolean;
  health?: boolean;
  config?: string;
}

export interface PluginListResult {
  success: boolean;
  output: string;
  data: {
    plugins: Array<{
      name: string;
      version: string;
      description?: string;
      protocols: string[];
      author?: string;
      homepage?: string;
    }>;
    protocols: string[];
    configPath?: string;
    health?: Array<{
      plugin: string;
      healthy: boolean;
      message?: string;
    }>;
  };
}

/**
 * List plugins - core logic for CLI and MCP integration
 */
export async function executePluginList(params: PluginListParams): Promise<PluginListResult> {
  const output = params.output ?? 'text';
  const pluginManager = new PluginManager(version);
  
  // Find and load config
  const configPath = params.config || findConfigFile();
  
  let loadSummary;
  if (configPath) {
    loadSummary = await pluginManager.initialize(configPath);
  }
  
  const plugins = pluginManager.list();
  const protocols = pluginManager.listProtocols();
  
  let healthReports;
  if (params.health) {
    healthReports = await pluginManager.healthCheck();
  }
  
  const data: PluginListResult['data'] = {
    plugins: plugins.map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
      protocols: p.protocols,
      author: p.author,
      homepage: p.homepage
    })),
    protocols,
    configPath: configPath || undefined,
    health: healthReports
  };
  
  let outputStr: string;
  
  if (output === 'json') {
    outputStr = JSON.stringify(data, null, 2);
  } else {
    outputStr = formatPluginListText(data, params.verbose ?? false, loadSummary);
  }
  
  return {
    success: true,
    output: outputStr,
    data
  };
}

function formatPluginListText(
  data: PluginListResult['data'], 
  verbose: boolean,
  loadSummary?: { total: number; loaded: number; failed: number; errors: Array<{ plugin: string; error: string }> }
): string {
  const lines: string[] = [];
  
  lines.push(chalk.bold('\nTSpec Plugins\n'));
  
  if (data.configPath) {
    lines.push(chalk.gray(`Config: ${data.configPath}`));
  } else {
    lines.push(chalk.gray('Config: No tspec.config.js found'));
  }
  
  if (loadSummary) {
    lines.push(chalk.gray(`Discovered: ${loadSummary.total}, Loaded: ${loadSummary.loaded}`));
    if (loadSummary.failed > 0) {
      lines.push(chalk.red(`Failed: ${loadSummary.failed}`));
      for (const error of loadSummary.errors) {
        lines.push(chalk.red(`  ${error.plugin}: ${error.error}`));
      }
    }
  }
  
  lines.push('');
  
  if (data.plugins.length === 0) {
    lines.push(chalk.yellow('No plugins loaded.'));
    lines.push(chalk.gray('Add plugins to your tspec.config.js:'));
    lines.push(chalk.gray('  module.exports = {'));
    lines.push(chalk.gray('    plugins: ["@tspec/http", "@tspec/web"]'));
    lines.push(chalk.gray('  };'));
  } else {
    for (const plugin of data.plugins) {
      lines.push(`${chalk.cyan(plugin.name)} ${chalk.gray(`v${plugin.version}`)}`);
      
      if (verbose && plugin.description) {
        lines.push(`  ${plugin.description}`);
      }
      
      lines.push(`  Protocols: ${plugin.protocols.join(', ')}`);
      
      if (verbose) {
        if (plugin.author) {
          lines.push(`  Author: ${plugin.author}`);
        }
        if (plugin.homepage) {
          lines.push(`  Homepage: ${plugin.homepage}`);
        }
      }
      
      lines.push('');
    }
  }
  
  if (data.health) {
    lines.push(chalk.bold('Health Check\n'));
    
    for (const report of data.health) {
      const status = report.healthy 
        ? chalk.green('✓ Healthy') 
        : chalk.red('✗ Unhealthy');
      
      lines.push(`${chalk.cyan(report.plugin)}: ${status}`);
      
      if (report.message) {
        lines.push(`  ${report.message}`);
      }
    }
    
    lines.push('');
  }
  
  if (data.protocols.length > 0) {
    lines.push(chalk.bold('Supported Protocols: ') + data.protocols.join(', '));
  }
  
  return lines.join('\n');
}

export const pluginListCommand = new Command('plugin:list')
  .alias('plugins')
  .description('List all installed TSpec plugins')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .option('-v, --verbose', 'Show detailed plugin information')
  .option('--health', 'Run health checks on all plugins')
  .option('-c, --config <path>', 'Path to tspec.config.js')
  .action(async (options: PluginListOptions) => {
    try {
      const result = await executePluginList({
        output: options.output as OutputFormat,
        verbose: options.verbose,
        health: options.health,
        config: options.config
      });
      
      logger.log(result.output);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to list plugins: ${message}`);
      process.exit(2);
    }
  });
