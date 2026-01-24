import { describe, it, expect, beforeEach } from 'vitest';
import { replaceVariablesInString, replaceVariables, buildVariableContext, getBuiltinFunctions } from '../../src/parser/variables.js';
import type { VariableContext } from '../../src/parser/variables.js';

describe('variables', () => {
  let context: VariableContext;

  beforeEach(() => {
    context = {
      variables: { testVar: 'testValue', port: 8080 },
      env: { ENV_VAR: 'envValue' },
      extract: { userId: '12345' },
      params: { paramKey: 'paramValue' }
    };
  });

  describe('replaceVariablesInString', () => {
    it('should replace simple variable', () => {
      const result = replaceVariablesInString('${testVar}', context);
      expect(result).toBe('testValue');
    });

    it('should replace environment variable', () => {
      const result = replaceVariablesInString('${env.ENV_VAR}', context);
      expect(result).toBe('envValue');
    });

    it('should replace extracted variable', () => {
      const result = replaceVariablesInString('${extract.userId}', context);
      expect(result).toBe('12345');
    });

    it('should replace param variable', () => {
      const result = replaceVariablesInString('${paramKey}', context);
      expect(result).toBe('paramValue');
    });

    it('should handle default value with pipe', () => {
      const result = replaceVariablesInString('${missingVar|defaultValue}', context);
      expect(result).toBe('defaultValue');
    });

    it('should replace multiple variables in string', () => {
      const result = replaceVariablesInString('http://localhost:${port}/users/${extract.userId}', context);
      expect(result).toBe('http://localhost:8080/users/12345');
    });

    it('should handle builtin function timestamp', () => {
      const result = replaceVariablesInString('${timestamp}', context);
      expect(result).toMatch(/^\d+$/);
    });

    it('should handle builtin function uuid', () => {
      const result = replaceVariablesInString('${uuid}', context);
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should handle builtin function random_int', () => {
      const result = replaceVariablesInString('${random_int(1, 10)}', context);
      const num = parseInt(result);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });

    it('should handle builtin function now', () => {
      const result = replaceVariablesInString('${now(yyyy-MM-dd)}', context);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return empty string for non-existent variable', () => {
      const result = replaceVariablesInString('${nonExistent}', context);
      expect(result).toBe('');
    });

    it('should not replace if not a string', () => {
      const result = replaceVariablesInString(123 as any, context);
      expect(result).toBe(123);
    });
  });

  describe('replaceVariables', () => {
    it('should replace variables in object', () => {
      const obj = {
        url: '${env.ENV_VAR}',
        port: '${port}',
        nested: {
          userId: '${extract.userId}'
        }
      };
      const result = replaceVariables(obj, context);
      expect(result).toEqual({
        url: 'envValue',
        port: '8080',
        nested: {
          userId: '12345'
        }
      });
    });

    it('should replace variables in array', () => {
      const arr = ['${testVar}', '${port}', '${extract.userId}'];
      const result = replaceVariables(arr, context);
      expect(result).toEqual(['testValue', '8080', '12345']);
    });

    it('should handle null and undefined', () => {
      expect(replaceVariables(null, context)).toBeNull();
      expect(replaceVariables(undefined, context)).toBeUndefined();
    });

    it('should handle primitive types', () => {
      expect(replaceVariables('test', context)).toBe('test');
      expect(replaceVariables(123, context)).toBe(123);
      expect(replaceVariables(true, context)).toBe(true);
    });

    it('should replace nested structures', () => {
      const complex = {
        array: ['${testVar}', { key: '${port}' }],
        object: { nested: ['${extract.userId}'] }
      };
      const result = replaceVariables(complex, context);
      expect(result).toEqual({
        array: ['testValue', { key: '8080' }],
        object: { nested: ['12345'] }
      });
    });
  });

  describe('buildVariableContext', () => {
    it('should build context from spec', () => {
      const spec: any = {
        variables: { var1: 'value1' },
        environment: { variables: { env1: 'envValue1' } },
        data: { variables: { data1: 'dataValue1' } }
      };
      const result = buildVariableContext(spec, { param1: 'paramValue1' }, { extract1: 'extractValue1' });
      
      expect(result.variables).toEqual({ var1: 'value1', data1: 'dataValue1' });
      expect(result.env).toEqual({ env1: 'envValue1' });
      expect(result.params).toEqual({ param1: 'paramValue1' });
      expect(result.extract).toEqual({ extract1: 'extractValue1' });
    });

    it('should handle spec without optional fields', () => {
      const spec: any = { description: 'test' };
      const result = buildVariableContext(spec);
      
      expect(result.variables).toEqual({});
      expect(result.env).toEqual({});
      expect(result.params).toEqual({});
      expect(result.extract).toEqual({});
    });

    it('should merge spec variables with data variables', () => {
      const spec: any = {
        variables: { var1: 'value1' },
        data: { variables: { var2: 'value2', var1: 'overridden' } }
      };
      const result = buildVariableContext(spec);
      
      expect(result.variables).toEqual({ var1: 'overridden', var2: 'value2' });
    });
  });

  describe('getBuiltinFunctions', () => {
    it('should return list of builtin functions', () => {
      const functions = getBuiltinFunctions();
      expect(functions).toContain('timestamp');
      expect(functions).toContain('uuid');
      expect(functions).toContain('random_int');
      expect(functions).toContain('now');
    });

    it('should return at least 4 builtin functions', () => {
      const functions = getBuiltinFunctions();
      expect(functions.length).toBeGreaterThanOrEqual(4);
    });
  });
});
