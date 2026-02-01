import { Command } from 'commander';
import type { OutputFormat } from '../utils/formatter.js';
export interface PluginListParams {
    output?: OutputFormat;
    verbose?: boolean;
    health?: boolean;
    config?: string;
}
export interface PluginListResult {
    success: boolean;
    output: string;
    data: {
        plugins: Array<{
            name: string;
            version: string;
            description?: string;
            protocols: string[];
            author?: string;
            homepage?: string;
        }>;
        protocols: string[];
        configPath?: string;
        health?: Array<{
            plugin: string;
            healthy: boolean;
            message?: string;
        }>;
    };
}
/**
 * List plugins - core logic for CLI and MCP integration
 */
export declare function executePluginList(params: PluginListParams): Promise<PluginListResult>;
export declare const pluginListCommand: Command;
