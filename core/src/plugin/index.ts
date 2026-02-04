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
  resetPluginManager,
  type PluginManagerInitOptions
} from './manager.js';

// Plugin loader
export { PluginLoader } from './loader.js';

// Configuration
export { 
  loadConfig, 
  findConfigFile,
  findLocalConfigFile,
  findGlobalConfigFile,
  loadJsonConfig,
  mergeConfigs,
  ensureGlobalConfigDir,
  getPluginOptions,
  resolvePluginPath,
  isProxyEnabled,
  getProxyConfig,
  expandEnvVars,
  expandProxyHeaders,
  CONFIG_FILE_NAME,
  GLOBAL_CONFIG_DIR,
  GLOBAL_CONFIG_PATH,
  PLUGINS_DIR,
  type TSpecConfig,
  type LoadedConfig,
  type ProxyConfig,
  type ProxyOperation
} from './config.js';

// Plugin installer
export {
  ensurePluginsDirectory,
  getPluginsNodeModulesPath,
  isPluginInstalled,
  installPlugin,
  installMissingPlugins,
  type InstallResult,
  type InstallSummary
} from './installer.js';

// Protocol registry
export { 
  ProtocolRegistry, 
  isValidProtocol, 
  detectProtocolFromSpec 
} from './protocol-registry.js';
