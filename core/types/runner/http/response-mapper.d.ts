import type { AxiosResponse } from 'axios';
import type { Response } from '../../assertion/types.js';
export declare function mapAxiosResponse(axiosResponse: AxiosResponse, duration: number): Response;
export declare function createErrorResponse(error: Error, duration: number): Response;
