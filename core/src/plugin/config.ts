/**
 * TSpec Plugin Configuration Loader
 * 
 * Loads plugin configuration from tspec.config.js files.
 */

import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { pathToFileURL } from 'url';

/**
 * Plugin configuration structure
 */
export interface TSpecConfig {
  /** List of plugins to load (package names or paths) */
  plugins?: string[];
  
  /** Plugin-specific options */
  pluginOptions?: Record<string, Record<string, unknown>>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TSpecConfig = {
  plugins: [],
  pluginOptions: {}
};

/**
 * Config file names to search for (in order of priority)
 */
const CONFIG_FILE_NAMES = [
  'tspec.config.js',
  'tspec.config.mjs',
  'tspec.config.cjs'
];

/**
 * Find the config file starting from a directory
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  let currentDir = resolve(startDir);
  const root = dirname(currentDir);
  
  while (currentDir !== root) {
    for (const fileName of CONFIG_FILE_NAMES) {
      const configPath = resolve(currentDir, fileName);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  
  // Check root as well
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = resolve(currentDir, fileName);
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  
  return null;
}

/**
 * Load configuration from a config file
 */
export async function loadConfig(configPath?: string): Promise<TSpecConfig> {
  const resolvedPath = configPath || findConfigFile();
  
  if (!resolvedPath) {
    return { ...DEFAULT_CONFIG };
  }
  
  if (!existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }
  
  try {
    // Use dynamic import for ESM compatibility
    const fileUrl = pathToFileURL(resolvedPath).href;
    const configModule = await import(fileUrl);
    const config = configModule.default || configModule;
    
    return {
      ...DEFAULT_CONFIG,
      ...config
    };
  } catch (error) {
    throw new Error(`Failed to load config from ${resolvedPath}: ${(error as Error).message}`);
  }
}

/**
 * Get plugin options from config
 */
export function getPluginOptions(
  config: TSpecConfig, 
  pluginName: string
): Record<string, unknown> {
  return config.pluginOptions?.[pluginName] || {};
}

/**
 * Resolve plugin path (handles both package names and relative paths)
 */
export function resolvePluginPath(plugin: string, configDir: string = process.cwd()): string {
  // If it's a relative or absolute path
  if (plugin.startsWith('.') || plugin.startsWith('/')) {
    return resolve(configDir, plugin);
  }
  
  // Otherwise treat as npm package name
  return plugin;
}
