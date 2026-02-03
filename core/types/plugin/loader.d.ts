/**
 * TSpec Plugin Loader
 *
 * Handles dynamic loading and initialization of plugins.
 */
import type { PluginContext, PluginLoadResult } from './types.js';
/**
 * Plugin loader - loads and initializes plugins
 */
export declare class PluginLoader {
    /**
     * Load a plugin from a path or package name
     */
    load(pluginPath: string, context: PluginContext): Promise<PluginLoadResult>;
    /**
     * Import a plugin module
     */
    private importPlugin;
    /**
     * Validate plugin structure
     */
    private validatePlugin;
}
