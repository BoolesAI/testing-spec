/**
 * TSpec Proxy File Reader
 *
 * Utilities for reading test files and preparing them for proxy transmission.
 */
/**
 * Result of reading test files
 */
export interface ReadFilesResult {
    /** Map of file path to file content */
    fileContents: Record<string, string>;
    /** Files that could not be read */
    errors: Array<{
        file: string;
        error: string;
    }>;
}
/**
 * Read multiple test files and return their contents as a map
 *
 * @param filePaths - Array of file paths to read
 * @param basePath - Base path for resolving relative paths (default: cwd)
 * @returns Object with file contents map and any read errors
 */
export declare function readTestFiles(filePaths: string[], basePath?: string): ReadFilesResult;
/**
 * Read a single test file
 *
 * @param filePath - Path to the file
 * @param basePath - Base path for resolving relative paths
 * @returns File content or null if read failed
 */
export declare function readTestFile(filePath: string, basePath?: string): string | null;
