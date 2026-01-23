import type { TSpec } from './types.js';
export type DataFormat = 'csv' | 'json' | 'yaml' | 'yml';
export type DataRow = Record<string, string>;
export interface ParameterizedSpec extends TSpec {
    _dataRowIndex?: number;
    _dataRow?: DataRow;
}
export declare function parseCSV(content: string): DataRow[];
export declare function parseJSON(content: string): DataRow[];
export declare function parseYAML(content: string): DataRow[];
export declare function loadDataFile(filePath: string, format: string): DataRow[];
export declare function detectFormat(filePath: string): DataFormat;
export declare function generateParameterizedCases(spec: TSpec, baseDir: string): ParameterizedSpec[];
export declare function getDataPreview(filePath: string, format: string, limit?: number): DataRow[];
