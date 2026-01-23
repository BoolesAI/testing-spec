import type { TSpec, ProtocolType } from './types.js';
export declare function parseYamlFile(filePath: string): TSpec;
export declare function parseYamlString(content: string): TSpec;
export declare function getProtocolType(spec: TSpec): ProtocolType | null;
export declare function getBaseDir(filePath: string): string;
