import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Parse CSV string into array of objects
 * @param {string} content - CSV content
 * @returns {object[]} Array of row objects
 */
export function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {string[]} Array of values
 */
function parseCSVLine(line) {
  const values = [];
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

/**
 * Parse JSON data file
 * @param {string} content - JSON content
 * @returns {object[]} Array of data objects
 */
export function parseJSON(content) {
  const data = JSON.parse(content);
  return Array.isArray(data) ? data : [data];
}

/**
 * Parse YAML data file
 * @param {string} content - YAML content
 * @returns {object[]} Array of data objects
 */
export function parseYAML(content) {
  const data = yaml.load(content);
  return Array.isArray(data) ? data : [data];
}

/**
 * Load data from file
 * @param {string} filePath - Path to data file
 * @param {string} format - File format (csv, json, yaml)
 * @returns {object[]} Array of data objects
 */
export function loadDataFile(filePath, format) {
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

/**
 * Detect format from file extension
 * @param {string} filePath 
 * @returns {string}
 */
export function detectFormat(filePath) {
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

/**
 * Generate parameterized test cases from data source
 * @param {object} spec - Parsed spec object
 * @param {string} baseDir - Base directory for resolving data file paths
 * @returns {object[]} Array of spec objects with data applied
 */
export function generateParameterizedCases(spec, baseDir) {
  const dataConfig = spec.data;
  
  // If no data config or no source, return single spec
  if (!dataConfig || !dataConfig.source) {
    return [spec];
  }
  
  const sourcePath = path.resolve(baseDir, dataConfig.source);
  const format = dataConfig.format || detectFormat(sourcePath);
  
  // Load data file
  const dataRows = loadDataFile(sourcePath, format);
  
  if (dataRows.length === 0) {
    return [spec];
  }
  
  // Check driver mode
  const driver = dataConfig.driver || 'parameterized';
  
  if (driver === 'parameterized') {
    // Generate one test case per data row
    return dataRows.map((row, index) => {
      const caseSpec = JSON.parse(JSON.stringify(spec)); // Deep clone
      
      // Merge data row into variables
      caseSpec.variables = {
        ...caseSpec.variables,
        ...row
      };
      
      // Add row index info
      caseSpec._dataRowIndex = index;
      caseSpec._dataRow = row;
      
      return caseSpec;
    });
  }
  
  // Single row mode (current_row)
  const rowIndex = dataConfig.current_row || 0;
  if (rowIndex >= 0 && rowIndex < dataRows.length) {
    const caseSpec = JSON.parse(JSON.stringify(spec));
    caseSpec.variables = {
      ...caseSpec.variables,
      ...dataRows[rowIndex]
    };
    caseSpec._dataRowIndex = rowIndex;
    caseSpec._dataRow = dataRows[rowIndex];
    return [caseSpec];
  }
  
  return [spec];
}

/**
 * Get data preview (first N rows)
 * @param {string} filePath - Path to data file
 * @param {string} format - File format
 * @param {number} limit - Max rows to return
 * @returns {object[]}
 */
export function getDataPreview(filePath, format, limit = 5) {
  const data = loadDataFile(filePath, format);
  return data.slice(0, limit);
}
