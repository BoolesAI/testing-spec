/**
 * TSpec Proxy Client
 * 
 * HTTP client for communicating with TSpec proxy servers.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { 
  ProxyConfig, 
  expandProxyHeaders 
} from '../plugin/config.js';
import {
  ProxyRunRequest,
  ProxyRunResponse,
  ProxyValidateRequest,
  ProxyValidateResponse,
  ProxyParseRequest,
  ProxyParseResponse,
  ProxyError,
  ProxyErrorCode,
  createProxyError,
  ProxyRunOptions,
  ProxyRequestOptions
} from './types.js';
import { readTestFiles, ReadFilesResult } from './file-reader.js';

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
export class ProxyClient {
  private client: AxiosInstance;
  private baseUrl: string;
  
  /**
   * Create a new ProxyClient
   * 
   * @param options - Client configuration options
   */
  constructor(options: ProxyClientOptions) {
    this.baseUrl = options.url.replace(/\/$/, ''); // Remove trailing slash
    
    const headers = options.headers 
      ? expandProxyHeaders(options.headers)
      : {};
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: options.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      // Don't throw on non-2xx status codes
      validateStatus: () => true
    });
  }
  
  /**
   * Create a ProxyClient from a ProxyConfig
   * 
   * @param config - Proxy configuration from tspec.config.json
   * @returns ProxyClient instance
   */
  static fromConfig(config: ProxyConfig): ProxyClient {
    return new ProxyClient({
      url: config.url,
      timeout: config.timeout,
      headers: config.headers
    });
  }
  
  /**
   * Execute tests on the proxy server
   * 
   * @param files - Array of file paths to execute
   * @param fileContents - Map of file path to content (optional, will read if not provided)
   * @param options - Run options
   * @returns Run result
   */
  async executeRun(
    files: string[],
    fileContents?: Record<string, string>,
    options?: ProxyRunOptions
  ): Promise<ProxyResult<ProxyRunResponse>> {
    // Read files if contents not provided
    let contents = fileContents;
    if (!contents) {
      const result = readTestFiles(files);
      if (result.errors.length > 0) {
        return {
          success: false,
          error: createProxyError(
            'PROXY_VALIDATION_ERROR',
            'Failed to read test files',
            result.errors.map(e => `${e.file}: ${e.error}`).join('; ')
          )
        };
      }
      contents = result.fileContents;
    }
    
    const request: ProxyRunRequest = {
      files,
      fileContents: contents,
      options
    };
    
    return this.post<ProxyRunResponse>('/run', request);
  }
  
  /**
   * Validate test files on the proxy server
   * 
   * @param files - Array of file paths to validate
   * @param fileContents - Map of file path to content (optional, will read if not provided)
   * @returns Validate result
   */
  async executeValidate(
    files: string[],
    fileContents?: Record<string, string>
  ): Promise<ProxyResult<ProxyValidateResponse>> {
    // Read files if contents not provided
    let contents = fileContents;
    if (!contents) {
      const result = readTestFiles(files);
      if (result.errors.length > 0) {
        return {
          success: false,
          error: createProxyError(
            'PROXY_VALIDATION_ERROR',
            'Failed to read test files',
            result.errors.map(e => `${e.file}: ${e.error}`).join('; ')
          )
        };
      }
      contents = result.fileContents;
    }
    
    const request: ProxyValidateRequest = {
      files,
      fileContents: contents
    };
    
    return this.post<ProxyValidateResponse>('/validate', request);
  }
  
  /**
   * Parse test files on the proxy server
   * 
   * @param files - Array of file paths to parse
   * @param fileContents - Map of file path to content (optional, will read if not provided)
   * @param options - Parse options
   * @returns Parse result
   */
  async executeParse(
    files: string[],
    fileContents?: Record<string, string>,
    options?: ProxyRequestOptions
  ): Promise<ProxyResult<ProxyParseResponse>> {
    // Read files if contents not provided
    let contents = fileContents;
    if (!contents) {
      const result = readTestFiles(files);
      if (result.errors.length > 0) {
        return {
          success: false,
          error: createProxyError(
            'PROXY_VALIDATION_ERROR',
            'Failed to read test files',
            result.errors.map(e => `${e.file}: ${e.error}`).join('; ')
          )
        };
      }
      contents = result.fileContents;
    }
    
    const request: ProxyParseRequest = {
      files,
      fileContents: contents,
      options
    };
    
    return this.post<ProxyParseResponse>('/parse', request);
  }
  
  /**
   * Check proxy server health
   * 
   * @returns True if server is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status >= 200 && response.status < 300;
    } catch {
      return false;
    }
  }
  
  /**
   * Make a POST request to the proxy server
   */
  private async post<T>(
    endpoint: string,
    data: unknown
  ): Promise<ProxyResult<T>> {
    try {
      const response = await this.client.post(endpoint, data);
      
      // Handle HTTP error status codes
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: createProxyError(
            'PROXY_AUTH_ERROR',
            `Authentication failed: ${response.status} ${response.statusText}`,
            'Check your proxy authentication headers and tokens'
          )
        };
      }
      
      if (response.status >= 400 && response.status < 500) {
        const errorData = response.data as { error?: ProxyError; message?: string };
        return {
          success: false,
          error: errorData.error ?? createProxyError(
            'PROXY_VALIDATION_ERROR',
            errorData.message ?? `Request failed: ${response.status}`,
            JSON.stringify(response.data)
          )
        };
      }
      
      if (response.status >= 500) {
        const errorData = response.data as { error?: ProxyError; message?: string };
        return {
          success: false,
          error: errorData.error ?? createProxyError(
            'PROXY_EXECUTION_ERROR',
            errorData.message ?? `Server error: ${response.status}`,
            JSON.stringify(response.data)
          )
        };
      }
      
      // Success response
      const responseData = response.data as T;
      return {
        success: true,
        data: responseData
      };
      
    } catch (err) {
      return this.handleRequestError(err);
    }
  }
  
  /**
   * Handle axios request errors
   */
  private handleRequestError<T>(err: unknown): ProxyResult<T> {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError;
      
      // Timeout error
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return {
          success: false,
          error: createProxyError(
            'PROXY_TIMEOUT',
            `Request timeout after ${this.client.defaults.timeout}ms`,
            `Proxy URL: ${this.baseUrl}`
          )
        };
      }
      
      // Connection error
      if (axiosError.code === 'ECONNREFUSED' || 
          axiosError.code === 'ENOTFOUND' ||
          axiosError.code === 'ENETUNREACH') {
        return {
          success: false,
          error: createProxyError(
            'PROXY_CONNECTION_ERROR',
            `Cannot connect to proxy server: ${axiosError.code}`,
            `Proxy URL: ${this.baseUrl}`
          )
        };
      }
      
      // Other axios errors
      return {
        success: false,
        error: createProxyError(
          'PROXY_CONNECTION_ERROR',
          axiosError.message,
          `Proxy URL: ${this.baseUrl}`
        )
      };
    }
    
    // Non-axios errors
    return {
      success: false,
      error: createProxyError(
        'PROXY_EXECUTION_ERROR',
        (err as Error).message ?? 'Unknown error',
        String(err)
      )
    };
  }
}
