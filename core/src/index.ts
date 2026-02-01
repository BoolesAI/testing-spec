// Core module exports
// Re-export all sub-modules for unified access

export * from './parser/index.js';
export * from './runner/index.js';
export * from './assertion/index.js';
export * from './scheduler/index.js';
export * from './suite-runner/index.js';
export * from './plugin/index.js';

// Named module exports for explicit namespace access
export * as parserModule from './parser/index.js';
export * as runnerModule from './runner/index.js';
export * as assertionModule from './assertion/index.js';
export * as schedulerModule from './scheduler/index.js';
export * as suiteRunnerModule from './suite-runner/index.js';
export * as pluginModule from './plugin/index.js';

// Core version for plugin compatibility
export const version = '1.2.0';
