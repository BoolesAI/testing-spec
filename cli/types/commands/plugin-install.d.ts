import { Command } from 'commander';
import type { OutputFormat } from '../utils/formatter.js';
export interface PluginInstallParams {
    pluginName: string;
    output?: OutputFormat;
    global?: boolean;
    config?: string;
}
export interface PluginInstallResult {
    success: boolean;
    output: string;
    data: {
        plugin: string;
        installed: boolean;
        configUpdated: boolean;
        configPath?: string;
        error?: string;
    };
}
/**
 * Install plugin - core logic for CLI and MCP integration
 */
export declare function executePluginInstall(params: PluginInstallParams): Promise<PluginInstallResult>;
export declare const pluginInstallCommand: Command;
