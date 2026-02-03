/**
 * TSpec Plugin Configuration Loader
 * 
 * Loads plugin configuration from tspec.config.json files.
 * Supports both local (project) and global (~/.tspec) configuration.
 */

import { existsSync, readFileSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { homedir } from 'os';

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
 * Extended config with source metadata
 */
export interface LoadedConfig extends TSpecConfig {
  /** Source information for debugging */
  _sources?: {
    local?: string;
    global?: string;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TSpecConfig = {
  plugins: [],
  pluginOptions: {}
};

/**
 * Config file name (JSON only)
 */
export const CONFIG_FILE_NAME = 'tspec.config.json';

/**
 * Global config directory (~/.tspec)
 */
export const GLOBAL_CONFIG_DIR = join(homedir(), '.tspec');

/**
 * Global config file path (~/.tspec/tspec.config.json)
 */
export const GLOBAL_CONFIG_PATH = join(GLOBAL_CONFIG_DIR, CONFIG_FILE_NAME);

/**
 * Global plugins directory (~/.tspec/plugins)
 */
export const PLUGINS_DIR = join(GLOBAL_CONFIG_DIR, 'plugins');

/**
 * Find local config file starting from a directory (searches upward)
 */
export function findLocalConfigFile(startDir: string = process.cwd()): string | null {
  let currentDir = resolve(startDir);
  const root = dirname(currentDir);
  
  while (currentDir !== root) {
    const configPath = resolve(currentDir, CONFIG_FILE_NAME);
    if (existsSync(configPath)) {
      return configPath;
    }
    
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  
  // Check root as well
  const configPath = resolve(currentDir, CONFIG_FILE_NAME);
  if (existsSync(configPath)) {
    return configPath;
  }
  
  return null;
}

/**
 * Find global config file (~/.tspec/tspec.config.json)
 */
export function findGlobalConfigFile(): string | null {
  if (existsSync(GLOBAL_CONFIG_PATH)) {
    return GLOBAL_CONFIG_PATH;
  }
  return null;
}

/**
 * Find config file (for backward compatibility)
 * Returns local config path if found, otherwise global
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  return findLocalConfigFile(startDir) || findGlobalConfigFile();
}

/**
 * Load JSON config from a file path
 */
export function loadJsonConfig(configPath: string): TSpecConfig {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as TSpecConfig;
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file ${configPath}: ${error.message}`);
    }
    throw new Error(`Failed to load config from ${configPath}: ${(error as Error).message}`);
  }
}

/**
 * Merge two configs (local takes precedence over global)
 */
export function mergeConfigs(local?: TSpecConfig, global?: TSpecConfig): TSpecConfig {
  if (!local && !global) {
    return { ...DEFAULT_CONFIG };
  }
  
  if (!local) {
    return { ...DEFAULT_CONFIG, ...global };
  }
  
  if (!global) {
    return { ...DEFAULT_CONFIG, ...local };
  }
  
  // Merge plugins arrays (deduplicate)
  const globalPlugins = global.plugins || [];
  const localPlugins = local.plugins || [];
  const allPlugins = [...new Set([...globalPlugins, ...localPlugins])];
  
  // Merge pluginOptions (local overrides global per plugin)
  const mergedOptions: Record<string, Record<string, unknown>> = {};
  
  // First add global options
  if (global.pluginOptions) {
    for (const [plugin, options] of Object.entries(global.pluginOptions)) {
      mergedOptions[plugin] = { ...options };
    }
  }
  
  // Then overlay local options (shallow merge per plugin)
  if (local.pluginOptions) {
    for (const [plugin, options] of Object.entries(local.pluginOptions)) {
      mergedOptions[plugin] = {
        ...mergedOptions[plugin],
        ...options
      };
    }
  }
  
  return {
    plugins: allPlugins,
    pluginOptions: mergedOptions
  };
}

/**
 * Load configuration from config files
 * Supports explicit path, or auto-discovers local + global configs
 */
export async function loadConfig(configPath?: string): Promise<LoadedConfig> {
  // If explicit path provided, load only that file
  if (configPath) {
    if (!existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    const config = loadJsonConfig(configPath);
    return {
      ...DEFAULT_CONFIG,
      ...config,
      _sources: { local: configPath }
    };
  }
  
  // Auto-discover local and global configs
  const localPath = findLocalConfigFile();
  const globalPath = findGlobalConfigFile();
  
  // If no configs found, return default
  if (!localPath && !globalPath) {
    return { ...DEFAULT_CONFIG };
  }
  
  // Load configs
  const localConfig = localPath ? loadJsonConfig(localPath) : undefined;
  const globalConfig = globalPath ? loadJsonConfig(globalPath) : undefined;
  
  // Merge with local precedence
  const merged = mergeConfigs(localConfig, globalConfig);
  
  return {
    ...merged,
    _sources: {
      local: localPath || undefined,
      global: globalPath || undefined
    }
  };
}

/**
 * Ensure the global config directory exists
 */
export function ensureGlobalConfigDir(): void {
  if (!existsSync(GLOBAL_CONFIG_DIR)) {
    mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
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
