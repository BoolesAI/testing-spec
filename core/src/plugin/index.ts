/**
 * TSpec Plugin System
 * 
 * Public exports for the plugin architecture.
 */

// Core types
export type {
  TSpecPlugin,
  PluginMetadata,
  PluginContext,
  PluginFactory,
  PluginLogger,
  PluginLoadResult,
  PluginLoadSummary,
  PluginHealthStatus,
  PluginHealthReport,
  ProtocolSchema,
  PluginValidationResult
} from './types.js';

// Plugin manager
export { 
  PluginManager, 
  getPluginManager, 
  resetPluginManager 
} from './manager.js';

// Plugin loader
export { PluginLoader } from './loader.js';

// Configuration
export { 
  loadConfig, 
  findConfigFile, 
  getPluginOptions,
  resolvePluginPath,
  type TSpecConfig 
} from './config.js';

// Protocol registry
export { 
  ProtocolRegistry, 
  isValidProtocol, 
  detectProtocolFromSpec 
} from './protocol-registry.js';
