import * as vscode from 'vscode';
import { YamlHelper } from '../utils/yamlHelper';
import {
  TOP_LEVEL_FIELDS,
  METADATA_FIELDS,
  HTTP_FIELDS,
  GRPC_FIELDS,
  GRAPHQL_FIELDS,
  WEBSOCKET_FIELDS,
  ENVIRONMENT_FIELDS,
  ASSERTION_FIELDS,
  DATA_FIELDS,
  LIFECYCLE_FIELDS,
  LIFECYCLE_ACTION_FIELDS,
  VARIABLE_FUNCTIONS,
  createFieldCompletions,
  createEnumCompletions,
  createCompletionItem,
} from '../utils/schemaData';

export class TSpecCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const yamlContext = YamlHelper.getContext(document, position);
    
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

  private getKeyCompletions(context: ReturnType<typeof YamlHelper.getContext>): vscode.CompletionItem[] {
    switch (context.type) {
      case 'top-level':
        return createFieldCompletions(TOP_LEVEL_FIELDS, vscode.CompletionItemKind.Keyword);
      
      case 'metadata':
        return createFieldCompletions(METADATA_FIELDS);
      
      case 'http':
        return createFieldCompletions(HTTP_FIELDS);
      
      case 'grpc':
        return createFieldCompletions(GRPC_FIELDS);
      
      case 'graphql':
        return createFieldCompletions(GRAPHQL_FIELDS);
      
      case 'websocket':
        return createFieldCompletions(WEBSOCKET_FIELDS);
      
      case 'environment':
        return createFieldCompletions(ENVIRONMENT_FIELDS);
      
      case 'assertions':
      case 'assertion-item':
        return createFieldCompletions(ASSERTION_FIELDS);
      
      case 'data':
        return createFieldCompletions(DATA_FIELDS);
      
      case 'lifecycle':
        return createFieldCompletions(LIFECYCLE_FIELDS);
      
      case 'lifecycle-action':
        return createFieldCompletions(LIFECYCLE_ACTION_FIELDS);
      
      case 'body':
        return [
          createCompletionItem('json', vscode.CompletionItemKind.Property, 'JSON body', 'JSON request body', new vscode.SnippetString('json:\n  $0')),
          createCompletionItem('form', vscode.CompletionItemKind.Property, 'Form body', 'Form-encoded request body', new vscode.SnippetString('form:\n  $0')),
          createCompletionItem('raw', vscode.CompletionItemKind.Property, 'Raw body', 'Raw text request body', new vscode.SnippetString('raw: "$0"')),
        ];
      
      default:
        return [];
    }
  }

  private getEnumCompletions(key: string, contextType: string): vscode.CompletionItem[] {
    // Metadata enums
    if (key === 'test_category') {
      return createEnumCompletions(['functional', 'integration', 'performance', 'security']);
    }
    if (key === 'risk_level') {
      return createEnumCompletions(['low', 'medium', 'high', 'critical']);
    }
    if (key === 'priority') {
      return createEnumCompletions(['low', 'medium', 'high']);
    }
    
    // HTTP method
    if (key === 'method' && contextType === 'http') {
      return createEnumCompletions(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);
    }
    
    // Environment scheme
    if (key === 'scheme') {
      return createEnumCompletions(['http', 'https']);
    }
    
    // Assertion type
    if (key === 'type' && (contextType === 'assertions' || contextType === 'assertion-item')) {
      return createEnumCompletions(['json_path', 'string', 'number', 'regex', 'xml_path', 'response_time', 'javascript', 'include', 'status_code', 'grpc_code', 'header', 'proto_field']);
    }
    
    // Assertion operator
    if (key === 'operator') {
      return createEnumCompletions(['equals', 'eq', 'not_equals', 'neq', 'exists', 'not_exists', 'not_empty', 'contains', 'not_contains', 'matches', 'gt', 'gte', 'lt', 'lte', 'type', 'length', 'length_gt', 'length_gte', 'length_lt', 'length_lte']);
    }
    
    // Data format
    if (key === 'format' && contextType === 'data') {
      return createEnumCompletions(['csv', 'json', 'yaml']);
    }
    
    return [];
  }

  private getVariableCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];
    
    // Built-in functions
    for (const func of VARIABLE_FUNCTIONS) {
      const item = createCompletionItem(
        func.name,
        vscode.CompletionItemKind.Function,
        'Built-in function',
        func.description
      );
      items.push(item);
    }
    
    // env. prefix
    const envItem = createCompletionItem(
      'env.',
      vscode.CompletionItemKind.Module,
      'Environment variable',
      'Reference environment variable: env.VAR_NAME'
    );
    items.push(envItem);
    
    // extract. prefix
    const extractItem = createCompletionItem(
      'extract.',
      vscode.CompletionItemKind.Module,
      'Extracted value',
      'Reference extracted value: extract.variable_name'
    );
    items.push(extractItem);
    
    // User-defined variables
    const definedVars = YamlHelper.getDefinedVariables(document);
    for (const varName of definedVars) {
      const item = createCompletionItem(
        varName,
        vscode.CompletionItemKind.Variable,
        'User variable',
        `Variable defined in variables section`
      );
      items.push(item);
    }
    
    // Extracted variables
    const extractedVars = YamlHelper.getExtractedVariables(document);
    for (const varName of extractedVars) {
      const item = createCompletionItem(
        `extract.${varName}`,
        vscode.CompletionItemKind.Variable,
        'Extracted value',
        `Value extracted from response`
      );
      items.push(item);
    }
    
    return items;
  }
}
