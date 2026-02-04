/**
 * TSpec Proxy File Reader
 * 
 * Utilities for reading test files and preparing them for proxy transmission.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, isAbsolute } from 'path';

/**
 * Result of reading test files
 */
export interface ReadFilesResult {
  /** Map of file path to file content */
  fileContents: Record<string, string>;
  
  /** Files that could not be read */
  errors: Array<{ file: string; error: string }>;
}

/**
 * Read multiple test files and return their contents as a map
 * 
 * @param filePaths - Array of file paths to read
 * @param basePath - Base path for resolving relative paths (default: cwd)
 * @returns Object with file contents map and any read errors
 */
export function readTestFiles(
  filePaths: string[],
  basePath: string = process.cwd()
): ReadFilesResult {
  const fileContents: Record<string, string> = {};
  const errors: Array<{ file: string; error: string }> = [];
  
  for (const filePath of filePaths) {
    const absolutePath = isAbsolute(filePath) 
      ? filePath 
      : resolve(basePath, filePath);
    
    try {
      if (!existsSync(absolutePath)) {
        errors.push({ 
          file: filePath, 
          error: `File not found: ${absolutePath}` 
        });
        continue;
      }
      
      const content = readFileSync(absolutePath, 'utf-8');
      // Use the original filePath as key to maintain consistency
      fileContents[filePath] = content;
    } catch (err) {
      errors.push({ 
        file: filePath, 
        error: `Failed to read file: ${(err as Error).message}` 
      });
    }
  }
  
  return { fileContents, errors };
}

/**
 * Read a single test file
 * 
 * @param filePath - Path to the file
 * @param basePath - Base path for resolving relative paths
 * @returns File content or null if read failed
 */
export function readTestFile(
  filePath: string,
  basePath: string = process.cwd()
): string | null {
  const absolutePath = isAbsolute(filePath) 
    ? filePath 
    : resolve(basePath, filePath);
  
  try {
    if (!existsSync(absolutePath)) {
      return null;
    }
    return readFileSync(absolutePath, 'utf-8');
  } catch {
    return null;
  }
}
