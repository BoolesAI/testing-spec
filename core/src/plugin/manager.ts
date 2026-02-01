/**
 * TSpec Plugin Manager
 * 
 * Central registry for managing plugins and protocol handlers.
 */

import type { TestRunner, RunnerOptions } from '../runner/types.js';
import type { 
  TSpecPlugin, 
  PluginMetadata, 
  PluginContext, 
  PluginLogger,
  PluginLoadSummary,
  PluginHealthReport,
  ProtocolSchema
} from './types.js';
import { PluginLoader } from './loader.js';
import { loadConfig, getPluginOptions, resolvePluginPath, type TSpecConfig } from './config.js';
import { dirname } from 'path';

/**
 * Central plugin manager
 */
export class PluginManager {
  private plugins: Map<string, TSpecPlugin> = new Map();
  private protocolMap: Map<string, string> = new Map(); // protocol -> plugin name
  private schemaMap: Map<string, ProtocolSchema> = new Map(); // protocol -> schema
  private logger: PluginLogger;
  private coreVersion: string;
  private loader: PluginLoader;
  private initialized: boolean = false;
  
  constructor(coreVersion: string, logger?: PluginLogger) {
    this.coreVersion = coreVersion;
    this.logger = logger || this.createDefaultLogger();
    this.loader = new PluginLoader();
  }
  
  /**
   * Initialize plugin manager by loading plugins from config
   */
  async initialize(configPath?: string): Promise<PluginLoadSummary> {
    if (this.initialized) {
      return {
        total: this.plugins.size,
        loaded: this.plugins.size,
        failed: 0,
        errors: []
      };
    }
    
    const config = await loadConfig(configPath);
    const summary = await this.loadPluginsFromConfig(config, configPath);
    this.initialized = true;
    
    return summary;
  }
  
  /**
   * Load plugins from configuration
   */
  async loadPluginsFromConfig(config: TSpecConfig, configPath?: string): Promise<PluginLoadSummary> {
    const plugins = config.plugins || [];
    const configDir = configPath ? dirname(configPath) : process.cwd();
    
    const results: PluginLoadSummary = {
      total: plugins.length,
      loaded: 0,
      failed: 0,
      errors: [],
    };
    
    for (const pluginPath of plugins) {
      const resolvedPath = resolvePluginPath(pluginPath, configDir);
      const pluginOptions = getPluginOptions(config, pluginPath);
      
      const context: PluginContext = {
        coreVersion: this.coreVersion,
        config: pluginOptions,
        logger: this.logger,
      };
      
      const result = await this.loader.load(resolvedPath, context);
      
      if (result.success && result.plugin) {
        try {
          this.register(result.plugin);
          results.loaded++;
          
          if (result.warnings) {
            result.warnings.forEach(w => this.logger.warn(w));
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            plugin: pluginPath,
            error: (error as Error).message,
          });
        }
      } else {
        results.failed++;
        results.errors.push({
          plugin: pluginPath,
          error: result.error?.message || 'Unknown error',
        });
      }
    }
    
    return results;
  }
  
  /**
   * Manually register a plugin
   */
  register(plugin: TSpecPlugin): void {
    const { name, protocols } = plugin.metadata;
    
    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }
    
    // Check protocol conflicts
    for (const protocol of protocols) {
      if (this.protocolMap.has(protocol)) {
        const existing = this.protocolMap.get(protocol);
        throw new Error(
          `Protocol "${protocol}" is already registered by plugin "${existing}"`
        );
      }
    }
    
    // Register plugin
    this.plugins.set(name, plugin);
    
    // Map protocols to plugin
    for (const protocol of protocols) {
      this.protocolMap.set(protocol, name);
    }
    
    // Register schemas
    for (const schema of plugin.schemas) {
      this.schemaMap.set(schema.protocol, schema);
    }
    
    this.logger.info(`Registered plugin: ${name} v${plugin.metadata.version} (protocols: ${protocols.join(', ')})`);
  }
  
  /**
   * Unregister a plugin
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    
    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`);
    }
    
    // Dispose plugin
    if (plugin.dispose) {
      await plugin.dispose();
    }
    
    // Remove protocol mappings
    for (const protocol of plugin.metadata.protocols) {
      this.protocolMap.delete(protocol);
    }
    
    // Remove schemas
    for (const schema of plugin.schemas) {
      this.schemaMap.delete(schema.protocol);
    }
    
    // Remove plugin
    this.plugins.delete(name);
    
    this.logger.info(`Unregistered plugin: ${name}`);
  }
  
  /**
   * Get plugin by name
   */
  get(name: string): TSpecPlugin | undefined {
    return this.plugins.get(name);
  }
  
  /**
   * Check if plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }
  
  /**
   * Check if protocol is supported
   */
  hasProtocol(protocol: string): boolean {
    return this.protocolMap.has(protocol);
  }
  
  /**
   * Get plugin that handles a protocol
   */
  getPluginForProtocol(protocol: string): TSpecPlugin | undefined {
    const pluginName = this.protocolMap.get(protocol);
    return pluginName ? this.plugins.get(pluginName) : undefined;
  }
  
  /**
   * Get schema for a protocol
   */
  getSchema(protocol: string): ProtocolSchema | undefined {
    return this.schemaMap.get(protocol);
  }
  
  /**
   * Create a runner for a protocol
   */
  createRunner(protocol: string, options: RunnerOptions = {}): TestRunner {
    const plugin = this.getPluginForProtocol(protocol);
    
    if (!plugin) {
      throw new Error(`No plugin registered for protocol: ${protocol}`);
    }
    
    return plugin.createRunner(protocol, options);
  }
  
  /**
   * List all registered plugins
   */
  list(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(p => p.metadata);
  }
  
  /**
   * List all supported protocols
   */
  listProtocols(): string[] {
    return Array.from(this.protocolMap.keys());
  }
  
  /**
   * Health check all plugins
   */
  async healthCheck(): Promise<PluginHealthReport[]> {
    const reports: PluginHealthReport[] = [];
    
    for (const [name, plugin] of this.plugins) {
      if (plugin.healthCheck) {
        try {
          const status = await plugin.healthCheck();
          reports.push({ plugin: name, ...status });
        } catch (error) {
          reports.push({
            plugin: name,
            healthy: false,
            message: (error as Error).message,
          });
        }
      } else {
        reports.push({
          plugin: name,
          healthy: true,
          message: 'No health check implemented',
        });
      }
    }
    
    return reports;
  }
  
  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get the number of registered plugins
   */
  size(): number {
    return this.plugins.size;
  }
  
  /**
   * Clear all plugins (useful for testing)
   */
  async clear(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());
    
    for (const name of pluginNames) {
      await this.unregister(name);
    }
    
    this.initialized = false;
  }
  
  private createDefaultLogger(): PluginLogger {
    return {
      debug: (msg, ...args) => {
        if (process.env.DEBUG) {
          console.debug(`[Plugin] ${msg}`, ...args);
        }
      },
      info: (msg, ...args) => console.info(`[Plugin] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[Plugin] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[Plugin] ${msg}`, ...args),
    };
  }
}

// Singleton instance for global access
let globalPluginManager: PluginManager | null = null;

/**
 * Get or create the global plugin manager instance
 */
export function getPluginManager(coreVersion: string = '1.0.0'): PluginManager {
  if (!globalPluginManager) {
    globalPluginManager = new PluginManager(coreVersion);
  }
  return globalPluginManager;
}

/**
 * Reset the global plugin manager (for testing)
 */
export async function resetPluginManager(): Promise<void> {
  if (globalPluginManager) {
    await globalPluginManager.clear();
    globalPluginManager = null;
  }
}
