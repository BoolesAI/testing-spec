/**
 * Dynamic Protocol Registry
 *
 * Manages protocol types dynamically, allowing plugins to register new protocols.
 * This replaces the hardcoded ProtocolType union.
 */
/**
 * Protocol type registry - allows dynamic protocol registration
 */
declare class ProtocolRegistryClass {
    private protocols;
    private fileExtensions;
    /**
     * Register a new protocol type
     */
    register(protocol: string, fileExtension?: string): void;
    /**
     * Unregister a protocol type
     * Note: Cannot unregister built-in protocols
     */
    unregister(protocol: string): boolean;
    /**
     * Check if protocol is registered
     */
    has(protocol: string): boolean;
    /**
     * Get all registered protocols
     */
    getAll(): string[];
    /**
     * Get file extension for a protocol
     */
    getFileExtension(protocol: string): string | undefined;
    /**
     * Detect protocol from file path
     */
    getProtocolFromFilePath(filePath: string): string | null;
    /**
     * Check if a protocol is built-in
     */
    isBuiltin(protocol: string): boolean;
    /**
     * Reset to built-in protocols only (for testing)
     */
    reset(): void;
}
/**
 * Singleton protocol registry instance
 */
export declare const ProtocolRegistry: ProtocolRegistryClass;
/**
 * Type guard for protocol validation
 */
export declare function isValidProtocol(protocol: unknown): protocol is string;
/**
 * Get protocol type from test case structure
 */
export declare function detectProtocolFromSpec(spec: Record<string, unknown>): string | null;
export {};
