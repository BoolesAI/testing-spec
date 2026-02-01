import type { RunnerOptions, TestRunner } from './types.js';
export type ExecutorType = 'http' | 'grpc' | 'graphql' | 'websocket' | 'web' | string;
export interface ExecutorConstructor {
    new (options: RunnerOptions): TestRunner;
}
/**
 * ExecutorRegistry - maintains backward compatibility with legacy API
 * while delegating to PluginManager for plugin-based protocols.
 */
export declare class ExecutorRegistry {
    private executors;
    private usePluginManager;
    /**
     * Register an executor class for a protocol type
     * This is the legacy API for backward compatibility
     */
    register(type: ExecutorType, executorClass: ExecutorConstructor): void;
    /**
     * Enable plugin manager for protocol resolution
     */
    enablePluginManager(): void;
    /**
     * Create a runner instance for a protocol type
     */
    create(type: ExecutorType, options?: RunnerOptions): TestRunner;
    /**
     * Check if a protocol type has a registered executor
     */
    has(type: ExecutorType): boolean;
    /**
     * Get protocol type from file extension
     */
    getTypeFromExtension(filePath: string): ExecutorType | null;
    /**
     * Get all registered protocol types
     */
    getRegisteredTypes(): ExecutorType[];
}
export declare const registry: ExecutorRegistry;
