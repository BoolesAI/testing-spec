"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VARIABLE_FUNCTIONS = exports.OUTPUT_FIELDS = exports.LIFECYCLE_FIELDS = exports.DATA_FIELDS = exports.ASSERTION_FIELDS = exports.ENVIRONMENT_FIELDS = exports.WEBSOCKET_FIELDS = exports.GRAPHQL_FIELDS = exports.GRPC_FIELDS = exports.HTTP_FIELDS = exports.METADATA_FIELDS = exports.TOP_LEVEL_FIELDS = void 0;
exports.createCompletionItem = createCompletionItem;
exports.createFieldCompletions = createFieldCompletions;
exports.createEnumCompletions = createEnumCompletions;
const vscode = __importStar(require("vscode"));
exports.TOP_LEVEL_FIELDS = [
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
exports.METADATA_FIELDS = [
    { key: 'ai_prompt', required: true, type: 'string', description: 'Natural language test description for AI' },
    { key: 'related_code', required: true, type: 'array', description: 'Paths to related source files' },
    { key: 'test_category', required: true, type: 'enum', description: 'Test category', values: ['functional', 'integration', 'performance', 'security'] },
    { key: 'risk_level', required: true, type: 'enum', description: 'Risk level', values: ['low', 'medium', 'high', 'critical'] },
    { key: 'tags', required: true, type: 'array', description: 'Tags for filtering and grouping' },
    { key: 'priority', required: true, type: 'enum', description: 'Test priority', values: ['low', 'medium', 'high'] },
    { key: 'timeout', required: true, type: 'string', description: 'Test timeout (e.g., "10s", "500ms")' },
    { key: 'business_rule', required: false, type: 'string', description: 'Business rule reference' },
];
exports.HTTP_FIELDS = [
    { key: 'method', required: true, type: 'enum', description: 'HTTP method', values: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] },
    { key: 'path', required: true, type: 'string', description: 'Request path' },
    { key: 'headers', required: false, type: 'object', description: 'Request headers' },
    { key: 'query', required: false, type: 'object', description: 'Query parameters' },
    { key: 'body', required: false, type: 'object', description: 'Request body' },
];
exports.GRPC_FIELDS = [
    { key: 'service', required: true, type: 'string', description: 'gRPC service name' },
    { key: 'method', required: true, type: 'string', description: 'gRPC method name' },
    { key: 'message', required: false, type: 'object', description: 'gRPC message payload' },
];
exports.GRAPHQL_FIELDS = [
    { key: 'query', required: true, type: 'string', description: 'GraphQL query' },
    { key: 'variables', required: false, type: 'object', description: 'Query variables' },
];
exports.WEBSOCKET_FIELDS = [
    { key: 'url', required: true, type: 'string', description: 'WebSocket URL' },
    { key: 'messages', required: false, type: 'array', description: 'Messages to send' },
];
exports.ENVIRONMENT_FIELDS = [
    { key: 'name', required: false, type: 'string', description: 'Environment name' },
    { key: 'host', required: false, type: 'string', description: 'API host' },
    { key: 'scheme', required: false, type: 'enum', description: 'URL scheme', values: ['http', 'https'] },
    { key: 'port', required: false, type: 'string', description: 'Port number' },
    { key: 'variables', required: false, type: 'object', description: 'Environment-specific variables' },
];
exports.ASSERTION_FIELDS = [
    { key: 'type', required: true, type: 'enum', description: 'Assertion type', values: ['status_code', 'grpc_code', 'response_time', 'json_path', 'header', 'proto_field', 'javascript', 'include'] },
    { key: 'expected', required: false, type: 'any', description: 'Expected value' },
    { key: 'expression', required: false, type: 'string', description: 'JSONPath expression' },
    { key: 'operator', required: false, type: 'enum', description: 'Comparison operator', values: ['equals', 'eq', 'not_equals', 'neq', 'exists', 'not_exists', 'not_empty', 'contains', 'not_contains', 'matches', 'gt', 'gte', 'lt', 'lte', 'type', 'length'] },
    { key: 'path', required: false, type: 'string', description: 'Field path' },
    { key: 'name', required: false, type: 'string', description: 'Header name' },
    { key: 'value', required: false, type: 'any', description: 'Header value' },
    { key: 'pattern', required: false, type: 'string', description: 'Regex pattern' },
    { key: 'max_ms', required: false, type: 'number', description: 'Maximum response time in ms' },
    { key: 'source', required: false, type: 'string', description: 'JavaScript source code' },
    { key: 'message', required: false, type: 'string', description: 'Custom failure message' },
    { key: 'include', required: false, type: 'string', description: 'Path to assertion library' },
];
exports.DATA_FIELDS = [
    { key: 'source', required: false, type: 'string', description: 'Path to data file' },
    { key: 'format', required: false, type: 'enum', description: 'Data format', values: ['csv', 'json', 'yaml'] },
    { key: 'driver', required: false, type: 'string', description: 'Driver mode' },
    { key: 'current_row', required: false, type: 'number', description: 'Current row index' },
];
exports.LIFECYCLE_FIELDS = [
    { key: 'setup', required: false, type: 'array', description: 'Pre-test actions' },
    { key: 'teardown', required: false, type: 'array', description: 'Post-test actions' },
];
exports.OUTPUT_FIELDS = [
    { key: 'save_response_on_failure', required: false, type: 'boolean', description: 'Save response on test failure' },
    { key: 'metrics', required: false, type: 'array', description: 'Metrics to report' },
    { key: 'notifications', required: false, type: 'array', description: 'Notification configuration' },
];
exports.VARIABLE_FUNCTIONS = [
    { name: 'uuid', description: 'Generate UUID v4' },
    { name: 'timestamp', description: 'Current Unix timestamp in milliseconds' },
    { name: 'now', description: 'Current timestamp' },
    { name: 'random_int(min,max)', description: 'Random integer in range' },
];
function createCompletionItem(label, kind, detail, documentation, insertText) {
    const item = new vscode.CompletionItem(label, kind);
    if (detail)
        item.detail = detail;
    if (documentation)
        item.documentation = new vscode.MarkdownString(documentation);
    if (insertText)
        item.insertText = insertText;
    return item;
}
function createFieldCompletions(fields, kind = vscode.CompletionItemKind.Property) {
    return fields.map(field => {
        const item = createCompletionItem(field.key, kind, field.required ? '(required)' : '(optional)', field.description);
        if (field.type === 'enum' && field.values) {
            item.insertText = new vscode.SnippetString(`${field.key}: "\${1|${field.values.join(',')}|}"`);
        }
        else if (field.type === 'array') {
            item.insertText = new vscode.SnippetString(`${field.key}:\n  - $0`);
        }
        else if (field.type === 'object') {
            item.insertText = new vscode.SnippetString(`${field.key}:\n  $0`);
        }
        else {
            item.insertText = new vscode.SnippetString(`${field.key}: $0`);
        }
        // Sort required fields first
        item.sortText = field.required ? `0_${field.key}` : `1_${field.key}`;
        return item;
    });
}
function createEnumCompletions(values, kind = vscode.CompletionItemKind.EnumMember) {
    return values.map(value => {
        const item = createCompletionItem(value, kind, undefined, undefined, `"${value}"`);
        return item;
    });
}
//# sourceMappingURL=schemaData.js.map