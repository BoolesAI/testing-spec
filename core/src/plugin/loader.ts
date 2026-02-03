/**
 * TSpec Plugin Loader
 * 
 * Handles dynamic loading and initialization of plugins.
 */

import { existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { pathToFileURL } from 'url';
import type { 
  TSpecPlugin, 
  PluginContext, 
  PluginLoadResult, 
  PluginFactory,
  PluginValidationResult 
} from './types.js';
import { getPluginsNodeModulesPath } from './installer.js';

/**
 * Plugin loader - loads and initializes plugins
 */
export class PluginLoader {
  /**
   * Load a plugin from a path or package name
   */
  async load(pluginPath: string, context: PluginContext): Promise<PluginLoadResult> {
    try {
      // Import plugin module
      const module = await this.importPlugin(pluginPath);
      
      // Try different export patterns
      let plugin: TSpecPlugin;
      
      if (typeof module.createPlugin === 'function') {
        // Factory function pattern
        const factory = module.createPlugin as PluginFactory;
        plugin = await factory(context);
      } else if (module.default && typeof module.default === 'object') {
        // Default export pattern (plugin instance)
        plugin = module.default as TSpecPlugin;
      } else if (typeof module.default === 'function') {
        // Default export factory
        const factory = module.default as PluginFactory;
        plugin = await factory(context);
      } else if (module.plugin && typeof module.plugin === 'object') {
        // Named export pattern
        plugin = module.plugin as TSpecPlugin;
      } else {
        throw new Error('Plugin does not export a valid TSpecPlugin or createPlugin factory');
      }
      
      // Validate plugin structure
      const validation = this.validatePlugin(plugin);
      if (!validation.valid) {
        throw new Error(`Invalid plugin structure: ${validation.errors.join(', ')}`);
      }
      
      // Initialize plugin
      if (plugin.initialize) {
        await plugin.initialize(context);
      }
      
      return {
        success: true,
        plugin,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }
  
  /**
   * Import a plugin module
   */
  private async importPlugin(pluginPath: string): Promise<Record<string, unknown>> {
    // Check if it's a file path
    if (pluginPath.startsWith('.') || pluginPath.startsWith('/')) {
      const resolvedPath = resolve(pluginPath);
      
      if (!existsSync(resolvedPath)) {
        throw new Error(`Plugin not found: ${resolvedPath}`);
      }
      
      // Check for dist/index.js if pointing to package root
      let importPath = resolvedPath;
      if (existsSync(resolve(resolvedPath, 'dist', 'index.js'))) {
        importPath = resolve(resolvedPath, 'dist', 'index.js');
      } else if (existsSync(resolve(resolvedPath, 'index.js'))) {
        importPath = resolve(resolvedPath, 'index.js');
      }
      
      const fileUrl = pathToFileURL(importPath).href;
      return await import(fileUrl);
    }
    
    // For npm packages, first try the global plugins directory
    const globalPluginPath = join(getPluginsNodeModulesPath(), pluginPath);
    if (existsSync(globalPluginPath)) {
      // Try to find the entry point
      let importPath = globalPluginPath;
      if (existsSync(join(globalPluginPath, 'dist', 'index.js'))) {
        importPath = join(globalPluginPath, 'dist', 'index.js');
      } else if (existsSync(join(globalPluginPath, 'index.js'))) {
        importPath = join(globalPluginPath, 'index.js');
      }
      
      try {
        const fileUrl = pathToFileURL(importPath).href;
        return await import(fileUrl);
      } catch {
        // Fall through to standard import
      }
    }
    
    // Otherwise try standard npm package resolution
    try {
      return await import(pluginPath);
    } catch (error) {
      throw new Error(`Failed to import plugin '${pluginPath}': ${(error as Error).message}`);
    }
  }
  
  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: unknown): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!plugin || typeof plugin !== 'object') {
      errors.push('Plugin must be an object');
      return { valid: false, errors };
    }
    
    const p = plugin as Partial<TSpecPlugin>;
    
    // Check metadata
    if (!p.metadata) {
      errors.push('Plugin must have metadata');
    } else {
      if (!p.metadata.name) {
        errors.push('Plugin metadata must have name');
      }
      if (!p.metadata.version) {
        errors.push('Plugin metadata must have version');
      }
      if (!p.metadata.protocols || p.metadata.protocols.length === 0) {
        errors.push('Plugin metadata must declare at least one protocol');
      }
      if (p.metadata.compatibility) {
        warnings.push(`Plugin declares compatibility constraint: ${p.metadata.compatibility}`);
      }
    }
    
    // Check schemas
    if (!p.schemas || !Array.isArray(p.schemas)) {
      errors.push('Plugin must provide schemas array');
    }
    
    // Check createRunner
    if (typeof p.createRunner !== 'function') {
      errors.push('Plugin must implement createRunner method');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}
