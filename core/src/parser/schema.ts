import type { 
  TSpec, 
  ValidationResult, 
  ProtocolType,
  TSpecSuite,
  SuiteDefinition,
  TestReference,
  SuiteReference,
  ExecutionConfig,
  SuiteMetadata,
  SuiteLifecycleAction
} from './types.js';
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

// ============================================================================
// Suite Validation
// ============================================================================

const VALID_SUITE_LIFECYCLE_ACTIONS = ['script', 'http', 'grpc', 'extract', 'output', 'wait', 'log'] as const;
const VALID_EXECUTION_ORDERS = ['defined', 'random'] as const;
const VALID_LOG_LEVELS = ['info', 'warn', 'error', 'debug'] as const;

/**
 * Validates a test reference (file or files)
 */
function validateTestReference(ref: TestReference, index: number, errors: string[]): void {
  const hasFile = 'file' in ref && ref.file !== undefined;
  const hasFiles = 'files' in ref && ref.files !== undefined;

  if (!hasFile && !hasFiles) {
    errors.push(`suite.tests[${index}]: must specify either 'file' or 'files'`);
  }

  if (hasFile && hasFiles) {
    errors.push(`suite.tests[${index}]: cannot specify both 'file' and 'files'`);
  }

  if (hasFile && typeof ref.file !== 'string') {
    errors.push(`suite.tests[${index}].file must be a string`);
  }

  if (hasFiles && typeof ref.files !== 'string') {
    errors.push(`suite.tests[${index}].files must be a string`);
  }

  if (ref.skip !== undefined && typeof ref.skip !== 'boolean') {
    errors.push(`suite.tests[${index}].skip must be a boolean`);
  }

  if (ref.only !== undefined && typeof ref.only !== 'boolean') {
    errors.push(`suite.tests[${index}].only must be a boolean`);
  }
}

/**
 * Validates a suite reference
 */
function validateSuiteReference(ref: SuiteReference, index: number, errors: string[]): void {
  if (!ref.file) {
    errors.push(`suite.suites[${index}].file is required`);
  } else if (typeof ref.file !== 'string') {
    errors.push(`suite.suites[${index}].file must be a string`);
  }

  if (ref.skip !== undefined && typeof ref.skip !== 'boolean') {
    errors.push(`suite.suites[${index}].skip must be a boolean`);
  }

  if (ref.only !== undefined && typeof ref.only !== 'boolean') {
    errors.push(`suite.suites[${index}].only must be a boolean`);
  }
}

/**
 * Validates a suite lifecycle action
 */
function validateSuiteLifecycleAction(
  action: SuiteLifecycleAction, 
  path: string, 
  index: number, 
  errors: string[]
): void {
  if (!action.action) {
    errors.push(`${path}[${index}].action is required`);
    return;
  }

  if (!VALID_SUITE_LIFECYCLE_ACTIONS.includes(action.action as typeof VALID_SUITE_LIFECYCLE_ACTIONS[number])) {
    errors.push(`${path}[${index}].action must be one of: ${VALID_SUITE_LIFECYCLE_ACTIONS.join(', ')}`);
  }

  // Validate action-specific fields
  switch (action.action) {
    case 'script':
      if (!('source' in action) || !action.source) {
        errors.push(`${path}[${index}]: 'script' action requires 'source' field`);
      }
      break;

    case 'http':
      if (!('request' in action) || !action.request) {
        errors.push(`${path}[${index}]: 'http' action requires 'request' field`);
      } else {
        const req = (action as { request: { method?: string; path?: string } }).request;
        if (!req.method) {
          errors.push(`${path}[${index}].request.method is required`);
        }
        if (!req.path) {
          errors.push(`${path}[${index}].request.path is required`);
        }
      }
      break;

    case 'grpc':
      if (!('request' in action) || !action.request) {
        errors.push(`${path}[${index}]: 'grpc' action requires 'request' field`);
      } else {
        const req = (action as { request: { service?: string; method?: string } }).request;
        if (!req.service) {
          errors.push(`${path}[${index}].request.service is required`);
        }
        if (!req.method) {
          errors.push(`${path}[${index}].request.method is required`);
        }
      }
      break;

    case 'wait':
      if (!('duration' in action) || !action.duration) {
        errors.push(`${path}[${index}]: 'wait' action requires 'duration' field`);
      }
      break;

    case 'log':
      if (!('message' in action) || !action.message) {
        errors.push(`${path}[${index}]: 'log' action requires 'message' field`);
      }
      if ('level' in action && action.level && !VALID_LOG_LEVELS.includes(action.level as typeof VALID_LOG_LEVELS[number])) {
        errors.push(`${path}[${index}].level must be one of: ${VALID_LOG_LEVELS.join(', ')}`);
      }
      break;

    case 'extract':
      if (!('vars' in action) || !action.vars) {
        errors.push(`${path}[${index}]: 'extract' action requires 'vars' field`);
      }
      break;
  }
}

/**
 * Validates suite metadata
 */
function validateSuiteMetadata(metadata: SuiteMetadata, errors: string[]): void {
  if (metadata.test_category && !VALID_CATEGORIES.includes(metadata.test_category)) {
    errors.push(`Invalid suite.metadata.test_category: ${metadata.test_category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (metadata.risk_level && !VALID_RISK_LEVELS.includes(metadata.risk_level)) {
    errors.push(`Invalid suite.metadata.risk_level: ${metadata.risk_level}. Must be one of: ${VALID_RISK_LEVELS.join(', ')}`);
  }

  if (metadata.priority && !VALID_PRIORITIES.includes(metadata.priority)) {
    errors.push(`Invalid suite.metadata.priority: ${metadata.priority}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (metadata.related_code) {
    if (!Array.isArray(metadata.related_code)) {
      errors.push('suite.metadata.related_code must be an array');
    } else {
      metadata.related_code.forEach((entry, index) => {
        if (typeof entry !== 'string') {
          errors.push(`suite.metadata.related_code[${index}] must be a string`);
        } else {
          const result = validateRelatedCodeFormat(entry);
          if (!result.valid) {
            errors.push(`suite.metadata.related_code[${index}]: ${result.error}`);
          }
        }
      });
    }
  }

  if (metadata.tags && !Array.isArray(metadata.tags)) {
    errors.push('suite.metadata.tags must be an array');
  }
}

/**
 * Validates execution configuration
 */
function validateExecutionConfig(config: ExecutionConfig, errors: string[]): void {
  if (config.parallel_tests !== undefined && typeof config.parallel_tests !== 'boolean') {
    errors.push('suite.execution.parallel_tests must be a boolean');
  }

  if (config.parallel_suites !== undefined && typeof config.parallel_suites !== 'boolean') {
    errors.push('suite.execution.parallel_suites must be a boolean');
  }

  if (config.concurrency !== undefined) {
    if (typeof config.concurrency !== 'number' || config.concurrency < 1) {
      errors.push('suite.execution.concurrency must be a positive number');
    }
  }

  if (config.order && !VALID_EXECUTION_ORDERS.includes(config.order)) {
    errors.push(`suite.execution.order must be one of: ${VALID_EXECUTION_ORDERS.join(', ')}`);
  }

  if (config.fail_fast !== undefined && typeof config.fail_fast !== 'boolean') {
    errors.push('suite.execution.fail_fast must be a boolean');
  }

  if (config.retry) {
    if (config.retry.count !== undefined && (typeof config.retry.count !== 'number' || config.retry.count < 0)) {
      errors.push('suite.execution.retry.count must be a non-negative number');
    }
    if (config.retry.on_failure_only !== undefined && typeof config.retry.on_failure_only !== 'boolean') {
      errors.push('suite.execution.retry.on_failure_only must be a boolean');
    }
  }
}

/**
 * Validates a suite definition
 */
function validateSuiteDefinition(suite: SuiteDefinition, errors: string[]): void {
  // Required field: name
  if (!suite.name) {
    errors.push('suite.name is required');
  } else if (typeof suite.name !== 'string') {
    errors.push('suite.name must be a string');
  }

  // Optional string fields
  if (suite.description !== undefined && typeof suite.description !== 'string') {
    errors.push('suite.description must be a string');
  }

  if (suite.version !== undefined && typeof suite.version !== 'string') {
    errors.push('suite.version must be a string');
  }

  if (suite.extends !== undefined && typeof suite.extends !== 'string') {
    errors.push('suite.extends must be a string');
  }

  // depends_on validation
  if (suite.depends_on !== undefined) {
    if (!Array.isArray(suite.depends_on)) {
      errors.push('suite.depends_on must be an array');
    } else {
      suite.depends_on.forEach((dep, index) => {
        if (typeof dep !== 'string') {
          errors.push(`suite.depends_on[${index}] must be a string`);
        }
      });
    }
  }

  // Metadata validation
  if (suite.metadata) {
    validateSuiteMetadata(suite.metadata, errors);
  }

  // Execution config validation
  if (suite.execution) {
    validateExecutionConfig(suite.execution, errors);
  }

  // Lifecycle validation
  if (suite.lifecycle) {
    if (suite.lifecycle.setup && Array.isArray(suite.lifecycle.setup)) {
      suite.lifecycle.setup.forEach((action, index) => {
        validateSuiteLifecycleAction(action, 'suite.lifecycle.setup', index, errors);
      });
    }
    if (suite.lifecycle.teardown && Array.isArray(suite.lifecycle.teardown)) {
      suite.lifecycle.teardown.forEach((action, index) => {
        validateSuiteLifecycleAction(action, 'suite.lifecycle.teardown', index, errors);
      });
    }
  }

  // before_each validation
  if (suite.before_each) {
    if (!Array.isArray(suite.before_each)) {
      errors.push('suite.before_each must be an array');
    } else {
      suite.before_each.forEach((action, index) => {
        validateSuiteLifecycleAction(action, 'suite.before_each', index, errors);
      });
    }
  }

  // after_each validation
  if (suite.after_each) {
    if (!Array.isArray(suite.after_each)) {
      errors.push('suite.after_each must be an array');
    } else {
      suite.after_each.forEach((action, index) => {
        validateSuiteLifecycleAction(action, 'suite.after_each', index, errors);
      });
    }
  }

  // Tests validation
  if (suite.tests) {
    if (!Array.isArray(suite.tests)) {
      errors.push('suite.tests must be an array');
    } else {
      suite.tests.forEach((ref, index) => {
        validateTestReference(ref, index, errors);
      });
    }
  }

  // Nested suites validation
  if (suite.suites) {
    if (!Array.isArray(suite.suites)) {
      errors.push('suite.suites must be an array');
    } else {
      suite.suites.forEach((ref, index) => {
        validateSuiteReference(ref, index, errors);
      });
    }
  }

  // Warn if no tests or suites defined
  if ((!suite.tests || suite.tests.length === 0) && (!suite.suites || suite.suites.length === 0)) {
    errors.push('suite must define at least one test or nested suite');
  }
}

/**
 * Validates a TSpecSuite object
 */
export function validateSuite(spec: TSpecSuite, options: SchemaValidationOptions = {}): ValidationResult {
  const errors: string[] = [];

  // Check for suite field
  if (!spec.suite) {
    errors.push('Missing required field: suite');
    return { valid: false, errors };
  }

  validateSuiteDefinition(spec.suite, errors);

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates DSL format for suite files
 */
export function validateSuiteDslFormat(content: string): ValidationResult {
  const errors: string[] = [];

  if (!content.trim()) {
    errors.push('Empty content');
    return { valid: false, errors };
  }

  // Check for required suite key
  if (!content.includes('suite:')) {
    errors.push('Missing required key: suite');
  }

  // Check for suite name (required field within suite)
  // Simple heuristic check
  if (content.includes('suite:') && !content.includes('name:')) {
    errors.push('Missing required key: suite.name');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detects if content is a suite file based on structure
 */
export function isSuiteContent(content: string): boolean {
  // Check if the content starts with 'suite:' at the root level
  const trimmed = content.trim();
  return trimmed.startsWith('suite:') || /^suite:\s*$/m.test(trimmed.split('\n')[0]);
}
