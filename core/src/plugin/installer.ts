/**
 * TSpec Plugin Installer
 * 
 * Handles automatic npm package installation for plugins.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';
import { PLUGINS_DIR, GLOBAL_CONFIG_DIR } from './config.js';

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
  failed: Array<{ plugin: string; error: string }>;
}

/**
 * Ensure the plugins directory exists with a package.json
 */
export function ensurePluginsDirectory(): string {
  // Create ~/.tspec if not exists
  if (!existsSync(GLOBAL_CONFIG_DIR)) {
    mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
  }
  
  // Create ~/.tspec/plugins if not exists
  if (!existsSync(PLUGINS_DIR)) {
    mkdirSync(PLUGINS_DIR, { recursive: true });
  }
  
  // Create package.json if not exists
  const packageJsonPath = join(PLUGINS_DIR, 'package.json');
  if (!existsSync(packageJsonPath)) {
    const packageJson = {
      name: 'tspec-plugins',
      version: '1.0.0',
      private: true,
      description: 'TSpec plugins directory'
    };
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
  
  return PLUGINS_DIR;
}

/**
 * Get the node_modules path for plugins
 */
export function getPluginsNodeModulesPath(): string {
  return join(PLUGINS_DIR, 'node_modules');
}

/**
 * Check if a plugin is installed in the global plugins directory
 */
export function isPluginInstalled(pluginName: string): boolean {
  // Skip check for local paths
  if (pluginName.startsWith('.') || pluginName.startsWith('/')) {
    return true;
  }
  
  const nodeModulesPath = getPluginsNodeModulesPath();
  
  // Handle scoped packages (@scope/name)
  const pluginPath = join(nodeModulesPath, pluginName);
  
  return existsSync(pluginPath);
}

/**
 * Install a single plugin using npm
 */
export async function installPlugin(pluginName: string): Promise<InstallResult> {
  // Skip for local paths
  if (pluginName.startsWith('.') || pluginName.startsWith('/')) {
    return { success: true, plugin: pluginName };
  }
  
  // Ensure plugins directory exists
  ensurePluginsDirectory();
  
  return new Promise((resolve) => {
    const args = ['install', pluginName, '--prefix', PLUGINS_DIR];
    
    const npmProcess = spawn('npm', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
    });
    
    let stderr = '';
    
    npmProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    npmProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, plugin: pluginName });
      } else {
        resolve({
          success: false,
          plugin: pluginName,
          error: stderr.trim() || `npm install exited with code ${code}`
        });
      }
    });
    
    npmProcess.on('error', (error) => {
      resolve({
        success: false,
        plugin: pluginName,
        error: `Failed to run npm: ${error.message}`
      });
    });
  });
}

/**
 * Install multiple plugins, skipping already installed ones
 */
export async function installMissingPlugins(plugins: string[]): Promise<InstallSummary> {
  const summary: InstallSummary = {
    installed: [],
    alreadyInstalled: [],
    failed: []
  };
  
  if (plugins.length === 0) {
    return summary;
  }
  
  // Ensure directory exists before checking
  ensurePluginsDirectory();
  
  // Filter plugins that need installation
  const pluginsToInstall: string[] = [];
  
  for (const plugin of plugins) {
    if (isPluginInstalled(plugin)) {
      summary.alreadyInstalled.push(plugin);
    } else {
      pluginsToInstall.push(plugin);
    }
  }
  
  // Install missing plugins sequentially
  for (const plugin of pluginsToInstall) {
    const result = await installPlugin(plugin);
    
    if (result.success) {
      summary.installed.push(plugin);
    } else {
      summary.failed.push({
        plugin,
        error: result.error || 'Unknown error'
      });
    }
  }
  
  return summary;
}
