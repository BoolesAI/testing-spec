import type { TestCase } from '../parser/index.js';
import type { Response } from '../assertion/types.js';
import type { RunnerOptions, TestRunner } from './types.js';
import { getPluginManager } from '../plugin/manager.js';
import { ProtocolRegistry } from '../plugin/protocol-registry.js';

export type ExecutorType = 'http' | 'grpc' | 'graphql' | 'websocket' | 'web' | string;

export interface ExecutorConstructor {
  new (options: RunnerOptions): TestRunner;
}

/**
 * ExecutorRegistry - maintains backward compatibility with legacy API
 * while delegating to PluginManager for plugin-based protocols.
 */
export class ExecutorRegistry {
  private executors = new Map<ExecutorType, ExecutorConstructor>();
  private usePluginManager: boolean = false;

  /**
   * Register an executor class for a protocol type
   * This is the legacy API for backward compatibility
   */
  register(type: ExecutorType, executorClass: ExecutorConstructor): void {
    this.executors.set(type, executorClass);
    // Also register in protocol registry
    ProtocolRegistry.register(type);
  }

  /**
   * Enable plugin manager for protocol resolution
   */
  enablePluginManager(): void {
    this.usePluginManager = true;
  }

  /**
   * Create a runner instance for a protocol type
   */
  create(type: ExecutorType, options: RunnerOptions = {}): TestRunner {
    // First check local registry (legacy registered executors)
    const ExecutorClass = this.executors.get(type);
    if (ExecutorClass) {
      return new ExecutorClass(options);
    }

    // Then try plugin manager if enabled
    if (this.usePluginManager) {
      const pluginManager = getPluginManager();
      if (pluginManager.hasProtocol(type)) {
        return pluginManager.createRunner(type, options);
      }
    }

    throw new Error(`No executor registered for type: ${type}`);
  }

  /**
   * Check if a protocol type has a registered executor
   */
  has(type: ExecutorType): boolean {
    if (this.executors.has(type)) {
      return true;
    }
    
    if (this.usePluginManager) {
      const pluginManager = getPluginManager();
      return pluginManager.hasProtocol(type);
    }
    
    return false;
  }

  /**
   * Get protocol type from file extension
   */
  getTypeFromExtension(filePath: string): ExecutorType | null {
    return ProtocolRegistry.getProtocolFromFilePath(filePath);
  }

  /**
   * Get all registered protocol types
   */
  getRegisteredTypes(): ExecutorType[] {
    const types = new Set<string>(this.executors.keys());
    
    if (this.usePluginManager) {
      const pluginManager = getPluginManager();
      for (const protocol of pluginManager.listProtocols()) {
        types.add(protocol);
      }
    }
    
    return Array.from(types);
  }
}

export const registry = new ExecutorRegistry();
