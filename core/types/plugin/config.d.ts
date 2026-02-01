/**
 * TSpec Plugin Configuration Loader
 *
 * Loads plugin configuration from tspec.config.js files.
 */
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
 * Find the config file starting from a directory
 */
export declare function findConfigFile(startDir?: string): string | null;
/**
 * Load configuration from a config file
 */
export declare function loadConfig(configPath?: string): Promise<TSpecConfig>;
/**
 * Get plugin options from config
 */
export declare function getPluginOptions(config: TSpecConfig, pluginName: string): Record<string, unknown>;
/**
 * Resolve plugin path (handles both package names and relative paths)
 */
export declare function resolvePluginPath(plugin: string, configDir?: string): string;
