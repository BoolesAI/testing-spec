/**
 * TSpec Plugin Manager
 *
 * Central registry for managing plugins and protocol handlers.
 */
import type { TestRunner, RunnerOptions } from '../runner/types.js';
import type { TSpecPlugin, PluginMetadata, PluginLogger, PluginLoadSummary, PluginHealthReport, ProtocolSchema } from './types.js';
import { type TSpecConfig } from './config.js';
/**
 * Options for plugin manager initialization
 */
export interface PluginManagerInitOptions {
    /** Skip automatic plugin installation */
    skipAutoInstall?: boolean;
}
/**
 * Central plugin manager
 */
export declare class PluginManager {
    private plugins;
    private protocolMap;
    private schemaMap;
    private logger;
    private coreVersion;
    private loader;
    private initialized;
    constructor(coreVersion: string, logger?: PluginLogger);
    /**
     * Initialize plugin manager by loading plugins from config
     */
    initialize(configPath?: string, options?: PluginManagerInitOptions): Promise<PluginLoadSummary>;
    /**
     * Load plugins from configuration
     */
    loadPluginsFromConfig(config: TSpecConfig, configPath?: string): Promise<PluginLoadSummary>;
    /**
     * Manually register a plugin
     */
    register(plugin: TSpecPlugin): void;
    /**
     * Unregister a plugin
     */
    unregister(name: string): Promise<void>;
    /**
     * Get plugin by name
     */
    get(name: string): TSpecPlugin | undefined;
    /**
     * Check if plugin is registered
     */
    has(name: string): boolean;
    /**
     * Check if protocol is supported
     */
    hasProtocol(protocol: string): boolean;
    /**
     * Get plugin that handles a protocol
     */
    getPluginForProtocol(protocol: string): TSpecPlugin | undefined;
    /**
     * Get schema for a protocol
     */
    getSchema(protocol: string): ProtocolSchema | undefined;
    /**
     * Create a runner for a protocol
     */
    createRunner(protocol: string, options?: RunnerOptions): TestRunner;
    /**
     * List all registered plugins
     */
    list(): PluginMetadata[];
    /**
     * List all supported protocols
     */
    listProtocols(): string[];
    /**
     * Health check all plugins
     */
    healthCheck(): Promise<PluginHealthReport[]>;
    /**
     * Check if manager is initialized
     */
    isInitialized(): boolean;
    /**
     * Get the number of registered plugins
     */
    size(): number;
    /**
     * Clear all plugins (useful for testing)
     */
    clear(): Promise<void>;
    private createDefaultLogger;
}
/**
 * Get or create the global plugin manager instance
 */
export declare function getPluginManager(coreVersion?: string): PluginManager;
/**
 * Reset the global plugin manager (for testing)
 */
export declare function resetPluginManager(): Promise<void>;
