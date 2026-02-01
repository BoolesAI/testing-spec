import type { TestCase } from '../parser/index.js';
import type { Response } from '../assertion/types.js';
import type { RunnerOptions, TestRunner } from './types.js';

export type ExecutorType = 'http' | 'grpc' | 'graphql' | 'websocket';

export interface ExecutorConstructor {
  new (options: RunnerOptions): TestRunner;
}

export class ExecutorRegistry {
  private executors = new Map<ExecutorType, ExecutorConstructor>();

  register(type: ExecutorType, executorClass: ExecutorConstructor): void {
    this.executors.set(type, executorClass);
  }

  create(type: ExecutorType, options: RunnerOptions = {}): TestRunner {
    const ExecutorClass = this.executors.get(type);
    if (!ExecutorClass) {
      throw new Error(`No executor registered for type: ${type}`);
    }
    return new ExecutorClass(options);
  }

  has(type: ExecutorType): boolean {
    return this.executors.has(type);
  }

  getTypeFromExtension(filePath: string): ExecutorType | null {
    const match = filePath.match(/\.(http|grpc|graphql|websocket)\.tcase$/i);
    if (match) {
      return match[1].toLowerCase() as ExecutorType;
    }
    return null;
  }

  getRegisteredTypes(): ExecutorType[] {
    return Array.from(this.executors.keys());
  }
}

export const registry = new ExecutorRegistry();
