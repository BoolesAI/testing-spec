import { describe, it, expect } from 'vitest';
import { createRunner } from '../../src/runner/index.js';
import { registry } from '../../src/runner/registry.js';

describe('runner/index', () => {
  describe('createRunner', () => {
    it('should create HTTP runner', () => {
      const runner = createRunner('http');
      expect(runner).toBeDefined();
      expect(typeof runner.execute).toBe('function');
    });

    it('should throw error for null protocol', () => {
      expect(() => createRunner(null)).toThrow('Protocol is required');
    });

    it('should throw error for unregistered protocol', () => {
      expect(() => createRunner('unknown' as any)).toThrow('No executor registered for protocol: unknown');
    });

    it('should pass options to runner', () => {
      const runner = createRunner('http', { timeout: 5000 });
      expect(runner).toBeDefined();
    });
  });

  describe('registry', () => {
    it('should have http executor registered', () => {
      expect(registry.has('http')).toBe(true);
    });

    it('should not have unregistered executors', () => {
      expect(registry.has('grpc' as any)).toBe(false);
      expect(registry.has('graphql' as any)).toBe(false);
    });
  });
});
