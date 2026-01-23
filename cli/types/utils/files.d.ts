export interface FileResolutionResult {
    files: string[];
    errors: string[];
}
export declare function resolveFiles(patterns: string[], cwd?: string): Promise<FileResolutionResult>;
export declare function filterByExtension(files: string[], extension: string): string[];
export declare function getTspecFiles(files: string[]): string[];
