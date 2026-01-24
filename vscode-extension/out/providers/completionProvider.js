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
exports.TSpecCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const yamlHelper_1 = require("../utils/yamlHelper");
const schemaData_1 = require("../utils/schemaData");
class TSpecCompletionProvider {
    provideCompletionItems(document, position, token, context) {
        const yamlContext = yamlHelper_1.YamlHelper.getContext(document, position);
        // Handle variable interpolation
        if (yamlContext.inVariable) {
            return this.getVariableCompletions(document);
        }
        // Handle value completions for enum fields
        if (yamlContext.isValuePosition && yamlContext.currentKey) {
            const enumCompletions = this.getEnumCompletions(yamlContext.currentKey, yamlContext.type);
            if (enumCompletions.length > 0) {
                return enumCompletions;
            }
        }
        // Handle key completions based on context
        return this.getKeyCompletions(yamlContext);
    }
    getKeyCompletions(context) {
        switch (context.type) {
            case 'top-level':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.TOP_LEVEL_FIELDS, vscode.CompletionItemKind.Keyword);
            case 'metadata':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.METADATA_FIELDS);
            case 'http':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.HTTP_FIELDS);
            case 'grpc':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.GRPC_FIELDS);
            case 'graphql':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.GRAPHQL_FIELDS);
            case 'websocket':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.WEBSOCKET_FIELDS);
            case 'environment':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.ENVIRONMENT_FIELDS);
            case 'assertions':
            case 'assertion-item':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.ASSERTION_FIELDS);
            case 'data':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.DATA_FIELDS);
            case 'lifecycle':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.LIFECYCLE_FIELDS);
            case 'output':
                return (0, schemaData_1.createFieldCompletions)(schemaData_1.OUTPUT_FIELDS);
            case 'body':
                return [
                    (0, schemaData_1.createCompletionItem)('json', vscode.CompletionItemKind.Property, 'JSON body', 'JSON request body', new vscode.SnippetString('json:\n  $0')),
                    (0, schemaData_1.createCompletionItem)('form', vscode.CompletionItemKind.Property, 'Form body', 'Form-encoded request body', new vscode.SnippetString('form:\n  $0')),
                    (0, schemaData_1.createCompletionItem)('raw', vscode.CompletionItemKind.Property, 'Raw body', 'Raw text request body', new vscode.SnippetString('raw: "$0"')),
                ];
            default:
                return [];
        }
    }
    getEnumCompletions(key, contextType) {
        // Metadata enums
        if (key === 'test_category') {
            return (0, schemaData_1.createEnumCompletions)(['functional', 'integration', 'performance', 'security']);
        }
        if (key === 'risk_level') {
            return (0, schemaData_1.createEnumCompletions)(['low', 'medium', 'high', 'critical']);
        }
        if (key === 'priority') {
            return (0, schemaData_1.createEnumCompletions)(['low', 'medium', 'high']);
        }
        // HTTP method
        if (key === 'method' && contextType === 'http') {
            return (0, schemaData_1.createEnumCompletions)(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);
        }
        // Environment scheme
        if (key === 'scheme') {
            return (0, schemaData_1.createEnumCompletions)(['http', 'https']);
        }
        // Assertion type
        if (key === 'type' && (contextType === 'assertions' || contextType === 'assertion-item')) {
            return (0, schemaData_1.createEnumCompletions)(['status_code', 'grpc_code', 'response_time', 'json_path', 'header', 'proto_field', 'javascript', 'include']);
        }
        // Assertion operator
        if (key === 'operator') {
            return (0, schemaData_1.createEnumCompletions)(['equals', 'eq', 'not_equals', 'neq', 'exists', 'not_exists', 'not_empty', 'contains', 'not_contains', 'matches', 'gt', 'gte', 'lt', 'lte', 'type', 'length']);
        }
        // Data format
        if (key === 'format' && contextType === 'data') {
            return (0, schemaData_1.createEnumCompletions)(['csv', 'json', 'yaml']);
        }
        return [];
    }
    getVariableCompletions(document) {
        const items = [];
        // Built-in functions
        for (const func of schemaData_1.VARIABLE_FUNCTIONS) {
            const item = (0, schemaData_1.createCompletionItem)(func.name, vscode.CompletionItemKind.Function, 'Built-in function', func.description);
            items.push(item);
        }
        // env. prefix
        const envItem = (0, schemaData_1.createCompletionItem)('env.', vscode.CompletionItemKind.Module, 'Environment variable', 'Reference environment variable: env.VAR_NAME');
        items.push(envItem);
        // extract. prefix
        const extractItem = (0, schemaData_1.createCompletionItem)('extract.', vscode.CompletionItemKind.Module, 'Extracted value', 'Reference extracted value: extract.variable_name');
        items.push(extractItem);
        // User-defined variables
        const definedVars = yamlHelper_1.YamlHelper.getDefinedVariables(document);
        for (const varName of definedVars) {
            const item = (0, schemaData_1.createCompletionItem)(varName, vscode.CompletionItemKind.Variable, 'User variable', `Variable defined in variables section`);
            items.push(item);
        }
        // Extracted variables
        const extractedVars = yamlHelper_1.YamlHelper.getExtractedVariables(document);
        for (const varName of extractedVars) {
            const item = (0, schemaData_1.createCompletionItem)(`extract.${varName}`, vscode.CompletionItemKind.Variable, 'Extracted value', `Value extracted from response`);
            items.push(item);
        }
        return items;
    }
}
exports.TSpecCompletionProvider = TSpecCompletionProvider;
//# sourceMappingURL=completionProvider.js.map