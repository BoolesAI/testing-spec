/**
 * TSpec Plugin Configuration Loader
 *
 * Loads plugin configuration from tspec.config.json files.
 * Supports both local (project) and global (~/.tspec) configuration.
 */
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
 * Config file name (JSON only)
 */
export declare const CONFIG_FILE_NAME = "tspec.config.json";
/**
 * Global config directory (~/.tspec)
 */
export declare const GLOBAL_CONFIG_DIR: string;
/**
 * Global config file path (~/.tspec/tspec.config.json)
 */
export declare const GLOBAL_CONFIG_PATH: string;
/**
 * Global plugins directory (~/.tspec/plugins)
 */
export declare const PLUGINS_DIR: string;
/**
 * Find local config file starting from a directory (searches upward)
 */
export declare function findLocalConfigFile(startDir?: string): string | null;
/**
 * Find global config file (~/.tspec/tspec.config.json)
 */
export declare function findGlobalConfigFile(): string | null;
/**
 * Find config file (for backward compatibility)
 * Returns local config path if found, otherwise global
 */
export declare function findConfigFile(startDir?: string): string | null;
/**
 * Load JSON config from a file path
 */
export declare function loadJsonConfig(configPath: string): TSpecConfig;
/**
 * Merge two configs (local takes precedence over global)
 */
export declare function mergeConfigs(local?: TSpecConfig, global?: TSpecConfig): TSpecConfig;
/**
 * Load configuration from config files
 * Supports explicit path, or auto-discovers local + global configs
 */
export declare function loadConfig(configPath?: string): Promise<LoadedConfig>;
/**
 * Ensure the global config directory exists
 */
export declare function ensureGlobalConfigDir(): void;
/**
 * Get plugin options from config
 */
export declare function getPluginOptions(config: TSpecConfig, pluginName: string): Record<string, unknown>;
/**
 * Resolve plugin path (handles both package names and relative paths)
 */
export declare function resolvePluginPath(plugin: string, configDir?: string): string;
/**
 * Check if proxy is enabled for a specific operation
 */
export declare function isProxyEnabled(config: TSpecConfig, operation: ProxyOperation): boolean;
/**
 * Get proxy configuration with defaults applied
 */
export declare function getProxyConfig(config: TSpecConfig): ProxyConfig | null;
/**
 * Expand environment variables in a string
 * Replaces ${VAR_NAME} with process.env.VAR_NAME
 */
export declare function expandEnvVars(value: string): string;
/**
 * Expand environment variables in proxy headers
 */
export declare function expandProxyHeaders(headers: Record<string, string>): Record<string, string>;
