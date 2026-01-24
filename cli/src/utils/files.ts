import { glob } from 'glob';
import { resolve, isAbsolute, relative, basename } from 'path';
import { existsSync, statSync } from 'fs';
import { getTypeFromFilePath } from '@boolesai/tspec';

export type ProtocolType = 'http' | 'grpc' | 'graphql' | 'websocket';

export interface FileResolutionResult {
  files: string[];
  errors: string[];
}

/**
 * Represents a discovered .tspec file without loading its content.
 * Used for lazy file loading - files are scanned first, content read on-demand.
 */
export interface TSpecFileDescriptor {
  /** Absolute path to the file */
  path: string;
  /** Path relative to working directory */
  relativePath: string;
  /** Base filename (e.g., "login.http.tspec") */
  fileName: string;
  /** Protocol type extracted from filename (e.g., "http" from "login.http.tspec") */
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
        // If it's a directory, glob for .tspec files
        const dirFiles = await glob('**/*.tspec', { cwd: absolutePath, absolute: true });
        if (dirFiles.length === 0) {
          errors.push(`No .tspec files found in directory: ${pattern}`);
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
  return filterByExtension(files, '.tspec');
}

/**
 * Discovers .tspec files without loading their content.
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
        if (absolutePath.endsWith('.tspec')) {
          filePaths.push(absolutePath);
        }
        continue;
      } else if (stat.isDirectory()) {
        // If it's a directory, glob for .tspec files
        const dirFiles = await glob('**/*.tspec', { cwd: absolutePath, absolute: true });
        if (dirFiles.length === 0) {
          errors.push(`No .tspec files found in directory: ${pattern}`);
        } else {
          filePaths.push(...dirFiles);
        }
        continue;
      }
    }

    // Treat as glob pattern
    const matches = await glob(pattern, { cwd: workingDir, absolute: true });
    const tspecMatches = matches.filter(f => f.endsWith('.tspec'));
    if (tspecMatches.length === 0) {
      errors.push(`No .tspec files matched pattern: ${pattern}`);
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
