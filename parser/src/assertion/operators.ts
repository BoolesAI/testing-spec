import type { ComparisonOperator } from './types.js';

export function compareValues(actual: unknown, operator: ComparisonOperator, expected: unknown): boolean {
  switch (operator) {
    case 'equals':
    case 'eq':
      return actual === expected || JSON.stringify(actual) === JSON.stringify(expected);
    
    case 'not_equals':
    case 'neq':
      return actual !== expected;
    
    case 'exists':
      return actual !== undefined && actual !== null;
    
    case 'not_exists':
      return actual === undefined || actual === null;
    
    case 'not_empty':
      if (typeof actual === 'string') return actual.length > 0;
      if (Array.isArray(actual)) return actual.length > 0;
      return actual !== undefined && actual !== null;
    
    case 'contains':
      if (typeof actual === 'string') return actual.includes(expected as string);
      if (Array.isArray(actual)) return actual.includes(expected);
      return false;
    
    case 'not_contains':
      if (typeof actual === 'string') return !actual.includes(expected as string);
      if (Array.isArray(actual)) return !actual.includes(expected);
      return true;
    
    case 'matches':
      if (typeof actual !== 'string') return false;
      const regex = new RegExp(expected as string);
      return regex.test(actual);
    
    case 'gt':
      return Number(actual) > Number(expected);
    
    case 'gte':
      return Number(actual) >= Number(expected);
    
    case 'lt':
      return Number(actual) < Number(expected);
    
    case 'lte':
      return Number(actual) <= Number(expected);
    
    case 'type':
      return typeof actual === expected;
    
    case 'length':
      if (typeof actual === 'string' || Array.isArray(actual)) {
        return actual.length === Number(expected);
      }
      return false;
    
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}
