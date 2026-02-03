/**
 * TSpec Plugin Installer
 *
 * Handles automatic npm package installation for plugins.
 */
/**
 * Result of a single plugin installation
 */
export interface InstallResult {
    success: boolean;
    plugin: string;
    error?: string;
}
/**
 * Summary of plugin installation operation
 */
export interface InstallSummary {
    installed: string[];
    alreadyInstalled: string[];
    failed: Array<{
        plugin: string;
        error: string;
    }>;
}
/**
 * Ensure the plugins directory exists with a package.json
 */
export declare function ensurePluginsDirectory(): string;
/**
 * Get the node_modules path for plugins
 */
export declare function getPluginsNodeModulesPath(): string;
/**
 * Check if a plugin is installed in the global plugins directory
 */
export declare function isPluginInstalled(pluginName: string): boolean;
/**
 * Install a single plugin using npm
 */
export declare function installPlugin(pluginName: string): Promise<InstallResult>;
/**
 * Install multiple plugins, skipping already installed ones
 */
export declare function installMissingPlugins(plugins: string[]): Promise<InstallSummary>;
