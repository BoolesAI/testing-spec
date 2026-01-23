import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { TestCase } from '../../parser/index.js';
import type { HttpRequest } from '../../parser/types.js';
import type { Response } from '../../assertion/types.js';
import type { TestRunner, HttpRunnerOptions } from '../types.js';
import { buildAxiosConfig } from './request-builder.js';
import { mapAxiosResponse, createErrorResponse } from './response-mapper.js';

export class HttpRunner implements TestRunner {
  private client: AxiosInstance;
  private options: HttpRunnerOptions;

  constructor(options: HttpRunnerOptions = {}) {
    this.options = {
      timeout: 30000,
      followRedirects: true,
      maxRedirects: 5,
      validateStatus: () => true, // Accept all status codes
      ...options
    };

    this.client = axios.create({
      timeout: this.options.timeout,
      maxRedirects: this.options.followRedirects ? this.options.maxRedirects : 0,
      validateStatus: this.options.validateStatus
    });
  }

  async execute(testCase: TestCase): Promise<Response> {
    if (testCase.protocol !== 'http') {
      throw new Error(`HttpRunner only supports HTTP protocol, got: ${testCase.protocol}`);
    }

    const request = testCase.request as HttpRequest;
    if (!request) {
      throw new Error('No HTTP request defined in test case');
    }

    const config = buildAxiosConfig(request, {
      timeout: this.options.timeout,
      headers: this.options.headers
    });

    const startTime = Date.now();
    
    try {
      const axiosResponse = await this.client.request(config);
      const duration = Date.now() - startTime;
      return mapAxiosResponse(axiosResponse, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof AxiosError && error.response) {
        // Server responded with error status
        return mapAxiosResponse(error.response, duration);
      }
      
      // Network or other error
      return createErrorResponse(error as Error, duration);
    }
  }
}
