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
 * Proxy operation types that can be forwarded to remote server
 */
export type ProxyOperation = 'run' | 'validate' | 'parse';

/**
 * Proxy configuration for remote test execution
 */
export interface ProxyConfig {
  /** Remote proxy server URL (http or https) */
  url: string;
  
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Custom HTTP headers (supports ${ENV_VAR} expansion) */
  headers?: Record<string, string>;
  
  /** Enable/disable proxy (default: true) */
  enabled?: boolean;
  
  /** Operations to proxy (default: ['run', 'validate', 'parse']) */
  operations?: ProxyOperation[];
}

/**
 * Plugin configuration structure
 */
export interface TSpecConfig {
  /** List of plugins to load (package names or paths) */
  plugins?: string[];
  
  /** Plugin-specific options */
  pluginOptions?: Record<string, Record<string, unknown>>;
  
  /** Proxy configuration for remote execution */
  proxy?: ProxyConfig;
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
  pluginOptions: {},
  proxy: undefined
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
    pluginOptions: mergedOptions,
    proxy: local.proxy || global.proxy  // Local proxy takes full precedence
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

/**
 * Default proxy operations
 */
const DEFAULT_PROXY_OPERATIONS: ProxyOperation[] = ['run', 'validate', 'parse'];

/**
 * Default proxy timeout (30 seconds)
 */
const DEFAULT_PROXY_TIMEOUT = 30000;

/**
 * Check if proxy is enabled for a specific operation
 */
export function isProxyEnabled(config: TSpecConfig, operation: ProxyOperation): boolean {
  const proxy = config.proxy;
  if (!proxy || !proxy.url) {
    return false;
  }
  
  if (proxy.enabled === false) {
    return false;
  }
  
  const operations = proxy.operations || DEFAULT_PROXY_OPERATIONS;
  return operations.includes(operation);
}

/**
 * Get proxy configuration with defaults applied
 */
export function getProxyConfig(config: TSpecConfig): ProxyConfig | null {
  if (!config.proxy || !config.proxy.url) {
    return null;
  }
  
  if (config.proxy.enabled === false) {
    return null;
  }
  
  return {
    url: config.proxy.url,
    timeout: config.proxy.timeout ?? DEFAULT_PROXY_TIMEOUT,
    headers: config.proxy.headers ?? {},
    enabled: config.proxy.enabled ?? true,
    operations: config.proxy.operations ?? DEFAULT_PROXY_OPERATIONS
  };
}

/**
 * Expand environment variables in a string
 * Replaces ${VAR_NAME} with process.env.VAR_NAME
 */
export function expandEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    return process.env[varName] ?? match;
  });
}

/**
 * Expand environment variables in proxy headers
 */
export function expandProxyHeaders(headers: Record<string, string>): Record<string, string> {
  const expanded: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    expanded[key] = expandEnvVars(value);
  }
  return expanded;
}
