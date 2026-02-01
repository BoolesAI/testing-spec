import { glob } from 'glob';
import { resolve, isAbsolute, relative, basename } from 'path';
import { existsSync, statSync } from 'fs';
import { getTypeFromFilePath, isSuiteFile, getSuiteProtocolType } from '@boolesai/tspec';

export type ProtocolType = 'http' | 'grpc' | 'graphql' | 'websocket';

export interface FileResolutionResult {
  files: string[];
  errors: string[];
}

/**
 * Represents a discovered .tcase file without loading its content.
 * Used for lazy file loading - files are scanned first, content read on-demand.
 */
export interface TSpecFileDescriptor {
  /** Absolute path to the file */
  path: string;
  /** Path relative to working directory */
  relativePath: string;
  /** Base filename (e.g., "login.http.tcase") */
  fileName: string;
  /** Protocol type extracted from filename (e.g., "http" from "login.http.tcase") */
  protocol: ProtocolType | null;
}

export interface DiscoveryResult {
  files: TSpecFileDescriptor[];
  errors: string[];
}

export async function resolveFiles(patterns: string[], cwd?: string): Promise<FileResolutionResult> {
  const workingDir = cwd || process.cwd();
  const files: string[] = [];
  const errors: string[] = [];

  for (const pattern of patterns) {
    // Check if it's a direct file path
    const absolutePath = isAbsolute(pattern) ? pattern : resolve(workingDir, pattern);
    
    if (existsSync(absolutePath)) {
      const stat = statSync(absolutePath);
      if (stat.isFile()) {
        files.push(absolutePath);
        continue;
      } else if (stat.isDirectory()) {
        // If it's a directory, glob for .tcase files
        const dirFiles = await glob('**/*.tcase', { cwd: absolutePath, absolute: true });
        if (dirFiles.length === 0) {
          errors.push(`No .tcase files found in directory: ${pattern}`);
        } else {
          files.push(...dirFiles);
        }
        continue;
      }
    }

    // Treat as glob pattern
    const matches = await glob(pattern, { cwd: workingDir, absolute: true });
    if (matches.length === 0) {
      errors.push(`No files matched pattern: ${pattern}`);
    } else {
      files.push(...matches);
    }
  }

  // Deduplicate files
  const uniqueFiles = [...new Set(files)];

  return { files: uniqueFiles, errors };
}

export function filterByExtension(files: string[], extension: string): string[] {
  return files.filter(f => f.endsWith(extension));
}

export function getTspecFiles(files: string[]): string[] {
  return filterByExtension(files, '.tcase');
}

/**
 * Discovers .tcase files without loading their content.
 * Files are scanned and classified, content is read on-demand during validation/parsing/execution.
 * 
 * @param patterns - File paths, directory paths, or glob patterns
 * @param cwd - Working directory for resolving relative paths
 * @returns DiscoveryResult with file descriptors and any errors
 */
export async function discoverTSpecFiles(patterns: string[], cwd?: string): Promise<DiscoveryResult> {
  const workingDir = cwd || process.cwd();
  const filePaths: string[] = [];
  const errors: string[] = [];

  for (const pattern of patterns) {
    // Check if it's a direct file path
    const absolutePath = isAbsolute(pattern) ? pattern : resolve(workingDir, pattern);
    
    if (existsSync(absolutePath)) {
      const stat = statSync(absolutePath);
      if (stat.isFile()) {
        if (absolutePath.endsWith('.tcase')) {
          filePaths.push(absolutePath);
        }
        continue;
      } else if (stat.isDirectory()) {
        // If it's a directory, glob for .tcase files
        const dirFiles = await glob('**/*.tcase', { cwd: absolutePath, absolute: true });
        if (dirFiles.length === 0) {
          errors.push(`No .tcase files found in directory: ${pattern}`);
        } else {
          filePaths.push(...dirFiles);
        }
        continue;
      }
    }

    // Treat as glob pattern
    const matches = await glob(pattern, { cwd: workingDir, absolute: true });
    const tspecMatches = matches.filter(f => f.endsWith('.tcase'));
    if (tspecMatches.length === 0) {
      errors.push(`No .tcase files matched pattern: ${pattern}`);
    } else {
      filePaths.push(...tspecMatches);
    }
  }

  // Deduplicate and create descriptors with protocol classification
  const uniquePaths = [...new Set(filePaths)];
  const files: TSpecFileDescriptor[] = uniquePaths.map(filePath => ({
    path: filePath,
    relativePath: relative(workingDir, filePath),
    fileName: basename(filePath),
    protocol: getTypeFromFilePath(filePath) as ProtocolType | null,
  }));

  return { files, errors };
}

// ============================================================================
// Suite File Discovery
// ============================================================================

/**
 * Represents a discovered .tsuite file without loading its content.
 * Used for lazy file loading - files are scanned first, content read on-demand.
 */
export interface TSuiteFileDescriptor {
  /** Absolute path to the file */
  path: string;
  /** Path relative to working directory */
  relativePath: string;
  /** Base filename (e.g., "bookstore.http.tsuite") */
  fileName: string;
  /** Protocol type extracted from filename (e.g., "http" from "bookstore.http.tsuite"), null for mixed protocol */
  protocol: ProtocolType | null;
  /** Whether this is a template file (*.tsuite.yaml) */
  isTemplate: boolean;
}

export interface SuiteDiscoveryResult {
  suites: TSuiteFileDescriptor[];
  errors: string[];
}

/**
 * Discovers .tsuite files without loading their content.
 * Files are scanned and classified, content is read on-demand during validation/parsing/execution.
 * 
 * @param patterns - File paths, directory paths, or glob patterns
 * @param cwd - Working directory for resolving relative paths
 * @returns SuiteDiscoveryResult with file descriptors and any errors
 */
export async function discoverSuiteFiles(patterns: string[], cwd?: string): Promise<SuiteDiscoveryResult> {
  const workingDir = cwd || process.cwd();
  const filePaths: string[] = [];
  const errors: string[] = [];

  for (const pattern of patterns) {
    // Check if it's a direct file path
    const absolutePath = isAbsolute(pattern) ? pattern : resolve(workingDir, pattern);
    
    if (existsSync(absolutePath)) {
      const stat = statSync(absolutePath);
      if (stat.isFile()) {
        if (isSuiteFile(absolutePath)) {
          filePaths.push(absolutePath);
        }
        continue;
      } else if (stat.isDirectory()) {
        // If it's a directory, glob for .tsuite files
        const dirFiles = await glob('**/*.tsuite', { cwd: absolutePath, absolute: true });
        if (dirFiles.length === 0) {
          errors.push(`No .tsuite files found in directory: ${pattern}`);
        } else {
          filePaths.push(...dirFiles);
        }
        continue;
      }
    }

    // Treat as glob pattern
    const matches = await glob(pattern, { cwd: workingDir, absolute: true });
    const suiteMatches = matches.filter(f => isSuiteFile(f));
    if (suiteMatches.length === 0) {
      errors.push(`No .tsuite files matched pattern: ${pattern}`);
    } else {
      filePaths.push(...suiteMatches);
    }
  }

  // Deduplicate and create descriptors with protocol classification
  const uniquePaths = [...new Set(filePaths)];
  const suites: TSuiteFileDescriptor[] = uniquePaths.map(filePath => ({
    path: filePath,
    relativePath: relative(workingDir, filePath),
    fileName: basename(filePath),
    protocol: getSuiteProtocolType(filePath) as ProtocolType | null,
    isTemplate: filePath.endsWith('.tsuite.yaml'),
  }));

  return { suites, errors };
}

/**
 * Discovers both .tcase and .tsuite files.
 * Useful when processing mixed inputs.
 */
export interface MixedDiscoveryResult {
  tspecFiles: TSpecFileDescriptor[];
  suiteFiles: TSuiteFileDescriptor[];
  errors: string[];
}

export async function discoverAllTestFiles(patterns: string[], cwd?: string): Promise<MixedDiscoveryResult> {
  const workingDir = cwd || process.cwd();
  const tspecPaths: string[] = [];
  const suitePaths: string[] = [];
  const errors: string[] = [];

  for (const pattern of patterns) {
    const absolutePath = isAbsolute(pattern) ? pattern : resolve(workingDir, pattern);
    
    if (existsSync(absolutePath)) {
      const stat = statSync(absolutePath);
      if (stat.isFile()) {
        if (absolutePath.endsWith('.tcase')) {
          tspecPaths.push(absolutePath);
        } else if (isSuiteFile(absolutePath)) {
          suitePaths.push(absolutePath);
        }
        continue;
      } else if (stat.isDirectory()) {
        // Discover both .tcase and .tsuite files in directory
        const tspecFiles = await glob('**/*.tcase', { cwd: absolutePath, absolute: true });
        const suiteFiles = await glob('**/*.tsuite', { cwd: absolutePath, absolute: true });
        
        if (tspecFiles.length === 0 && suiteFiles.length === 0) {
          errors.push(`No .tcase or .tsuite files found in directory: ${pattern}`);
        } else {
          tspecPaths.push(...tspecFiles);
          suitePaths.push(...suiteFiles);
        }
        continue;
      }
    }

    // Treat as glob pattern
    const matches = await glob(pattern, { cwd: workingDir, absolute: true });
    const tspecMatches = matches.filter(f => f.endsWith('.tcase'));
    const suiteMatches = matches.filter(f => isSuiteFile(f));
    
    if (tspecMatches.length === 0 && suiteMatches.length === 0) {
      errors.push(`No .tcase or .tsuite files matched pattern: ${pattern}`);
    } else {
      tspecPaths.push(...tspecMatches);
      suitePaths.push(...suiteMatches);
    }
  }

  // Deduplicate and create descriptors
  const uniqueTspecPaths = [...new Set(tspecPaths)];
  const uniqueSuitePaths = [...new Set(suitePaths)];

  const tspecFiles: TSpecFileDescriptor[] = uniqueTspecPaths.map(filePath => ({
    path: filePath,
    relativePath: relative(workingDir, filePath),
    fileName: basename(filePath),
    protocol: getTypeFromFilePath(filePath) as ProtocolType | null,
  }));

  const suiteFiles: TSuiteFileDescriptor[] = uniqueSuitePaths.map(filePath => ({
    path: filePath,
    relativePath: relative(workingDir, filePath),
    fileName: basename(filePath),
    protocol: getSuiteProtocolType(filePath) as ProtocolType | null,
    isTemplate: filePath.endsWith('.tsuite.yaml'),
  }));

  return { tspecFiles, suiteFiles, errors };
}
