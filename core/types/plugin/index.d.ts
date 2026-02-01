/**
 * TSpec Plugin System
 *
 * Public exports for the plugin architecture.
 */
export type { TSpecPlugin, PluginMetadata, PluginContext, PluginFactory, PluginLogger, PluginLoadResult, PluginLoadSummary, PluginHealthStatus, PluginHealthReport, ProtocolSchema, PluginValidationResult } from './types.js';
export { PluginManager, getPluginManager, resetPluginManager } from './manager.js';
export { PluginLoader } from './loader.js';
export { loadConfig, findConfigFile, getPluginOptions, resolvePluginPath, type TSpecConfig } from './config.js';
export { ProtocolRegistry, isValidProtocol, detectProtocolFromSpec } from './protocol-registry.js';
