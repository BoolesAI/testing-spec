import type { HttpRequest } from '../../parser/types.js';
import type { AxiosRequestConfig } from 'axios';
export interface BuildRequestOptions {
    timeout?: number;
    headers?: Record<string, string>;
}
export declare function buildAxiosConfig(request: HttpRequest, options?: BuildRequestOptions): AxiosRequestConfig;
export declare function buildUrl(request: HttpRequest): string;
