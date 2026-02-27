import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import type { TSpec, ProtocolType } from './types.js';

export function parseYamlFile(filePath: string): TSpec {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return yaml.load(content) as TSpec;
}

export function parseYamlString(content: string): TSpec {
  return yaml.load(content) as TSpec;
}

export function getProtocolType(spec: TSpec): ProtocolType | null {
  if (spec.protocol && typeof spec.protocol === 'string') {
    const protocol = spec.protocol.toLowerCase().trim() as ProtocolType;
    return protocol;
  }
  return null;
}

export function getBaseDir(filePath: string): string {
  return path.dirname(path.resolve(filePath));
}
