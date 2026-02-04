/**
 * TSpec Proxy Client
 *
 * HTTP client for communicating with TSpec proxy servers.
 */
import { ProxyConfig } from '../plugin/config.js';
import { ProxyRunResponse, ProxyValidateResponse, ProxyParseResponse, ProxyError, ProxyRunOptions, ProxyRequestOptions } from './types.js';
/**
 * Proxy client options
 */
export interface ProxyClientOptions {
    /** Proxy server URL */
    url: string;
    /** Request timeout in ms */
    timeout?: number;
    /** Custom headers */
    headers?: Record<string, string>;
}
/**
 * Result wrapper for proxy operations
 */
export interface ProxyResult<T> {
    /** Whether the operation succeeded */
    success: boolean;
    /** Result data (if success) */
    data?: T;
    /** Error (if failed) */
    error?: ProxyError;
}
/**
 * TSpec Proxy Client
 *
 * Provides methods for executing run, validate, and parse operations
 * on a remote TSpec proxy server.
 */
export declare class ProxyClient {
    private client;
    private baseUrl;
    /**
     * Create a new ProxyClient
     *
     * @param options - Client configuration options
     */
    constructor(options: ProxyClientOptions);
    /**
     * Create a ProxyClient from a ProxyConfig
     *
     * @param config - Proxy configuration from tspec.config.json
     * @returns ProxyClient instance
     */
    static fromConfig(config: ProxyConfig): ProxyClient;
    /**
     * Execute tests on the proxy server
     *
     * @param files - Array of file paths to execute
     * @param fileContents - Map of file path to content (optional, will read if not provided)
     * @param options - Run options
     * @returns Run result
     */
    executeRun(files: string[], fileContents?: Record<string, string>, options?: ProxyRunOptions): Promise<ProxyResult<ProxyRunResponse>>;
    /**
     * Validate test files on the proxy server
     *
     * @param files - Array of file paths to validate
     * @param fileContents - Map of file path to content (optional, will read if not provided)
     * @returns Validate result
     */
    executeValidate(files: string[], fileContents?: Record<string, string>): Promise<ProxyResult<ProxyValidateResponse>>;
    /**
     * Parse test files on the proxy server
     *
     * @param files - Array of file paths to parse
     * @param fileContents - Map of file path to content (optional, will read if not provided)
     * @param options - Parse options
     * @returns Parse result
     */
    executeParse(files: string[], fileContents?: Record<string, string>, options?: ProxyRequestOptions): Promise<ProxyResult<ProxyParseResponse>>;
    /**
     * Check proxy server health
     *
     * @returns True if server is reachable
     */
    healthCheck(): Promise<boolean>;
    /**
     * Make a POST request to the proxy server
     */
    private post;
    /**
     * Handle axios request errors
     */
    private handleRequestError;
}
