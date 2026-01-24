import { describe, it, expect, vi } from 'vitest';
import { parseCSV, parseJSON, parseYAML, detectFormat, generateParameterizedCases } from '../../src/parser/data-driver.js';
import type { DataRow } from '../../src/parser/data-driver.js';
import type { TSpec } from '../../src/parser/types.js';

describe('data-driver', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const result = parseCSV(csv);
      expect(result).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' }
      ]);
    });

    it('should handle CSV with quotes', () => {
      const csv = 'name,description\n"Alice","Test, Value"\n"Bob","Another ""quoted"" value"';
      const result = parseCSV(csv);
      expect(result).toEqual([
        { name: 'Alice', description: 'Test, Value' },
        { name: 'Bob', description: 'Another "quoted" value' }
      ]);
    });

    it('should handle empty CSV', () => {
      const csv = '';
      const result = parseCSV(csv);
      expect(result).toEqual([]);
    });

    it('should handle CSV with empty values', () => {
      const csv = 'name,age,city\nAlice,,\n,25,NYC';
      const result = parseCSV(csv);
      expect(result).toEqual([
        { name: 'Alice', age: '', city: '' },
        { name: '', age: '25', city: 'NYC' }
      ]);
    });

    it('should trim values', () => {
      const csv = 'name , age \n Alice , 30 \n Bob , 25 ';
      const result = parseCSV(csv);
      expect(result).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' }
      ]);
    });
  });

  describe('parseJSON', () => {
    it('should parse JSON array', () => {
      const json = '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]';
      const result = parseJSON(json);
      expect(result).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
    });

    it('should parse JSON object as single row', () => {
      const json = '{"name": "Alice", "age": 30}';
      const result = parseJSON(json);
      expect(result).toEqual([{ name: 'Alice', age: 30 }]);
    });

    it('should handle empty array', () => {
      const json = '[]';
      const result = parseJSON(json);
      expect(result).toEqual([]);
    });
  });

  describe('parseYAML', () => {
    it('should parse YAML array', () => {
      const yaml = '- name: Alice\n  age: 30\n- name: Bob\n  age: 25';
      const result = parseYAML(yaml);
      expect(result).toEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ]);
    });

    it('should parse YAML object as single row', () => {
      const yaml = 'name: Alice\nage: 30';
      const result = parseYAML(yaml);
      expect(result).toEqual([{ name: 'Alice', age: 30 }]);
    });
  });

  describe('detectFormat', () => {
    it('should detect CSV format', () => {
      expect(detectFormat('data.csv')).toBe('csv');
      expect(detectFormat('/path/to/data.CSV')).toBe('csv');
    });

    it('should detect JSON format', () => {
      expect(detectFormat('data.json')).toBe('json');
      expect(detectFormat('/path/to/data.JSON')).toBe('json');
    });

    it('should detect YAML format', () => {
      expect(detectFormat('data.yaml')).toBe('yaml');
      expect(detectFormat('data.yml')).toBe('yaml');
      expect(detectFormat('/path/to/data.YAML')).toBe('yaml');
    });

    it('should default to CSV for unknown extension', () => {
      expect(detectFormat('data.txt')).toBe('csv');
      expect(detectFormat('data')).toBe('csv');
    });
  });

  describe('generateParameterizedCases', () => {
    it('should return single spec when no data config', () => {
      const spec: TSpec = {
        version: '1.0',
        description: 'Test',
        metadata: {} as any,
        assertions: []
      };
      const result = generateParameterizedCases(spec, '.');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(spec);
    });

    it('should return single spec when no data source', () => {
      const spec: TSpec = {
        version: '1.0',
        description: 'Test',
        metadata: {} as any,
        assertions: [],
        data: { driver: 'parameterized' }
      };
      const result = generateParameterizedCases(spec, '.');
      expect(result).toHaveLength(1);
    });
  });
});
