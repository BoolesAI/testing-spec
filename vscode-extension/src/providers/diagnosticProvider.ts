import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { YamlHelper } from '../utils/yamlHelper';

// Schema constants (matching core/src/parser/schema.ts)
const VALID_CATEGORIES = ['functional', 'integration', 'performance', 'security'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const PROTOCOL_BLOCKS = ['http', 'grpc', 'graphql', 'websocket'];
const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const VALID_ASSERTION_TYPES = ['json_path', 'string', 'number', 'regex', 'xml_path', 'response_time', 'javascript', 'include', 'status_code', 'grpc_code', 'header', 'proto_field'];
const DEPRECATED_ASSERTION_TYPES = ['status_code', 'grpc_code', 'header', 'proto_field'];
const DEPRECATED_TYPE_HINTS: Record<string, string> = {
  'status_code': 'Use json_path with expression "$.status" instead',
  'grpc_code': 'Use json_path with expression "$.grpcCode" instead',
  'header': 'Use json_path with expression "$.header[\'Header-Name\']" instead',
  'proto_field': 'Use json_path with expression "$.body.field.path" instead'
};
const VALID_OPERATORS = ['equals', 'eq', 'not_equals', 'neq', 'exists', 'not_exists', 'not_empty', 'contains', 'not_contains', 'matches', 'gt', 'gte', 'lt', 'lte', 'type', 'length', 'length_gt', 'length_gte', 'length_lt', 'length_lte'];
const VALID_DATA_FORMATS = ['csv', 'json', 'yaml', 'yml'];

interface TSpecDocument {
  version?: string;
  description?: string;
  metadata?: {
    prompt: string;
    related_code: string[];
    test_category: string;
    risk_level: string;
    tags: string[];
    priority: string;
    timeout: string;
    [key: string]: unknown;
  };
  http?: {
    method?: string;
    path?: string;
    [key: string]: unknown;
  };
  grpc?: {
    service?: string;
    method?: string;
    [key: string]: unknown;
  };
  graphql?: {
    query?: string;
    [key: string]: unknown;
  };
  websocket?: {
    url?: string;
    [key: string]: unknown;
  };
  assertions?: Array<{
    type?: string;
    include?: string;
    operator?: string;
    [key: string]: unknown;
  }>;
  data?: {
    format?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export class TSpecDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private debounceTimer: NodeJS.Timeout | undefined;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('tspec');
  }

  public dispose(): void {
    this.diagnosticCollection.dispose();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  public validateDocumentDebounced(document: vscode.TextDocument): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.validateDocument(document);
    }, 300);
  }

  public validateDocument(document: vscode.TextDocument): void {
    if (document.languageId !== 'tspec') {
      return;
    }

    const config = vscode.workspace.getConfiguration('tspec');
    if (!config.get('validation.enabled', true)) {
      this.diagnosticCollection.set(document.uri, []);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    // Skip empty documents
    if (!text.trim()) {
      this.diagnosticCollection.set(document.uri, []);
      return;
    }

    try {
      // Parse YAML
      const spec = yaml.load(text) as TSpecDocument;
      
      if (spec && typeof spec === 'object') {
        // Validate the parsed document
        this.validateSpec(document, spec, diagnostics);
      }
    } catch (error) {
      // YAML syntax error
      const yamlError = error as yaml.YAMLException;
      const diagnostic = this.createYamlErrorDiagnostic(document, yamlError);
      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private validateSpec(document: vscode.TextDocument, spec: TSpecDocument, diagnostics: vscode.Diagnostic[]): void {
    const strict = vscode.workspace.getConfiguration('tspec').get('validation.strictMode', false);

    // Required top-level fields
    this.validateRequiredField(document, spec, 'version', diagnostics);
    this.validateRequiredField(document, spec, 'description', diagnostics);
    this.validateRequiredField(document, spec, 'metadata', diagnostics);
    this.validateRequiredField(document, spec, 'assertions', diagnostics);

    // Version validation
    if (spec.version && spec.version !== '1.0') {
      this.addDiagnostic(document, 'version', `Invalid version: "${spec.version}". Currently only "1.0" is supported.`, vscode.DiagnosticSeverity.Error, diagnostics);
    }

    // Protocol block validation
    const hasProtocol = PROTOCOL_BLOCKS.some(p => p in spec);
    if (!hasProtocol) {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        'Missing protocol block (http, grpc, graphql, or websocket)',
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.source = 'tspec';
      diagnostics.push(diagnostic);
    }

    // Metadata validation
    if (spec.metadata) {
      this.validateMetadata(document, spec.metadata, diagnostics);
    }

    // HTTP validation
    if (spec.http) {
      this.validateHttp(document, spec.http, diagnostics);
    }

    // gRPC validation
    if (spec.grpc) {
      this.validateGrpc(document, spec.grpc, diagnostics);
    }

    // GraphQL validation
    if (spec.graphql) {
      this.validateGraphql(document, spec.graphql, diagnostics);
    }

    // WebSocket validation
    if (spec.websocket) {
      this.validateWebsocket(document, spec.websocket, diagnostics);
    }

    // Assertions validation
    if (spec.assertions) {
      this.validateAssertions(document, spec.assertions, diagnostics, strict);
    }

    // Data validation
    if (spec.data) {
      this.validateData(document, spec.data, diagnostics);
    }
  }

  private validateMetadata(document: vscode.TextDocument, metadata: TSpecDocument['metadata'], diagnostics: vscode.Diagnostic[]): void {
    if (!metadata) return;

    const requiredFields = ['prompt', 'related_code', 'test_category', 'risk_level', 'tags', 'priority', 'timeout'];
    for (const field of requiredFields) {
      if (!(field in metadata)) {
        this.addDiagnostic(document, 'metadata', `Missing required metadata field: ${field}`, vscode.DiagnosticSeverity.Error, diagnostics);
      }
    }

    // Validate enum values
    if (metadata.test_category && !VALID_CATEGORIES.includes(metadata.test_category)) {
      this.addDiagnostic(document, 'test_category', `Invalid test_category: "${metadata.test_category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`, vscode.DiagnosticSeverity.Error, diagnostics);
    }

    if (metadata.risk_level && !VALID_RISK_LEVELS.includes(metadata.risk_level)) {
      this.addDiagnostic(document, 'risk_level', `Invalid risk_level: "${metadata.risk_level}". Must be one of: ${VALID_RISK_LEVELS.join(', ')}`, vscode.DiagnosticSeverity.Error, diagnostics);
    }

    if (metadata.priority && !VALID_PRIORITIES.includes(metadata.priority)) {
      this.addDiagnostic(document, 'priority', `Invalid priority: "${metadata.priority}". Must be one of: ${VALID_PRIORITIES.join(', ')}`, vscode.DiagnosticSeverity.Error, diagnostics);
    }

    // Validate array types
    if (metadata.related_code && !Array.isArray(metadata.related_code)) {
      this.addDiagnostic(document, 'related_code', 'related_code must be an array', vscode.DiagnosticSeverity.Error, diagnostics);
    }

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      this.addDiagnostic(document, 'tags', 'tags must be an array', vscode.DiagnosticSeverity.Error, diagnostics);
    }

    // Validate timeout format
    if (metadata.timeout && typeof metadata.timeout === 'string') {
      if (!/^\d+(?:ms|s|m|h)$/.test(metadata.timeout)) {
        this.addDiagnostic(document, 'timeout', `Invalid timeout format: "${metadata.timeout}". Use format like "10s", "500ms", "1m"`, vscode.DiagnosticSeverity.Warning, diagnostics);
      }
    }
  }

  private validateHttp(document: vscode.TextDocument, http: TSpecDocument['http'], diagnostics: vscode.Diagnostic[]): void {
    if (!http) return;

    if (!http.method) {
      this.addDiagnostic(document, 'http', 'http.method is required', vscode.DiagnosticSeverity.Error, diagnostics);
    } else if (!VALID_HTTP_METHODS.includes(http.method.toUpperCase())) {
      this.addDiagnostic(document, 'method', `Invalid HTTP method: "${http.method}". Must be one of: ${VALID_HTTP_METHODS.join(', ')}`, vscode.DiagnosticSeverity.Error, diagnostics);
    }

    if (!http.path) {
      this.addDiagnostic(document, 'http', 'http.path is required', vscode.DiagnosticSeverity.Error, diagnostics);
    }
  }

  private validateGrpc(document: vscode.TextDocument, grpc: TSpecDocument['grpc'], diagnostics: vscode.Diagnostic[]): void {
    if (!grpc) return;

    if (!grpc.service) {
      this.addDiagnostic(document, 'grpc', 'grpc.service is required', vscode.DiagnosticSeverity.Error, diagnostics);
    }

    if (!grpc.method) {
      this.addDiagnostic(document, 'grpc', 'grpc.method is required', vscode.DiagnosticSeverity.Error, diagnostics);
    }
  }

  private validateGraphql(document: vscode.TextDocument, graphql: TSpecDocument['graphql'], diagnostics: vscode.Diagnostic[]): void {
    if (!graphql) return;

    if (!graphql.query) {
      this.addDiagnostic(document, 'graphql', 'graphql.query is required', vscode.DiagnosticSeverity.Error, diagnostics);
    }
  }

  private validateWebsocket(document: vscode.TextDocument, websocket: TSpecDocument['websocket'], diagnostics: vscode.Diagnostic[]): void {
    if (!websocket) return;

    if (!websocket.url) {
      this.addDiagnostic(document, 'websocket', 'websocket.url is required', vscode.DiagnosticSeverity.Error, diagnostics);
    }
  }

  private validateAssertions(document: vscode.TextDocument, assertions: TSpecDocument['assertions'], diagnostics: vscode.Diagnostic[], strict: boolean): void {
    if (!assertions) return;

    if (!Array.isArray(assertions)) {
      this.addDiagnostic(document, 'assertions', 'assertions must be an array', vscode.DiagnosticSeverity.Error, diagnostics);
      return;
    }

    if (assertions.length === 0) {
      this.addDiagnostic(document, 'assertions', 'No assertions defined - test will always pass', vscode.DiagnosticSeverity.Warning, diagnostics);
    }

    assertions.forEach((assertion, index) => {
      if (!assertion.type && !assertion.include) {
        this.addDiagnostic(document, 'assertions', `assertions[${index}]: must have either 'type' or 'include'`, vscode.DiagnosticSeverity.Error, diagnostics);
      }

      if (assertion.type && !VALID_ASSERTION_TYPES.includes(assertion.type)) {
        this.addDiagnostic(document, 'type', `Invalid assertion type: "${assertion.type}". Must be one of: ${VALID_ASSERTION_TYPES.join(', ')}`, vscode.DiagnosticSeverity.Error, diagnostics);
      }

      // Deprecation warning for old assertion types
      if (assertion.type && DEPRECATED_ASSERTION_TYPES.includes(assertion.type)) {
        const hint = DEPRECATED_TYPE_HINTS[assertion.type] || 'Use json_path instead';
        this.addDiagnostic(document, 'type', `Assertion type "${assertion.type}" is deprecated. ${hint}`, vscode.DiagnosticSeverity.Warning, diagnostics);
      }

      if (assertion.operator && !VALID_OPERATORS.includes(assertion.operator)) {
        this.addDiagnostic(document, 'operator', `Invalid operator: "${assertion.operator}". Must be one of: ${VALID_OPERATORS.join(', ')}`, vscode.DiagnosticSeverity.Error, diagnostics);
      }
    });
  }

  private validateData(document: vscode.TextDocument, data: TSpecDocument['data'], diagnostics: vscode.Diagnostic[]): void {
    if (!data) return;

    if (data.format && !VALID_DATA_FORMATS.includes(data.format.toLowerCase())) {
      this.addDiagnostic(document, 'format', `Invalid data format: "${data.format}". Must be one of: ${VALID_DATA_FORMATS.join(', ')}`, vscode.DiagnosticSeverity.Error, diagnostics);
    }
  }

  private validateRequiredField(document: vscode.TextDocument, spec: TSpecDocument, field: string, diagnostics: vscode.Diagnostic[]): void {
    if (!(field in spec)) {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `Missing required field: ${field}`,
        vscode.DiagnosticSeverity.Error
      );
      diagnostic.source = 'tspec';
      diagnostics.push(diagnostic);
    }
  }

  private addDiagnostic(document: vscode.TextDocument, key: string, message: string, severity: vscode.DiagnosticSeverity, diagnostics: vscode.Diagnostic[]): void {
    const position = YamlHelper.findKeyPosition(document, key);
    const range = position 
      ? new vscode.Range(position, position.translate(0, key.length))
      : new vscode.Range(0, 0, 0, 0);
    
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = 'tspec';
    diagnostics.push(diagnostic);
  }

  private createYamlErrorDiagnostic(document: vscode.TextDocument, error: yaml.YAMLException): vscode.Diagnostic {
    let range: vscode.Range;
    
    if (error.mark) {
      const line = error.mark.line || 0;
      const column = error.mark.column || 0;
      range = new vscode.Range(line, column, line, column + 1);
    } else {
      range = new vscode.Range(0, 0, 0, 0);
    }
    
    const diagnostic = new vscode.Diagnostic(
      range,
      `YAML syntax error: ${error.message}`,
      vscode.DiagnosticSeverity.Error
    );
    diagnostic.source = 'tspec';
    return diagnostic;
  }
}
