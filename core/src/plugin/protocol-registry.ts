/**
 * Dynamic Protocol Registry
 * 
 * Manages protocol types dynamically, allowing plugins to register new protocols.
 * This replaces the hardcoded ProtocolType union.
 */

/**
 * Built-in protocols that are always available
 */
const BUILTIN_PROTOCOLS = new Set<string>([
  'http',
  'grpc',
  'graphql',
  'websocket'
]);

/**
 * Protocol type registry - allows dynamic protocol registration
 */
class ProtocolRegistryClass {
  private protocols: Set<string> = new Set(BUILTIN_PROTOCOLS);
  private fileExtensions: Map<string, string> = new Map([
    ['http', '.http.tcase'],
    ['grpc', '.grpc.tcase'],
    ['graphql', '.graphql.tcase'],
    ['websocket', '.ws.tcase'],
    ['web', '.web.tcase']
  ]);
  
  /**
   * Register a new protocol type
   */
  register(protocol: string, fileExtension?: string): void {
    const normalizedProtocol = protocol.toLowerCase();
    this.protocols.add(normalizedProtocol);
    
    if (fileExtension) {
      this.fileExtensions.set(normalizedProtocol, fileExtension);
    } else if (!this.fileExtensions.has(normalizedProtocol)) {
      // Generate default extension
      this.fileExtensions.set(normalizedProtocol, `.${normalizedProtocol}.tcase`);
    }
  }
  
  /**
   * Unregister a protocol type
   * Note: Cannot unregister built-in protocols
   */
  unregister(protocol: string): boolean {
    const normalizedProtocol = protocol.toLowerCase();
    
    if (BUILTIN_PROTOCOLS.has(normalizedProtocol)) {
      return false; // Cannot unregister built-in protocols
    }
    
    this.protocols.delete(normalizedProtocol);
    this.fileExtensions.delete(normalizedProtocol);
    return true;
  }
  
  /**
   * Check if protocol is registered
   */
  has(protocol: string): boolean {
    return this.protocols.has(protocol.toLowerCase());
  }
  
  /**
   * Get all registered protocols
   */
  getAll(): string[] {
    return Array.from(this.protocols).sort();
  }
  
  /**
   * Get file extension for a protocol
   */
  getFileExtension(protocol: string): string | undefined {
    return this.fileExtensions.get(protocol.toLowerCase());
  }
  
  /**
   * Detect protocol from file path
   */
  getProtocolFromFilePath(filePath: string): string | null {
    const lowerPath = filePath.toLowerCase();
    
    for (const [protocol, extension] of this.fileExtensions) {
      if (lowerPath.endsWith(extension)) {
        return protocol;
      }
    }
    
    // Fallback: try to match pattern like .http.tcase
    const match = lowerPath.match(/\.([a-z]+)\.tcase$/);
    if (match && this.protocols.has(match[1])) {
      return match[1];
    }
    
    return null;
  }
  
  /**
   * Check if a protocol is built-in
   */
  isBuiltin(protocol: string): boolean {
    return BUILTIN_PROTOCOLS.has(protocol.toLowerCase());
  }
  
  /**
   * Reset to built-in protocols only (for testing)
   */
  reset(): void {
    this.protocols = new Set(BUILTIN_PROTOCOLS);
    this.fileExtensions = new Map([
      ['http', '.http.tcase'],
      ['grpc', '.grpc.tcase'],
      ['graphql', '.graphql.tcase'],
      ['websocket', '.ws.tcase'],
      ['web', '.web.tcase'],
      ['desktop', '.desktop.tcase']
    ]);
  }
}

/**
 * Singleton protocol registry instance
 */
export const ProtocolRegistry = new ProtocolRegistryClass();

/**
 * Type guard for protocol validation
 */
export function isValidProtocol(protocol: unknown): protocol is string {
  return typeof protocol === 'string' && ProtocolRegistry.has(protocol);
}

/**
 * Get protocol type from test case structure
 */
export function detectProtocolFromSpec(spec: Record<string, unknown>): string | null {
  for (const protocol of ProtocolRegistry.getAll()) {
    if (protocol in spec) {
      return protocol;
    }
  }
  return null;
}
