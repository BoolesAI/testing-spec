/**
 * TSpec Plugin System Types
 *
 * This module defines the interfaces and types for the plugin architecture
 * that allows protocol handlers to be implemented as separate npm packages.
 */
import type { TestRunner, RunnerOptions } from '../runner/types.js';
/**
 * Plugin metadata descriptor
 */
export interface PluginMetadata {
    /** Plugin name (e.g., "http", "web", "desktop") */
    name: string;
    /** Plugin version (semver) */
    version: string;
    /** Human-readable description */
    description?: string;
    /** Protocols this plugin supports */
    protocols: string[];
    /** TSpec core compatibility (semver range) */
    compatibility?: string;
    /** Plugin author/maintainer */
    author?: string;
    /** Plugin homepage or repository URL */
    homepage?: string;
    /** Plugin tags for categorization */
    tags?: string[];
}
/**
 * Schema contribution for protocol-specific blocks
 */
export interface ProtocolSchema {
    /** Protocol name (e.g., "http", "web", "desktop") */
    protocol: string;
    /** JSON Schema for protocol request block */
    requestSchema: Record<string, unknown>;
    /** JSON Schema for protocol-specific options */
    optionsSchema?: Record<string, unknown>;
    /** Example request blocks (for documentation/validation) */
    examples?: Array<{
        description: string;
        request: Record<string, unknown>;
    }>;
}
/**
 * Logger interface for plugins
 */
export interface PluginLogger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}
/**
 * Plugin initialization context
 */
export interface PluginContext {
    /** TSpec core version */
    coreVersion: string;
    /** Plugin configuration from user */
    config?: Record<string, unknown>;
    /** Logger instance */
    logger?: PluginLogger;
}
/**
 * Validation result from plugin
 */
export interface PluginValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
}
/**
 * Plugin health status
 */
export interface PluginHealthStatus {
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
}
/**
 * Main plugin interface - all plugins must implement this
 */
export interface TSpecPlugin {
    /** Plugin metadata */
    readonly metadata: PluginMetadata;
    /** Protocol schemas this plugin contributes */
    readonly schemas: ProtocolSchema[];
    /**
     * Initialize the plugin
     * Called once when plugin is loaded
     */
    initialize?(context: PluginContext): Promise<void> | void;
    /**
     * Create a test runner for the given protocol
     * @param protocol - Protocol name (must be in metadata.protocols)
     * @param options - Runner options
     */
    createRunner(protocol: string, options: RunnerOptions): TestRunner;
    /**
     * Validate protocol-specific request block
     * @param protocol - Protocol name
     * @param request - Request object from test case
     * @returns Validation result
     */
    validateRequest?(protocol: string, request: unknown): PluginValidationResult;
    /**
     * Cleanup resources when plugin is unregistered
     */
    dispose?(): Promise<void> | void;
    /**
     * Health check - verify plugin is functioning
     */
    healthCheck?(): Promise<PluginHealthStatus>;
}
/**
 * Plugin factory function signature
 */
export type PluginFactory = (context: PluginContext) => TSpecPlugin | Promise<TSpecPlugin>;
/**
 * Plugin load result
 */
export interface PluginLoadResult {
    success: boolean;
    plugin?: TSpecPlugin;
    error?: Error;
    warnings?: string[];
}
/**
 * Plugin load summary
 */
export interface PluginLoadSummary {
    total: number;
    loaded: number;
    failed: number;
    errors: Array<{
        plugin: string;
        error: string;
    }>;
    /** Number of plugins auto-installed */
    installed?: number;
    /** Plugins that were already installed */
    alreadyInstalled?: string[];
    /** Errors during plugin installation */
    installErrors?: Array<{
        plugin: string;
        error: string;
    }>;
}
/**
 * Plugin health report
 */
export interface PluginHealthReport {
    plugin: string;
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
}
