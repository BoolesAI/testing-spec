import type { TSpec, ValidationResult, ProtocolType } from './types.js';
import { validateRelatedCodeFormat } from './related-code.js';

const VALID_CATEGORIES = ['functional', 'integration', 'performance', 'security'] as const;
const VALID_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high'] as const;
const PROTOCOL_BLOCKS: ProtocolType[] = ['http', 'grpc', 'graphql', 'websocket'];

export interface SchemaValidationOptions {
  strict?: boolean;
}

export function validateTspec(spec: TSpec, options: SchemaValidationOptions = {}): ValidationResult {
  const errors: string[] = [];
  const { strict = false } = options;

  // Required top-level fields
  const requiredFields = ['version', 'description', 'metadata', 'assertions'] as const;
  for (const field of requiredFields) {
    if (!(field in spec)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Protocol block validation
  const hasProtocol = PROTOCOL_BLOCKS.some(p => p in spec);
  if (!hasProtocol) {
    errors.push('Missing protocol block (http, grpc, graphql, or websocket)');
  }

  // Metadata validation (all fields are optional, only validate types when present)
  if (spec.metadata) {
    if (spec.metadata.test_category && !VALID_CATEGORIES.includes(spec.metadata.test_category)) {
      errors.push(`Invalid test_category: ${spec.metadata.test_category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (spec.metadata.risk_level && !VALID_RISK_LEVELS.includes(spec.metadata.risk_level)) {
      errors.push(`Invalid risk_level: ${spec.metadata.risk_level}. Must be one of: ${VALID_RISK_LEVELS.join(', ')}`);
    }

    if (spec.metadata.priority && !VALID_PRIORITIES.includes(spec.metadata.priority)) {
      errors.push(`Invalid priority: ${spec.metadata.priority}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    if (spec.metadata.related_code) {
      if (!Array.isArray(spec.metadata.related_code)) {
        errors.push('metadata.related_code must be an array');
      } else {
        // Validate each entry format
        spec.metadata.related_code.forEach((entry, index) => {
          if (typeof entry !== 'string') {
            errors.push(`metadata.related_code[${index}] must be a string`);
          } else {
            const result = validateRelatedCodeFormat(entry);
            if (!result.valid) {
              errors.push(`metadata.related_code[${index}]: ${result.error}`);
            }
          }
        });
      }
    }

    if (spec.metadata.tags && !Array.isArray(spec.metadata.tags)) {
      errors.push('metadata.tags must be an array');
    }
  }

  // Assertions validation
  if (spec.assertions) {
    if (!Array.isArray(spec.assertions)) {
      errors.push('assertions must be an array');
    } else if (strict) {
      spec.assertions.forEach((assertion, index) => {
        if (!assertion.type && !assertion.include) {
          errors.push(`assertions[${index}]: must have either 'type' or 'include'`);
        }
      });
    }
  }

  // HTTP request validation
  if (spec.http) {
    if (!spec.http.method) {
      errors.push('http.method is required');
    }
    if (!spec.http.path) {
      errors.push('http.path is required');
    }
    if (spec.http.method) {
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      if (!validMethods.includes(spec.http.method.toUpperCase())) {
        errors.push(`http.method must be one of: ${validMethods.join(', ')}`);
      }
    }
  }

  // gRPC request validation
  if (spec.grpc) {
    if (!spec.grpc.service) {
      errors.push('grpc.service is required');
    }
    if (!spec.grpc.method) {
      errors.push('grpc.method is required');
    }
  }

  // GraphQL request validation
  if (spec.graphql) {
    if (!spec.graphql.query) {
      errors.push('graphql.query is required');
    }
  }

  // WebSocket request validation
  if (spec.websocket) {
    if (!spec.websocket.url) {
      errors.push('websocket.url is required');
    }
  }

  // Data config validation
  if (spec.data) {
    if (spec.data.source && spec.data.format) {
      const validFormats = ['csv', 'json', 'yaml', 'yml'];
      if (!validFormats.includes(spec.data.format.toLowerCase())) {
        errors.push(`data.format must be one of: ${validFormats.join(', ')}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateDslFormat(content: string): ValidationResult {
  const errors: string[] = [];

  // Basic YAML structure validation
  if (!content.trim()) {
    errors.push('Empty content');
    return { valid: false, errors };
  }

  // Check for required YAML keys
  const requiredKeys = ['version:', 'description:', 'metadata:', 'assertions:'];
  for (const key of requiredKeys) {
    if (!content.includes(key)) {
      errors.push(`Missing required key: ${key.replace(':', '')}`);
    }
  }

  // Check for at least one protocol block
  const protocolKeys = ['http:', 'grpc:', 'graphql:', 'websocket:'];
  const hasProtocol = protocolKeys.some(key => content.includes(key));
  if (!hasProtocol) {
    errors.push('Missing protocol block (http, grpc, graphql, or websocket)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
