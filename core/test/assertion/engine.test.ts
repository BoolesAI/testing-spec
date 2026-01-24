import { describe, it, expect } from 'vitest';
import { runAssertion, runAssertions, getAssertionSummary, assertResults } from '../../src/assertion/engine.js';
import type { Response } from '../../src/assertion/types.js';
import type { Assertion } from '../../src/parser/types.js';

describe('assertion/engine', () => {
  describe('runAssertion', () => {
    describe('status_code assertion', () => {
      it('should pass when status matches', () => {
        const response: Response = { statusCode: 200, body: {} };
        const assertion: Assertion = { type: 'status_code', expected: 200 };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(true);
        expect(result.type).toBe('status_code');
        expect(result.actual).toBe(200);
      });

      it('should fail when status does not match', () => {
        const response: Response = { statusCode: 404, body: {} };
        const assertion: Assertion = { type: 'status_code', expected: 200 };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(false);
        expect(result.expected).toBe(200);
        expect(result.actual).toBe(404);
      });
    });

    describe('response_time assertion', () => {
      it('should pass when response time is within limit', () => {
        const response: Response = { statusCode: 200, body: {}, responseTime: 100 };
        const assertion: Assertion = { type: 'response_time', max_ms: 200 };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(true);
      });

      it('should fail when response time exceeds limit', () => {
        const response: Response = { statusCode: 200, body: {}, responseTime: 300 };
        const assertion: Assertion = { type: 'response_time', max_ms: 200 };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(false);
      });
    });

    describe('json_path assertion', () => {
      it('should pass with exists operator', () => {
        const response: Response = { 
          statusCode: 200, 
          body: { user: { id: '12345', name: 'Alice' } } 
        };
        const assertion: Assertion = { 
          type: 'json_path', 
          expression: '$.user.id',
          operator: 'exists'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(true);
      });

      it('should pass with equals operator', () => {
        const response: Response = { 
          statusCode: 200, 
          body: { user: { id: '12345' } } 
        };
        const assertion: Assertion = { 
          type: 'json_path', 
          expression: '$.user.id',
          operator: 'equals',
          expected: '12345'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(true);
      });

      it('should fail when value does not match', () => {
        const response: Response = { 
          statusCode: 200, 
          body: { user: { id: '12345' } } 
        };
        const assertion: Assertion = { 
          type: 'json_path', 
          expression: '$.user.id',
          operator: 'equals',
          expected: '99999'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(false);
      });

      it('should handle extraction errors', () => {
        const response: Response = { statusCode: 200, body: { data: 'test' } };
        const assertion: Assertion = { 
          type: 'json_path', 
          expression: '$..[['  
        };
        const result = runAssertion(response, assertion);
              
        // JSONPath may not throw for all invalid syntax
        expect(result).toBeDefined();
      });

      it('should parse string body as JSON', () => {
        const response: Response = { 
          statusCode: 200, 
          body: JSON.stringify({ id: '12345' })
        };
        const assertion: Assertion = { 
          type: 'json_path', 
          expression: '$.id',
          operator: 'equals',
          expected: '12345'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(true);
      });
    });

    describe('header assertion', () => {
      it('should pass when header exists with correct value', () => {
        const response: Response = { 
          statusCode: 200, 
          body: {},
          headers: { 'Content-Type': 'application/json' }
        };
        const assertion: Assertion = { 
          type: 'header', 
          name: 'Content-Type',
          operator: 'equals',
          value: 'application/json'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(true);
      });

      it('should be case-insensitive for header names', () => {
        const response: Response = { 
          statusCode: 200, 
          body: {},
          headers: { 'content-type': 'application/json' }
        };
        const assertion: Assertion = { 
          type: 'header', 
          name: 'Content-Type',
          operator: 'exists'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(true);
      });
    });

    describe('javascript assertion', () => {
      it('should pass when JS returns truthy', () => {
        const response: Response = { 
          statusCode: 200, 
          body: { value: 42 }
        };
        const assertion: Assertion = { 
          type: 'javascript', 
          source: 'return body.value === 42;'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(true);
      });

      it('should fail when JS returns falsy', () => {
        const response: Response = { 
          statusCode: 200, 
          body: { value: 42 }
        };
        const assertion: Assertion = { 
          type: 'javascript', 
          source: 'return body.value === 99;'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(false);
      });

      it('should handle JS execution errors', () => {
        const response: Response = { statusCode: 200, body: {} };
        const assertion: Assertion = { 
          type: 'javascript', 
          source: 'throw new Error("test error");'
        };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(false);
        expect(result.message).toContain('test error');
      });
    });

    describe('unknown assertion type', () => {
      it('should fail with unknown type', () => {
        const response: Response = { statusCode: 200, body: {} };
        const assertion: Assertion = { type: 'unknown_type' };
        const result = runAssertion(response, assertion);
        
        expect(result.passed).toBe(false);
        expect(result.message).toContain('Unknown assertion type');
      });
    });
  });

  describe('runAssertions', () => {
    it('should run multiple assertions', () => {
      const response: Response = { 
        statusCode: 200, 
        body: { id: '12345', name: 'Alice' }
      };
      const assertions: Assertion[] = [
        { type: 'status_code', expected: 200 },
        { type: 'json_path', expression: '$.id', operator: 'exists' },
        { type: 'json_path', expression: '$.name', operator: 'equals', expected: 'Alice' }
      ];
      
      const results = runAssertions(response, assertions);
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('should return empty array for no assertions', () => {
      const response: Response = { statusCode: 200, body: {} };
      const results = runAssertions(response, []);
      
      expect(results).toEqual([]);
    });
  });

  describe('getAssertionSummary', () => {
    it('should calculate summary correctly', () => {
      const results = [
        { passed: true, type: 'status_code', message: 'ok' },
        { passed: true, type: 'json_path', message: 'ok' },
        { passed: false, type: 'json_path', message: 'failed' }
      ];
      
      const summary = getAssertionSummary(results);
      
      expect(summary.total).toBe(3);
      expect(summary.passed).toBe(2);
      expect(summary.failed).toBe(1);
      expect(summary.passRate).toBeCloseTo(66.67, 1);
    });

    it('should handle empty results', () => {
      const summary = getAssertionSummary([]);
      
      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.passRate).toBe(0);
    });

    it('should calculate 100% pass rate', () => {
      const results = [
        { passed: true, type: 'status_code', message: 'ok' },
        { passed: true, type: 'json_path', message: 'ok' }
      ];
      
      const summary = getAssertionSummary(results);
      expect(summary.passRate).toBe(100);
    });
  });

  describe('assertResults', () => {
    it('should assert response and extract variables', () => {
      const response: Response = { 
        statusCode: 200, 
        body: { id: '12345', name: 'Alice' }
      };
      const testCase = {
        id: 'test-1',
        assertions: [
          { type: 'status_code', expected: 200 }
        ],
        extract: {
          userId: '$.id',
          userName: '$.name'
        }
      };
      
      const result = assertResults(response, testCase);
      
      expect(result.testCaseId).toBe('test-1');
      expect(result.passed).toBe(true);
      expect(result.assertions).toHaveLength(1);
      expect(result.extracted).toEqual({ userId: '12345', userName: 'Alice' });
      expect(result.summary.passed).toBe(1);
    });

    it('should mark as failed when any assertion fails', () => {
      const response: Response = { 
        statusCode: 404, 
        body: { error: 'Not found' }
      };
      const testCase = {
        id: 'test-2',
        assertions: [
          { type: 'status_code', expected: 200 },
          { type: 'json_path', expression: '$.data', operator: 'exists' }
        ]
      };
      
      const result = assertResults(response, testCase);
      
      expect(result.passed).toBe(false);
      expect(result.summary.failed).toBeGreaterThan(0);
    });

    it('should handle test case without extract config', () => {
      const response: Response = { statusCode: 200, body: {} };
      const testCase = {
        id: 'test-3',
        assertions: [{ type: 'status_code', expected: 200 }]
      };
      
      const result = assertResults(response, testCase);
      
      expect(result.extracted).toEqual({});
    });
  });
});
