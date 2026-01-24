import { describe, it, expect } from 'vitest';
import { compareValues } from '../../src/assertion/operators.js';
import type { ComparisonOperator } from '../../src/assertion/types.js';

describe('operators', () => {
  describe('compareValues', () => {
    describe('equals operator', () => {
      it('should compare primitive values', () => {
        expect(compareValues(5, 'equals', 5)).toBe(true);
        expect(compareValues('test', 'equals', 'test')).toBe(true);
        expect(compareValues(true, 'equals', true)).toBe(true);
        expect(compareValues(5, 'equals', 6)).toBe(false);
      });

      it('should compare objects by JSON stringify', () => {
        expect(compareValues({ a: 1 }, 'equals', { a: 1 })).toBe(true);
        expect(compareValues({ a: 1 }, 'equals', { a: 2 })).toBe(false);
      });

      it('should work with eq alias', () => {
        expect(compareValues(5, 'eq', 5)).toBe(true);
        expect(compareValues(5, 'eq', 6)).toBe(false);
      });
    });

    describe('not_equals operator', () => {
      it('should check inequality', () => {
        expect(compareValues(5, 'not_equals', 6)).toBe(true);
        expect(compareValues(5, 'not_equals', 5)).toBe(false);
      });

      it('should work with neq alias', () => {
        expect(compareValues(5, 'neq', 6)).toBe(true);
        expect(compareValues(5, 'neq', 5)).toBe(false);
      });
    });

    describe('exists operator', () => {
      it('should check if value exists', () => {
        expect(compareValues('test', 'exists', undefined)).toBe(true);
        expect(compareValues(0, 'exists', undefined)).toBe(true);
        expect(compareValues(false, 'exists', undefined)).toBe(true);
        expect(compareValues(undefined, 'exists', undefined)).toBe(false);
        expect(compareValues(null, 'exists', undefined)).toBe(false);
      });
    });

    describe('not_exists operator', () => {
      it('should check if value does not exist', () => {
        expect(compareValues(undefined, 'not_exists', undefined)).toBe(true);
        expect(compareValues(null, 'not_exists', undefined)).toBe(true);
        expect(compareValues('test', 'not_exists', undefined)).toBe(false);
        expect(compareValues(0, 'not_exists', undefined)).toBe(false);
      });
    });

    describe('not_empty operator', () => {
      it('should check if string is not empty', () => {
        expect(compareValues('test', 'not_empty', undefined)).toBe(true);
        expect(compareValues('', 'not_empty', undefined)).toBe(false);
      });

      it('should check if array is not empty', () => {
        expect(compareValues([1, 2], 'not_empty', undefined)).toBe(true);
        expect(compareValues([], 'not_empty', undefined)).toBe(false);
      });

      it('should check if value is not undefined/null', () => {
        expect(compareValues(0, 'not_empty', undefined)).toBe(true);
        expect(compareValues(undefined, 'not_empty', undefined)).toBe(false);
        expect(compareValues(null, 'not_empty', undefined)).toBe(false);
      });
    });

    describe('contains operator', () => {
      it('should check if string contains substring', () => {
        expect(compareValues('hello world', 'contains', 'world')).toBe(true);
        expect(compareValues('hello world', 'contains', 'xyz')).toBe(false);
      });

      it('should check if array contains value', () => {
        expect(compareValues([1, 2, 3], 'contains', 2)).toBe(true);
        expect(compareValues([1, 2, 3], 'contains', 4)).toBe(false);
      });

      it('should return false for non-string and non-array', () => {
        expect(compareValues(123, 'contains', 12)).toBe(false);
      });
    });

    describe('not_contains operator', () => {
      it('should check if string does not contain substring', () => {
        expect(compareValues('hello world', 'not_contains', 'xyz')).toBe(true);
        expect(compareValues('hello world', 'not_contains', 'world')).toBe(false);
      });

      it('should check if array does not contain value', () => {
        expect(compareValues([1, 2, 3], 'not_contains', 4)).toBe(true);
        expect(compareValues([1, 2, 3], 'not_contains', 2)).toBe(false);
      });
    });

    describe('matches operator', () => {
      it('should match regex pattern', () => {
        expect(compareValues('test123', 'matches', '^test\\d+$')).toBe(true);
        expect(compareValues('test', 'matches', '^test\\d+$')).toBe(false);
      });

      it('should return false for non-string', () => {
        expect(compareValues(123, 'matches', '\\d+')).toBe(false);
      });
    });

    describe('comparison operators', () => {
      it('should compare with gt', () => {
        expect(compareValues(10, 'gt', 5)).toBe(true);
        expect(compareValues(5, 'gt', 10)).toBe(false);
        expect(compareValues(5, 'gt', 5)).toBe(false);
      });

      it('should compare with gte', () => {
        expect(compareValues(10, 'gte', 5)).toBe(true);
        expect(compareValues(5, 'gte', 5)).toBe(true);
        expect(compareValues(5, 'gte', 10)).toBe(false);
      });

      it('should compare with lt', () => {
        expect(compareValues(5, 'lt', 10)).toBe(true);
        expect(compareValues(10, 'lt', 5)).toBe(false);
        expect(compareValues(5, 'lt', 5)).toBe(false);
      });

      it('should compare with lte', () => {
        expect(compareValues(5, 'lte', 10)).toBe(true);
        expect(compareValues(5, 'lte', 5)).toBe(true);
        expect(compareValues(10, 'lte', 5)).toBe(false);
      });

      it('should handle string numbers', () => {
        expect(compareValues('10', 'gt', '5')).toBe(true);
        expect(compareValues('5', 'lt', '10')).toBe(true);
      });
    });

    describe('type operator', () => {
      it('should check type of value', () => {
        expect(compareValues('test', 'type', 'string')).toBe(true);
        expect(compareValues(123, 'type', 'number')).toBe(true);
        expect(compareValues(true, 'type', 'boolean')).toBe(true);
        expect(compareValues({}, 'type', 'object')).toBe(true);
        expect(compareValues('test', 'type', 'number')).toBe(false);
      });
    });

    describe('length operator', () => {
      it('should check string length', () => {
        expect(compareValues('hello', 'length', 5)).toBe(true);
        expect(compareValues('hello', 'length', 3)).toBe(false);
      });

      it('should check array length', () => {
        expect(compareValues([1, 2, 3], 'length', 3)).toBe(true);
        expect(compareValues([1, 2, 3], 'length', 5)).toBe(false);
      });

      it('should return false for non-string and non-array', () => {
        expect(compareValues(123, 'length', 3)).toBe(false);
      });
    });

    describe('unknown operator', () => {
      it('should throw error for unknown operator', () => {
        expect(() => compareValues(5, 'invalid' as ComparisonOperator, 5))
          .toThrow('Unknown operator: invalid');
      });
    });
  });
});
