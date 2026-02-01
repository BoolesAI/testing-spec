import { describe, it, expect } from 'vitest';
import { getTypeFromFilePath, parseTestCasesFromString } from '../../src/parser/index.js';

describe('parser/index', () => {
  describe('getTypeFromFilePath', () => {
    it('should extract http type', () => {
      expect(getTypeFromFilePath('/path/to/test.http.tcase')).toBe('http');
      expect(getTypeFromFilePath('test.HTTP.tcase')).toBe('http');
    });

    it('should extract grpc type', () => {
      expect(getTypeFromFilePath('/path/to/test.grpc.tcase')).toBe('grpc');
      expect(getTypeFromFilePath('test.GRPC.tcase')).toBe('grpc');
    });

    it('should extract graphql type', () => {
      expect(getTypeFromFilePath('/path/to/test.graphql.tcase')).toBe('graphql');
      expect(getTypeFromFilePath('test.GraphQL.tcase')).toBe('graphql');
    });

    it('should extract websocket type', () => {
      expect(getTypeFromFilePath('/path/to/test.websocket.tcase')).toBe('websocket');
      expect(getTypeFromFilePath('test.WebSocket.tcase')).toBe('websocket');
    });

    it('should return null for non-tcase files', () => {
      expect(getTypeFromFilePath('/path/to/test.js')).toBeNull();
      expect(getTypeFromFilePath('test.txt')).toBeNull();
    });

    it('should return null for tcase files without type', () => {
      expect(getTypeFromFilePath('/path/to/test.tcase')).toBeNull();
    });
  });

  describe('parseTestCasesFromString', () => {
    it('should parse basic HTTP test case from string', () => {
      const yaml = `
version: "1.0"
description: Test login
metadata:
  prompt: "test prompt"
  related_code: []
  test_category: functional
  risk_level: low
  tags: []
  priority: medium
  timeout: "30s"
http:
  method: POST
  path: /api/login
  body:
    username: test
    password: pass123
assertions:
  - type: status_code
    expected: 200
`;
      const testCases = parseTestCasesFromString(yaml);
      expect(testCases).toHaveLength(1);
      expect(testCases[0].description).toBe('Test login');
      expect(testCases[0].protocol).toBe('http');
      expect(testCases[0].request).toHaveProperty('method', 'POST');
      expect(testCases[0].assertions).toHaveLength(1);
    });

    it('should throw error for invalid spec', () => {
      const yaml = 'invalid: yaml';
      expect(() => parseTestCasesFromString(yaml)).toThrow('Invalid tspec content');
    });

    it('should replace variables in test case', () => {
      const yaml = `
version: "1.0"
description: Test with variables
metadata:
  prompt: "test"
  related_code: []
  test_category: functional
  risk_level: low
  tags: []
  priority: medium
  timeout: "30s"
variables:
  userId: "12345"
http:
  method: GET
  path: /api/users/\${userId}
assertions:
  - type: status_code
    expected: 200
`;
      const testCases = parseTestCasesFromString(yaml);
      expect(testCases).toHaveLength(1);
      expect(testCases[0].request).toHaveProperty('path', '/api/users/12345');
    });

    it('should generate unique ID for inline test case', () => {
      const yaml = `
version: "1.0"
description: Test
metadata:
  prompt: "test"
  related_code: []
  test_category: functional
  risk_level: low
  tags: []
  priority: medium
  timeout: "30s"
http:
  method: GET
  path: /api/test
assertions:
  - type: status_code
    expected: 200
`;
      const testCases = parseTestCasesFromString(yaml);
      expect(testCases[0].id).toMatch(/^inline_\d+$/);
    });

    it('should pass through lifecycle config', () => {
      const yaml = `
version: "1.0"
description: Test with lifecycle
metadata:
  prompt: "test"
  related_code: []
  test_category: functional
  risk_level: low
  tags: []
  priority: medium
  timeout: "30s"
http:
  method: GET
  path: /api/users
lifecycle:
  teardown:
    - action: extract
      scope: assert
      vars:
        userId: $.data.id
assertions:
  - type: status_code
    expected: 200
`;
      const testCases = parseTestCasesFromString(yaml);
      expect(testCases[0].lifecycle).toBeDefined();
      expect(testCases[0].lifecycle?.teardown).toHaveLength(1);
      expect(testCases[0].lifecycle?.teardown?.[0].action).toBe('extract');
      expect(testCases[0].lifecycle?.teardown?.[0].scope).toBe('assert');
      expect(testCases[0].lifecycle?.teardown?.[0].vars).toEqual({ userId: '$.data.id' });
    });
  });
});
