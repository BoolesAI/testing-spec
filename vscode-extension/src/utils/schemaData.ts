import * as vscode from 'vscode';

export interface SchemaField {
  key: string;
  required: boolean;
  type: string;
  description: string;
  values?: string[];
}

export const TOP_LEVEL_FIELDS: SchemaField[] = [
  { key: 'version', required: true, type: 'string', description: 'TSpec format version (currently "1.0")' },
  { key: 'description', required: true, type: 'string', description: 'Test case description' },
  { key: 'metadata', required: true, type: 'object', description: 'Test metadata and classification' },
  { key: 'environment', required: false, type: 'object', description: 'Environment configuration' },
  { key: 'variables', required: false, type: 'object', description: 'Variable definitions' },
  { key: 'data', required: false, type: 'object', description: 'Data-driven testing configuration' },
  { key: 'extends', required: false, type: 'string', description: 'Template file to extend' },
  { key: 'lifecycle', required: false, type: 'object', description: 'Setup and teardown hooks' },
  { key: 'http', required: false, type: 'object', description: 'HTTP request configuration' },
  { key: 'grpc', required: false, type: 'object', description: 'gRPC request configuration' },
  { key: 'graphql', required: false, type: 'object', description: 'GraphQL request configuration' },
  { key: 'websocket', required: false, type: 'object', description: 'WebSocket request configuration' },
  { key: 'assertions', required: true, type: 'array', description: 'Test assertions' },
  { key: 'extract', required: false, type: 'object', description: 'Response data extraction' },
  { key: 'output', required: false, type: 'object', description: 'Output configuration' },
];

export const METADATA_FIELDS: SchemaField[] = [
  { key: 'prompt', required: true, type: 'string', description: 'Natural language test description for AI' },
  { key: 'related_code', required: true, type: 'array', description: 'Paths to related source files' },
  { key: 'test_category', required: true, type: 'enum', description: 'Test category', values: ['functional', 'integration', 'performance', 'security'] },
  { key: 'risk_level', required: true, type: 'enum', description: 'Risk level', values: ['low', 'medium', 'high', 'critical'] },
  { key: 'tags', required: true, type: 'array', description: 'Tags for filtering and grouping' },
  { key: 'priority', required: true, type: 'enum', description: 'Test priority', values: ['low', 'medium', 'high'] },
  { key: 'timeout', required: true, type: 'string', description: 'Test timeout (e.g., "10s", "500ms")' },
  { key: 'business_rule', required: false, type: 'string', description: 'Business rule reference' },
];

export const HTTP_FIELDS: SchemaField[] = [
  { key: 'method', required: true, type: 'enum', description: 'HTTP method', values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] },
  { key: 'path', required: true, type: 'string', description: 'Request path' },
  { key: 'headers', required: false, type: 'object', description: 'Request headers' },
  { key: 'query', required: false, type: 'object', description: 'Query parameters' },
  { key: 'body', required: false, type: 'object', description: 'Request body' },
];

export const GRPC_FIELDS: SchemaField[] = [
  { key: 'service', required: true, type: 'string', description: 'gRPC service name' },
  { key: 'method', required: true, type: 'string', description: 'gRPC method name' },
  { key: 'message', required: false, type: 'object', description: 'gRPC message payload' },
];

export const GRAPHQL_FIELDS: SchemaField[] = [
  { key: 'query', required: true, type: 'string', description: 'GraphQL query' },
  { key: 'variables', required: false, type: 'object', description: 'Query variables' },
];

export const WEBSOCKET_FIELDS: SchemaField[] = [
  { key: 'url', required: true, type: 'string', description: 'WebSocket URL' },
  { key: 'messages', required: false, type: 'array', description: 'Messages to send' },
];

export const ENVIRONMENT_FIELDS: SchemaField[] = [
  { key: 'name', required: false, type: 'string', description: 'Environment name' },
  { key: 'host', required: false, type: 'string', description: 'API host' },
  { key: 'scheme', required: false, type: 'enum', description: 'URL scheme', values: ['http', 'https'] },
  { key: 'port', required: false, type: 'string', description: 'Port number' },
  { key: 'variables', required: false, type: 'object', description: 'Environment-specific variables' },
];

export const ASSERTION_FIELDS: SchemaField[] = [
  { key: 'type', required: true, type: 'enum', description: 'Assertion type', values: ['json_path', 'string', 'number', 'regex', 'xml_path', 'response_time', 'javascript', 'include', 'status_code', 'grpc_code', 'header', 'proto_field'] },
  { key: 'expected', required: false, type: 'any', description: 'Expected value' },
  { key: 'expression', required: false, type: 'string', description: 'JSONPath or XPath expression' },
  { key: 'operator', required: false, type: 'enum', description: 'Comparison operator', values: ['equals', 'eq', 'not_equals', 'neq', 'exists', 'not_exists', 'not_empty', 'contains', 'not_contains', 'matches', 'gt', 'gte', 'lt', 'lte', 'type', 'length', 'length_gt', 'length_gte', 'length_lt', 'length_lte'] },
  { key: 'path', required: false, type: 'string', description: 'Field path (deprecated - use expression)' },
  { key: 'name', required: false, type: 'string', description: 'Header name (deprecated - use expression)' },
  { key: 'value', required: false, type: 'any', description: 'Header value (deprecated - use expected)' },
  { key: 'pattern', required: false, type: 'string', description: 'Regex pattern' },
  { key: 'extract_group', required: false, type: 'number', description: 'Regex capture group index (default: 0)' },
  { key: 'max_ms', required: false, type: 'number', description: 'Maximum response time in ms' },
  { key: 'source', required: false, type: 'string', description: 'JavaScript source code' },
  { key: 'message', required: false, type: 'string', description: 'Custom failure message' },
  { key: 'include', required: false, type: 'string', description: 'Path to assertion library' },
];

export const DATA_FIELDS: SchemaField[] = [
  { key: 'source', required: false, type: 'string', description: 'Path to data file' },
  { key: 'format', required: false, type: 'enum', description: 'Data format', values: ['csv', 'json', 'yaml'] },
  { key: 'driver', required: false, type: 'string', description: 'Driver mode' },
  { key: 'current_row', required: false, type: 'number', description: 'Current row index' },
];

export const LIFECYCLE_FIELDS: SchemaField[] = [
  { key: 'setup', required: false, type: 'array', description: 'Pre-test actions' },
  { key: 'teardown', required: false, type: 'array', description: 'Post-test actions' },
];

export const OUTPUT_FIELDS: SchemaField[] = [
  { key: 'save_response_on_failure', required: false, type: 'boolean', description: 'Save response on test failure' },
  { key: 'metrics', required: false, type: 'array', description: 'Metrics to report' },
  { key: 'notifications', required: false, type: 'array', description: 'Notification configuration' },
];

export const VARIABLE_FUNCTIONS = [
  { name: 'uuid', description: 'Generate UUID v4' },
  { name: 'timestamp', description: 'Current Unix timestamp in milliseconds' },
  { name: 'now', description: 'Current timestamp' },
  { name: 'random_int(min,max)', description: 'Random integer in range' },
];

export function createCompletionItem(
  label: string,
  kind: vscode.CompletionItemKind,
  detail?: string,
  documentation?: string,
  insertText?: string | vscode.SnippetString
): vscode.CompletionItem {
  const item = new vscode.CompletionItem(label, kind);
  if (detail) item.detail = detail;
  if (documentation) item.documentation = new vscode.MarkdownString(documentation);
  if (insertText) item.insertText = insertText;
  return item;
}

export function createFieldCompletions(fields: SchemaField[], kind: vscode.CompletionItemKind = vscode.CompletionItemKind.Property): vscode.CompletionItem[] {
  return fields.map(field => {
    const item = createCompletionItem(
      field.key,
      kind,
      field.required ? '(required)' : '(optional)',
      field.description
    );
    
    if (field.type === 'enum' && field.values) {
      item.insertText = new vscode.SnippetString(`${field.key}: "\${1|${field.values.join(',')}|}"`);
    } else if (field.type === 'array') {
      item.insertText = new vscode.SnippetString(`${field.key}:\n  - $0`);
    } else if (field.type === 'object') {
      item.insertText = new vscode.SnippetString(`${field.key}:\n  $0`);
    } else {
      item.insertText = new vscode.SnippetString(`${field.key}: $0`);
    }
    
    // Sort required fields first
    item.sortText = field.required ? `0_${field.key}` : `1_${field.key}`;
    
    return item;
  });
}

export function createEnumCompletions(values: string[], kind: vscode.CompletionItemKind = vscode.CompletionItemKind.EnumMember): vscode.CompletionItem[] {
  return values.map(value => {
    const item = createCompletionItem(value, kind, undefined, undefined, `"${value}"`);
    return item;
  });
}
