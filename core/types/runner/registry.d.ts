import type { RunnerOptions, TestRunner } from './types.js';
export type ExecutorType = 'http' | 'grpc' | 'graphql' | 'websocket';
export interface ExecutorConstructor {
    new (options: RunnerOptions): TestRunner;
}
export declare class ExecutorRegistry {
    private executors;
    register(type: ExecutorType, executorClass: ExecutorConstructor): void;
    create(type: ExecutorType, options?: RunnerOptions): TestRunner;
    has(type: ExecutorType): boolean;
    getTypeFromExtension(filePath: string): ExecutorType | null;
    getRegisteredTypes(): ExecutorType[];
}
export declare const registry: ExecutorRegistry;
