import { parseYamlFile, parseYamlString, validateTspec, type TSpec, type ValidationResult } from '../../core/index.js';
import fs from 'fs';

export interface ParseTspecParams {
  file_path?: string;
  content?: string;
  validate?: boolean;
}

export interface ParseTspecResult {
  source: string;
  spec: TSpec;
  validation: ValidationResult | null;
}

export interface MCPTool<TParams, TResult> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: TParams) => Promise<TResult>;
}

export const tool: MCPTool<ParseTspecParams, ParseTspecResult> = {
  name: 'parse_tspec',
  description: 'Parse a .tspec file and return its structured representation. Use this to inspect test specifications.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path to the .tspec file'
      },
      content: {
        type: 'string',
        description: 'YAML content string (alternative to file_path)'
      },
      validate: {
        type: 'boolean',
        description: 'Whether to validate the spec structure (default: true)',
        default: true
      }
    },
    oneOf: [
      { required: ['file_path'] },
      { required: ['content'] }
    ]
  },
  
  async handler(params: ParseTspecParams): Promise<ParseTspecResult> {
    const { file_path, content, validate = true } = params;
    
    let spec: TSpec;
    let source: string;
    
    if (file_path) {
      if (!fs.existsSync(file_path)) {
        throw new Error(`File not found: ${file_path}`);
      }
      spec = parseYamlFile(file_path);
      source = file_path;
    } else if (content) {
      spec = parseYamlString(content);
      source = 'inline';
    } else {
      throw new Error('Either file_path or content must be provided');
    }
    
    const result: ParseTspecResult = {
      source,
      spec,
      validation: null
    };
    
    if (validate) {
      result.validation = validateTspec(spec);
    }
    
    return result;
  }
};
