import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { 
  installPlugin, 
  isPluginInstalled,
  GLOBAL_CONFIG_PATH,
  GLOBAL_CONFIG_DIR,
  findLocalConfigFile,
  type TSpecConfig
} from '@boolesai/tspec/plugin';
import { logger } from '../utils/logger.js';
import type { OutputFormat } from '../utils/formatter.js';

interface PluginInstallOptions {
  output?: OutputFormat;
  global?: boolean;
  config?: string;
}

export interface PluginInstallParams {
  pluginName: string;
  output?: OutputFormat;
  global?: boolean;
  config?: string;
}

export interface PluginInstallResult {
  success: boolean;
  output: string;
  data: {
    plugin: string;
    installed: boolean;
    configUpdated: boolean;
    configPath?: string;
    error?: string;
  };
}

/**
 * Load config from a JSON file
 */
function loadConfigFile(configPath: string): TSpecConfig {
  if (!existsSync(configPath)) {
    return { plugins: [], pluginOptions: {} };
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as TSpecConfig;
  } catch {
    return { plugins: [], pluginOptions: {} };
  }
}

/**
 * Save config to a JSON file
 */
function saveConfigFile(configPath: string, config: TSpecConfig): void {
  const dir = configPath.substring(0, configPath.lastIndexOf('/'));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Add plugin to config if not already present
 */
function addPluginToConfig(config: TSpecConfig, pluginName: string): boolean {
  if (!config.plugins) {
    config.plugins = [];
  }
  
  if (config.plugins.includes(pluginName)) {
    return false; // Already exists
  }
  
  config.plugins.push(pluginName);
  return true;
}

/**
 * Install plugin - core logic for CLI and MCP integration
 */
export async function executePluginInstall(params: PluginInstallParams): Promise<PluginInstallResult> {
  const { pluginName, output = 'text', global: useGlobal = false, config: customConfig } = params;
  
  // Determine config path
  let configPath: string;
  if (customConfig) {
    configPath = customConfig;
  } else if (useGlobal) {
    configPath = GLOBAL_CONFIG_PATH;
  } else {
    // Try to find local config, fallback to global
    const localConfig = findLocalConfigFile();
    configPath = localConfig || GLOBAL_CONFIG_PATH;
  }
  
  // Check if already installed
  const alreadyInstalled = isPluginInstalled(pluginName);
  
  let installed = false;
  let installError: string | undefined;
  
  // Install plugin if not already installed
  if (!alreadyInstalled) {
    const result = await installPlugin(pluginName);
    installed = result.success;
    if (!result.success) {
      installError = result.error;
    }
  } else {
    installed = true;
  }
  
  // Update config file if installation succeeded
  let configUpdated = false;
  if (installed) {
    const config = loadConfigFile(configPath);
    configUpdated = addPluginToConfig(config, pluginName);
    if (configUpdated) {
      saveConfigFile(configPath, config);
    }
  }
  
  // Build result
  const data: PluginInstallResult['data'] = {
    plugin: pluginName,
    installed,
    configUpdated,
    configPath: installed ? configPath : undefined,
    error: installError
  };
  
  let outputStr: string;
  if (output === 'json') {
    outputStr = JSON.stringify(data, null, 2);
  } else {
    if (!installed) {
      outputStr = chalk.red(`Failed to install ${pluginName}: ${installError || 'Unknown error'}`);
    } else if (alreadyInstalled && !configUpdated) {
      outputStr = chalk.yellow(`Plugin ${pluginName} is already installed and configured.`);
    } else if (alreadyInstalled && configUpdated) {
      outputStr = [
        chalk.green(`Plugin ${pluginName} is already installed.`),
        chalk.green(`Added to config: ${configPath}`)
      ].join('\n');
    } else if (configUpdated) {
      outputStr = [
        chalk.green(`Successfully installed ${pluginName}`),
        chalk.green(`Added to config: ${configPath}`)
      ].join('\n');
    } else {
      outputStr = [
        chalk.green(`Successfully installed ${pluginName}`),
        chalk.yellow(`Plugin already in config: ${configPath}`)
      ].join('\n');
    }
  }
  
  return {
    success: installed,
    output: outputStr,
    data
  };
}

export const pluginInstallCommand = new Command('plugin:install')
  .alias('install')
  .description('Install a TSpec plugin and add it to config')
  .argument('<plugin>', 'Plugin name (npm package name, e.g., @tspec/http)')
  .option('-o, --output <format>', 'Output format: json, text', 'text')
  .option('-g, --global', 'Add plugin to global config (~/.tspec/tspec.config.json)')
  .option('-c, --config <path>', 'Path to config file to update')
  .action(async (plugin: string, options: PluginInstallOptions) => {
    const spinner = ora(`Installing ${plugin}...`).start();
    
    try {
      const result = await executePluginInstall({
        pluginName: plugin,
        output: options.output as OutputFormat,
        global: options.global,
        config: options.config
      });
      
      spinner.stop();
      logger.log(result.output);
      
      process.exit(result.success ? 0 : 1);
    } catch (err) {
      spinner.stop();
      const message = err instanceof Error ? err.message : String(err);
      
      if (options.output === 'json') {
        logger.log(JSON.stringify({ success: false, error: message }, null, 2));
      } else {
        logger.error(`Failed to install plugin: ${message}`);
      }
      process.exit(2);
    }
  });
