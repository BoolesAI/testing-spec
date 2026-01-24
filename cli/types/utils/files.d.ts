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
}
export interface DiscoveryResult {
    files: TSpecFileDescriptor[];
    errors: string[];
}
export declare function resolveFiles(patterns: string[], cwd?: string): Promise<FileResolutionResult>;
export declare function filterByExtension(files: string[], extension: string): string[];
export declare function getTspecFiles(files: string[]): string[];
/**
 * Discovers .tspec files without loading their content.
 * Files are scanned and classified, content is read on-demand during validation/parsing/execution.
 *
 * @param patterns - File paths, directory paths, or glob patterns
 * @param cwd - Working directory for resolving relative paths
 * @returns DiscoveryResult with file descriptors and any errors
 */
export declare function discoverTSpecFiles(patterns: string[], cwd?: string): Promise<DiscoveryResult>;
