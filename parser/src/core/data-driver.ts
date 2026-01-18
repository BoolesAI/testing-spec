import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { TSpec } from './parser.js';

export type DataFormat = 'csv' | 'json' | 'yaml' | 'yml';
export type DataRow = Record<string, string>;

export interface ParameterizedSpec extends TSpec {
  _dataRowIndex?: number;
  _dataRow?: DataRow;
}

export function parseCSV(content: string): DataRow[] {
  const lines = content.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }
  
  const headers = parseCSVLine(lines[0]);
  
  const rows: DataRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: DataRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

export function parseJSON(content: string): DataRow[] {
  const data = JSON.parse(content) as DataRow | DataRow[];
  return Array.isArray(data) ? data : [data];
}

export function parseYAML(content: string): DataRow[] {
  const data = yaml.load(content) as DataRow | DataRow[];
  return Array.isArray(data) ? data : [data];
}

export function loadDataFile(filePath: string, format: string): DataRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  switch (format.toLowerCase()) {
    case 'csv':
      return parseCSV(content);
    case 'json':
      return parseJSON(content);
    case 'yaml':
    case 'yml':
      return parseYAML(content);
    default:
      throw new Error(`Unsupported data format: ${format}`);
  }
}

export function detectFormat(filePath: string): DataFormat {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.csv':
      return 'csv';
    case '.json':
      return 'json';
    case '.yaml':
    case '.yml':
      return 'yaml';
    default:
      return 'csv';
  }
}

export function generateParameterizedCases(spec: TSpec, baseDir: string): ParameterizedSpec[] {
  const dataConfig = spec.data;
  
  if (!dataConfig || !dataConfig.source) {
    return [spec as ParameterizedSpec];
  }
  
  const sourcePath = path.resolve(baseDir, dataConfig.source);
  const format = dataConfig.format || detectFormat(sourcePath);
  
  const dataRows = loadDataFile(sourcePath, format);
  
  if (dataRows.length === 0) {
    return [spec as ParameterizedSpec];
  }
  
  const driver = dataConfig.driver || 'parameterized';
  
  if (driver === 'parameterized') {
    return dataRows.map((row, index) => {
      const caseSpec = JSON.parse(JSON.stringify(spec)) as ParameterizedSpec;
      
      caseSpec.variables = {
        ...caseSpec.variables,
        ...row
      };
      
      caseSpec._dataRowIndex = index;
      caseSpec._dataRow = row;
      
      return caseSpec;
    });
  }
  
  const rowIndex = dataConfig.current_row || 0;
  if (rowIndex >= 0 && rowIndex < dataRows.length) {
    const caseSpec = JSON.parse(JSON.stringify(spec)) as ParameterizedSpec;
    caseSpec.variables = {
      ...caseSpec.variables,
      ...dataRows[rowIndex]
    };
    caseSpec._dataRowIndex = rowIndex;
    caseSpec._dataRow = dataRows[rowIndex];
    return [caseSpec];
  }
  
  return [spec as ParameterizedSpec];
}

export function getDataPreview(filePath: string, format: string, limit = 5): DataRow[] {
  const data = loadDataFile(filePath, format);
  return data.slice(0, limit);
}
