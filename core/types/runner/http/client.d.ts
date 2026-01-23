import type { TestCase } from '../../parser/index.js';
import type { Response } from '../../assertion/types.js';
import type { TestRunner, HttpRunnerOptions } from '../types.js';
export declare class HttpRunner implements TestRunner {
    private client;
    private options;
    constructor(options?: HttpRunnerOptions);
    execute(testCase: TestCase): Promise<Response>;
}
