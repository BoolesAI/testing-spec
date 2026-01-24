"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const vscode = require("vscode");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const vscode__namespace = /* @__PURE__ */ _interopNamespaceDefault(vscode);
class YamlHelper {
  /**
   * Get the YAML context at the current cursor position
   */
  static getContext(document, position) {
    const lineText = document.lineAt(position.line).text;
    const linePrefix = lineText.substring(0, position.character);
    const inVariable = this.isInsideVariable(linePrefix);
    const isValuePosition = linePrefix.includes(":");
    let currentKey;
    const keyMatch = lineText.match(/^\s*(\w+):/);
    if (keyMatch) {
      currentKey = keyMatch[1];
    }
    const keyPath = this.getKeyPath(document, position);
    const type2 = this.determineContextType(keyPath, position, document);
    return {
      type: type2,
      keyPath,
      isValuePosition,
      currentKey,
      inVariable
    };
  }
  /**
   * Check if cursor is inside a variable interpolation ${...}
   */
  static isInsideVariable(linePrefix) {
    const lastOpen = linePrefix.lastIndexOf("${");
    if (lastOpen === -1) return false;
    const lastClose = linePrefix.lastIndexOf("}", linePrefix.length);
    return lastClose < lastOpen;
  }
  /**
   * Get the key path from root to current position
   */
  static getKeyPath(document, position) {
    const path = [];
    const currentIndent = this.getIndentLevel(document.lineAt(position.line).text);
    for (let i = position.line; i >= 0; i--) {
      const line = document.lineAt(i).text;
      this.getIndentLevel(line);
      if (line.trim() === "" || line.trim().startsWith("#")) continue;
      const keyMatch = line.match(/^(\s*)(\w+):/);
      if (keyMatch) {
        const keyIndent = keyMatch[1].length;
        if (keyIndent < currentIndent || i === position.line && keyIndent <= currentIndent) {
          if (path.length === 0 || keyIndent < this.getIndentLevel(document.lineAt(path.length > 0 ? position.line : i).text)) {
            path.unshift(keyMatch[2]);
          }
        }
        if (keyIndent === 0) break;
      }
    }
    return path;
  }
  /**
   * Get indentation level of a line
   */
  static getIndentLevel(line) {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }
  /**
   * Determine the context type based on key path
   */
  static determineContextType(keyPath, position, document) {
    if (keyPath.length === 0) return "top-level";
    const root = keyPath[0];
    switch (root) {
      case "metadata":
        return "metadata";
      case "http":
        return keyPath.includes("body") ? "body" : "http";
      case "grpc":
        return "grpc";
      case "graphql":
        return "graphql";
      case "websocket":
        return "websocket";
      case "environment":
        return "environment";
      case "assertions":
        return keyPath.length > 1 ? "assertion-item" : "assertions";
      case "data":
        return "data";
      case "lifecycle":
        return "lifecycle";
      case "output":
        return "output";
      case "extract":
        return "extract";
      case "variables":
        return "variables";
      default:
        return "unknown";
    }
  }
  /**
   * Find the position of a key in the document
   */
  static findKeyPosition(document, key) {
    const text = document.getText();
    const regex = new RegExp(`^\\s*${key}:`, "m");
    const match = regex.exec(text);
    if (match) {
      const pos = document.positionAt(match.index);
      return pos;
    }
    return null;
  }
  /**
   * Get all defined variable names from the variables section
   */
  static getDefinedVariables(document) {
    const text = document.getText();
    const variables = [];
    const variablesMatch = text.match(/^variables:\s*\n((?:[ \t]+\w+:.*\n?)*)/m);
    if (variablesMatch) {
      const variablesContent = variablesMatch[1];
      const varMatches = variablesContent.matchAll(/^\s+(\w+):/gm);
      for (const match of varMatches) {
        variables.push(match[1]);
      }
    }
    return variables;
  }
  /**
   * Get all extracted variable names from the extract section
   */
  static getExtractedVariables(document) {
    const text = document.getText();
    const variables = [];
    const extractMatch = text.match(/^extract:\s*\n((?:[ \t]+\w+:.*\n?)*)/m);
    if (extractMatch) {
      const extractContent = extractMatch[1];
      const varMatches = extractContent.matchAll(/^\s+(\w+):/gm);
      for (const match of varMatches) {
        variables.push(match[1]);
      }
    }
    return variables;
  }
}
const TOP_LEVEL_FIELDS = [
  { key: "version", required: true, type: "string", description: 'TSpec format version (currently "1.0")' },
  { key: "description", required: true, type: "string", description: "Test case description" },
  { key: "metadata", required: true, type: "object", description: "Test metadata and classification" },
  { key: "environment", required: false, type: "object", description: "Environment configuration" },
  { key: "variables", required: false, type: "object", description: "Variable definitions" },
  { key: "data", required: false, type: "object", description: "Data-driven testing configuration" },
  { key: "extends", required: false, type: "string", description: "Template file to extend" },
  { key: "lifecycle", required: false, type: "object", description: "Setup and teardown hooks" },
  { key: "http", required: false, type: "object", description: "HTTP request configuration" },
  { key: "grpc", required: false, type: "object", description: "gRPC request configuration" },
  { key: "graphql", required: false, type: "object", description: "GraphQL request configuration" },
  { key: "websocket", required: false, type: "object", description: "WebSocket request configuration" },
  { key: "assertions", required: true, type: "array", description: "Test assertions" },
  { key: "extract", required: false, type: "object", description: "Response data extraction" },
  { key: "output", required: false, type: "object", description: "Output configuration" }
];
const METADATA_FIELDS = [
  { key: "ai_prompt", required: true, type: "string", description: "Natural language test description for AI" },
  { key: "related_code", required: true, type: "array", description: "Paths to related source files" },
  { key: "test_category", required: true, type: "enum", description: "Test category", values: ["functional", "integration", "performance", "security"] },
  { key: "risk_level", required: true, type: "enum", description: "Risk level", values: ["low", "medium", "high", "critical"] },
  { key: "tags", required: true, type: "array", description: "Tags for filtering and grouping" },
  { key: "priority", required: true, type: "enum", description: "Test priority", values: ["low", "medium", "high"] },
  { key: "timeout", required: true, type: "string", description: 'Test timeout (e.g., "10s", "500ms")' },
  { key: "business_rule", required: false, type: "string", description: "Business rule reference" }
];
const HTTP_FIELDS = [
  { key: "method", required: true, type: "enum", description: "HTTP method", values: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] },
  { key: "path", required: true, type: "string", description: "Request path" },
  { key: "headers", required: false, type: "object", description: "Request headers" },
  { key: "query", required: false, type: "object", description: "Query parameters" },
  { key: "body", required: false, type: "object", description: "Request body" }
];
const GRPC_FIELDS = [
  { key: "service", required: true, type: "string", description: "gRPC service name" },
  { key: "method", required: true, type: "string", description: "gRPC method name" },
  { key: "message", required: false, type: "object", description: "gRPC message payload" }
];
const GRAPHQL_FIELDS = [
  { key: "query", required: true, type: "string", description: "GraphQL query" },
  { key: "variables", required: false, type: "object", description: "Query variables" }
];
const WEBSOCKET_FIELDS = [
  { key: "url", required: true, type: "string", description: "WebSocket URL" },
  { key: "messages", required: false, type: "array", description: "Messages to send" }
];
const ENVIRONMENT_FIELDS = [
  { key: "name", required: false, type: "string", description: "Environment name" },
  { key: "host", required: false, type: "string", description: "API host" },
  { key: "scheme", required: false, type: "enum", description: "URL scheme", values: ["http", "https"] },
  { key: "port", required: false, type: "string", description: "Port number" },
  { key: "variables", required: false, type: "object", description: "Environment-specific variables" }
];
const ASSERTION_FIELDS = [
  { key: "type", required: true, type: "enum", description: "Assertion type", values: ["status_code", "grpc_code", "response_time", "json_path", "header", "proto_field", "javascript", "include"] },
  { key: "expected", required: false, type: "any", description: "Expected value" },
  { key: "expression", required: false, type: "string", description: "JSONPath expression" },
  { key: "operator", required: false, type: "enum", description: "Comparison operator", values: ["equals", "eq", "not_equals", "neq", "exists", "not_exists", "not_empty", "contains", "not_contains", "matches", "gt", "gte", "lt", "lte", "type", "length"] },
  { key: "path", required: false, type: "string", description: "Field path" },
  { key: "name", required: false, type: "string", description: "Header name" },
  { key: "value", required: false, type: "any", description: "Header value" },
  { key: "pattern", required: false, type: "string", description: "Regex pattern" },
  { key: "max_ms", required: false, type: "number", description: "Maximum response time in ms" },
  { key: "source", required: false, type: "string", description: "JavaScript source code" },
  { key: "message", required: false, type: "string", description: "Custom failure message" },
  { key: "include", required: false, type: "string", description: "Path to assertion library" }
];
const DATA_FIELDS = [
  { key: "source", required: false, type: "string", description: "Path to data file" },
  { key: "format", required: false, type: "enum", description: "Data format", values: ["csv", "json", "yaml"] },
  { key: "driver", required: false, type: "string", description: "Driver mode" },
  { key: "current_row", required: false, type: "number", description: "Current row index" }
];
const LIFECYCLE_FIELDS = [
  { key: "setup", required: false, type: "array", description: "Pre-test actions" },
  { key: "teardown", required: false, type: "array", description: "Post-test actions" }
];
const OUTPUT_FIELDS = [
  { key: "save_response_on_failure", required: false, type: "boolean", description: "Save response on test failure" },
  { key: "metrics", required: false, type: "array", description: "Metrics to report" },
  { key: "notifications", required: false, type: "array", description: "Notification configuration" }
];
const VARIABLE_FUNCTIONS = [
  { name: "uuid", description: "Generate UUID v4" },
  { name: "timestamp", description: "Current Unix timestamp in milliseconds" },
  { name: "now", description: "Current timestamp" },
  { name: "random_int(min,max)", description: "Random integer in range" }
];
function createCompletionItem(label, kind, detail, documentation, insertText) {
  const item = new vscode__namespace.CompletionItem(label, kind);
  if (detail) item.detail = detail;
  if (documentation) item.documentation = new vscode__namespace.MarkdownString(documentation);
  if (insertText) item.insertText = insertText;
  return item;
}
function createFieldCompletions(fields, kind = vscode__namespace.CompletionItemKind.Property) {
  return fields.map((field) => {
    const item = createCompletionItem(
      field.key,
      kind,
      field.required ? "(required)" : "(optional)",
      field.description
    );
    if (field.type === "enum" && field.values) {
      item.insertText = new vscode__namespace.SnippetString(`${field.key}: "\${1|${field.values.join(",")}|}"`);
    } else if (field.type === "array") {
      item.insertText = new vscode__namespace.SnippetString(`${field.key}:
  - $0`);
    } else if (field.type === "object") {
      item.insertText = new vscode__namespace.SnippetString(`${field.key}:
  $0`);
    } else {
      item.insertText = new vscode__namespace.SnippetString(`${field.key}: $0`);
    }
    item.sortText = field.required ? `0_${field.key}` : `1_${field.key}`;
    return item;
  });
}
function createEnumCompletions(values, kind = vscode__namespace.CompletionItemKind.EnumMember) {
  return values.map((value) => {
    const item = createCompletionItem(value, kind, void 0, void 0, `"${value}"`);
    return item;
  });
}
class TSpecCompletionProvider {
  provideCompletionItems(document, position, token, context) {
    const yamlContext = YamlHelper.getContext(document, position);
    if (yamlContext.inVariable) {
      return this.getVariableCompletions(document);
    }
    if (yamlContext.isValuePosition && yamlContext.currentKey) {
      const enumCompletions = this.getEnumCompletions(yamlContext.currentKey, yamlContext.type);
      if (enumCompletions.length > 0) {
        return enumCompletions;
      }
    }
    return this.getKeyCompletions(yamlContext);
  }
  getKeyCompletions(context) {
    switch (context.type) {
      case "top-level":
        return createFieldCompletions(TOP_LEVEL_FIELDS, vscode__namespace.CompletionItemKind.Keyword);
      case "metadata":
        return createFieldCompletions(METADATA_FIELDS);
      case "http":
        return createFieldCompletions(HTTP_FIELDS);
      case "grpc":
        return createFieldCompletions(GRPC_FIELDS);
      case "graphql":
        return createFieldCompletions(GRAPHQL_FIELDS);
      case "websocket":
        return createFieldCompletions(WEBSOCKET_FIELDS);
      case "environment":
        return createFieldCompletions(ENVIRONMENT_FIELDS);
      case "assertions":
      case "assertion-item":
        return createFieldCompletions(ASSERTION_FIELDS);
      case "data":
        return createFieldCompletions(DATA_FIELDS);
      case "lifecycle":
        return createFieldCompletions(LIFECYCLE_FIELDS);
      case "output":
        return createFieldCompletions(OUTPUT_FIELDS);
      case "body":
        return [
          createCompletionItem("json", vscode__namespace.CompletionItemKind.Property, "JSON body", "JSON request body", new vscode__namespace.SnippetString("json:\n  $0")),
          createCompletionItem("form", vscode__namespace.CompletionItemKind.Property, "Form body", "Form-encoded request body", new vscode__namespace.SnippetString("form:\n  $0")),
          createCompletionItem("raw", vscode__namespace.CompletionItemKind.Property, "Raw body", "Raw text request body", new vscode__namespace.SnippetString('raw: "$0"'))
        ];
      default:
        return [];
    }
  }
  getEnumCompletions(key, contextType) {
    if (key === "test_category") {
      return createEnumCompletions(["functional", "integration", "performance", "security"]);
    }
    if (key === "risk_level") {
      return createEnumCompletions(["low", "medium", "high", "critical"]);
    }
    if (key === "priority") {
      return createEnumCompletions(["low", "medium", "high"]);
    }
    if (key === "method" && contextType === "http") {
      return createEnumCompletions(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]);
    }
    if (key === "scheme") {
      return createEnumCompletions(["http", "https"]);
    }
    if (key === "type" && (contextType === "assertions" || contextType === "assertion-item")) {
      return createEnumCompletions(["status_code", "grpc_code", "response_time", "json_path", "header", "proto_field", "javascript", "include"]);
    }
    if (key === "operator") {
      return createEnumCompletions(["equals", "eq", "not_equals", "neq", "exists", "not_exists", "not_empty", "contains", "not_contains", "matches", "gt", "gte", "lt", "lte", "type", "length"]);
    }
    if (key === "format" && contextType === "data") {
      return createEnumCompletions(["csv", "json", "yaml"]);
    }
    return [];
  }
  getVariableCompletions(document) {
    const items = [];
    for (const func of VARIABLE_FUNCTIONS) {
      const item = createCompletionItem(
        func.name,
        vscode__namespace.CompletionItemKind.Function,
        "Built-in function",
        func.description
      );
      items.push(item);
    }
    const envItem = createCompletionItem(
      "env.",
      vscode__namespace.CompletionItemKind.Module,
      "Environment variable",
      "Reference environment variable: env.VAR_NAME"
    );
    items.push(envItem);
    const extractItem = createCompletionItem(
      "extract.",
      vscode__namespace.CompletionItemKind.Module,
      "Extracted value",
      "Reference extracted value: extract.variable_name"
    );
    items.push(extractItem);
    const definedVars = YamlHelper.getDefinedVariables(document);
    for (const varName of definedVars) {
      const item = createCompletionItem(
        varName,
        vscode__namespace.CompletionItemKind.Variable,
        "User variable",
        `Variable defined in variables section`
      );
      items.push(item);
    }
    const extractedVars = YamlHelper.getExtractedVariables(document);
    for (const varName of extractedVars) {
      const item = createCompletionItem(
        `extract.${varName}`,
        vscode__namespace.CompletionItemKind.Variable,
        "Extracted value",
        `Value extracted from response`
      );
      items.push(item);
    }
    return items;
  }
}
function isNothing(subject) {
  return typeof subject === "undefined" || subject === null;
}
function isObject(subject) {
  return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];
  return [sequence];
}
function extend(target, source) {
  var index, length, key, sourceKeys;
  if (source) {
    sourceKeys = Object.keys(source);
    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }
  return target;
}
function repeat(string, count) {
  var result = "", cycle;
  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }
  return result;
}
function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
var isNothing_1 = isNothing;
var isObject_1 = isObject;
var toArray_1 = toArray;
var repeat_1 = repeat;
var isNegativeZero_1 = isNegativeZero;
var extend_1 = extend;
var common = {
  isNothing: isNothing_1,
  isObject: isObject_1,
  toArray: toArray_1,
  repeat: repeat_1,
  isNegativeZero: isNegativeZero_1,
  extend: extend_1
};
function formatError(exception2, compact) {
  var where = "", message = exception2.reason || "(unknown reason)";
  if (!exception2.mark) return message;
  if (exception2.mark.name) {
    where += 'in "' + exception2.mark.name + '" ';
  }
  where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
  if (!compact && exception2.mark.snippet) {
    where += "\n\n" + exception2.mark.snippet;
  }
  return message + " " + where;
}
function YAMLException$1(reason, mark) {
  Error.call(this);
  this.name = "YAMLException";
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || "";
  }
}
YAMLException$1.prototype = Object.create(Error.prototype);
YAMLException$1.prototype.constructor = YAMLException$1;
YAMLException$1.prototype.toString = function toString(compact) {
  return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$1;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = "";
  var tail = "";
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
    pos: position - lineStart + head.length
    // relative position
  };
}
function padStart(string, max) {
  return common.repeat(" ", max - string.length) + string;
}
function makeSnippet(mark, options) {
  options = Object.create(options || null);
  if (!mark.buffer) return null;
  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent !== "number") options.indent = 1;
  if (typeof options.linesBefore !== "number") options.linesBefore = 3;
  if (typeof options.linesAfter !== "number") options.linesAfter = 2;
  var re = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;
  while (match = re.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  var result = "", i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
  }
  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  }
  return result.replace(/\n$/, "");
}
var snippet = makeSnippet;
var TYPE_CONSTRUCTOR_OPTIONS = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
];
var YAML_NODE_KINDS = [
  "scalar",
  "sequence",
  "mapping"
];
function compileStyleAliases(map2) {
  var result = {};
  if (map2 !== null) {
    Object.keys(map2).forEach(function(style) {
      map2[style].forEach(function(alias) {
        result[String(alias)] = style;
      });
    });
  }
  return result;
}
function Type$1(tag, options) {
  options = options || {};
  Object.keys(options).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });
  this.options = options;
  this.tag = tag;
  this.kind = options["kind"] || null;
  this.resolve = options["resolve"] || function() {
    return true;
  };
  this.construct = options["construct"] || function(data) {
    return data;
  };
  this.instanceOf = options["instanceOf"] || null;
  this.predicate = options["predicate"] || null;
  this.represent = options["represent"] || null;
  this.representName = options["representName"] || null;
  this.defaultStyle = options["defaultStyle"] || null;
  this.multi = options["multi"] || false;
  this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}
var type = Type$1;
function compileList(schema2, name) {
  var result = [];
  schema2[name].forEach(function(currentType) {
    var newIndex = result.length;
    result.forEach(function(previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result[newIndex] = currentType;
  });
  return result;
}
function compileMap() {
  var result = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, index, length;
  function collectType(type2) {
    if (type2.multi) {
      result.multi[type2.kind].push(type2);
      result.multi["fallback"].push(type2);
    } else {
      result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
    }
  }
  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}
function Schema$1(definition) {
  return this.extend(definition);
}
Schema$1.prototype.extend = function extend2(definition) {
  var implicit = [];
  var explicit = [];
  if (definition instanceof type) {
    explicit.push(definition);
  } else if (Array.isArray(definition)) {
    explicit = explicit.concat(definition);
  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);
  } else {
    throw new exception("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  }
  implicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
    if (type$1.loadKind && type$1.loadKind !== "scalar") {
      throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    }
    if (type$1.multi) {
      throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }
  });
  explicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
  });
  var result = Object.create(Schema$1.prototype);
  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);
  result.compiledImplicit = compileList(result, "implicit");
  result.compiledExplicit = compileList(result, "explicit");
  result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  return result;
};
var schema = Schema$1;
var str = new type("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(data) {
    return data !== null ? data : "";
  }
});
var seq = new type("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(data) {
    return data !== null ? data : [];
  }
});
var map = new type("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(data) {
    return data !== null ? data : {};
  }
});
var failsafe = new schema({
  explicit: [
    str,
    seq,
    map
  ]
});
function resolveYamlNull(data) {
  if (data === null) return true;
  var max = data.length;
  return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
var _null = new type("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
function resolveYamlBoolean(data) {
  if (data === null) return false;
  var max = data.length;
  return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
  return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
  return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new type("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function(object) {
      return object ? "true" : "false";
    },
    uppercase: function(object) {
      return object ? "TRUE" : "FALSE";
    },
    camelcase: function(object) {
      return object ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
function isHexCode(c) {
  return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
  return 48 <= c && c <= 55;
}
function isDecCode(c) {
  return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
  if (data === null) return false;
  var max = data.length, index = 0, hasDigits = false, ch;
  if (!max) return false;
  ch = data[index];
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }
  if (ch === "0") {
    if (index + 1 === max) return true;
    ch = data[++index];
    if (ch === "b") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (ch !== "0" && ch !== "1") return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "x") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "o") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
  }
  if (ch === "_") return false;
  for (; index < max; index++) {
    ch = data[index];
    if (ch === "_") continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }
  if (!hasDigits || ch === "_") return false;
  return true;
}
function constructYamlInteger(data) {
  var value = data, sign = 1, ch;
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }
  ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-") sign = -1;
    value = value.slice(1);
    ch = value[0];
  }
  if (value === "0") return 0;
  if (ch === "0") {
    if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
    if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
  }
  return sign * parseInt(value, 10);
}
function isInteger(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
}
var int = new type("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary: function(obj) {
      return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
    },
    octal: function(obj) {
      return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
    },
    decimal: function(obj) {
      return obj.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(obj) {
      return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function resolveYamlFloat(data) {
  if (data === null) return false;
  if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  data[data.length - 1] === "_") {
    return false;
  }
  return true;
}
function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, "").toLowerCase();
  sign = value[0] === "-" ? -1 : 1;
  if ("+-".indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }
  if (value === ".inf") {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === ".nan") {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
  var res;
  if (isNaN(object)) {
    switch (style) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  } else if (common.isNegativeZero(object)) {
    return "-0.0";
  }
  res = object.toString(10);
  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
}
var float = new type("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: "lowercase"
});
var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});
var core = json;
var YAML_DATE_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
);
var YAML_TIMESTAMP_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}
function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null) throw new Error("Date resolve error");
  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];
  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }
  hour = +match[4];
  minute = +match[5];
  second = +match[6];
  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) {
      fraction += "0";
    }
    fraction = +fraction;
  }
  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 6e4;
    if (match[9] === "-") delta = -delta;
  }
  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta) date.setTime(date.getTime() - delta);
  return date;
}
function representYamlTimestamp(object) {
  return object.toISOString();
}
var timestamp = new type("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});
function resolveYamlMerge(data) {
  return data === "<<" || data === null;
}
var merge = new type("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary(data) {
  if (data === null) return false;
  var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    code = map2.indexOf(data.charAt(idx));
    if (code > 64) continue;
    if (code < 0) return false;
    bitlen += 6;
  }
  return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
  var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result = [];
  for (idx = 0; idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    }
    bits = bits << 6 | map2.indexOf(input.charAt(idx));
  }
  tailbits = max % 4 * 6;
  if (tailbits === 0) {
    result.push(bits >> 16 & 255);
    result.push(bits >> 8 & 255);
    result.push(bits & 255);
  } else if (tailbits === 18) {
    result.push(bits >> 10 & 255);
    result.push(bits >> 2 & 255);
  } else if (tailbits === 12) {
    result.push(bits >> 4 & 255);
  }
  return new Uint8Array(result);
}
function representYamlBinary(object) {
  var result = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    }
    bits = (bits << 8) + object[idx];
  }
  tail = max % 3;
  if (tail === 0) {
    result += map2[bits >> 18 & 63];
    result += map2[bits >> 12 & 63];
    result += map2[bits >> 6 & 63];
    result += map2[bits & 63];
  } else if (tail === 2) {
    result += map2[bits >> 10 & 63];
    result += map2[bits >> 4 & 63];
    result += map2[bits << 2 & 63];
    result += map2[64];
  } else if (tail === 1) {
    result += map2[bits >> 2 & 63];
    result += map2[bits << 4 & 63];
    result += map2[64];
    result += map2[64];
  }
  return result;
}
function isBinary(obj) {
  return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new type("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;
function resolveYamlOmap(data) {
  if (data === null) return true;
  var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== "[object Object]") return false;
    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }
    if (!pairHasKey) return false;
    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }
  return true;
}
function constructYamlOmap(data) {
  return data !== null ? data : [];
}
var omap = new type("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});
var _toString$1 = Object.prototype.toString;
function resolveYamlPairs(data) {
  if (data === null) return true;
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== "[object Object]") return false;
    keys = Object.keys(pair);
    if (keys.length !== 1) return false;
    result[index] = [keys[0], pair[keys[0]]];
  }
  return true;
}
function constructYamlPairs(data) {
  if (data === null) return [];
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);
    result[index] = [keys[0], pair[keys[0]]];
  }
  return result;
}
var pairs = new type("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
function resolveYamlSet(data) {
  if (data === null) return true;
  var key, object = data;
  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }
  return true;
}
function constructYamlSet(data) {
  return data !== null ? data : {};
}
var set = new type("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: resolveYamlSet,
  construct: constructYamlSet
});
var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});
var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
  return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
  return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
  return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
  var lc;
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  lc = c | 32;
  if (97 <= lc && lc <= 102) {
    return lc - 97 + 10;
  }
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) {
    return 2;
  }
  if (c === 117) {
    return 4;
  }
  if (c === 85) {
    return 8;
  }
  return 0;
}
function fromDecimalCode(c) {
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  return -1;
}
function simpleEscapeSequence(c) {
  return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "" : c === 95 ? " " : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
  if (c <= 65535) {
    return String.fromCharCode(c);
  }
  return String.fromCharCode(
    (c - 65536 >> 10) + 55296,
    (c - 65536 & 1023) + 56320
  );
}
function setProperty(object, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value
    });
  } else {
    object[key] = value;
  }
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function State$1(input, options) {
  this.input = input;
  this.filename = options["filename"] || null;
  this.schema = options["schema"] || _default;
  this.onWarning = options["onWarning"] || null;
  this.legacy = options["legacy"] || false;
  this.json = options["json"] || false;
  this.listener = options["listener"] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;
  this.firstTabInLine = -1;
  this.documents = [];
}
function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    // omit trailing \0
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = snippet(mark);
  return new exception(message, mark);
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}
var directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    var match, major, minor;
    if (state.version !== null) {
      throwError(state, "duplication of %YAML directive");
    }
    if (args.length !== 1) {
      throwError(state, "YAML directive accepts exactly one argument");
    }
    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) {
      throwError(state, "ill-formed argument of the YAML directive");
    }
    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);
    if (major !== 1) {
      throwError(state, "unacceptable YAML version of the document");
    }
    state.version = args[0];
    state.checkLineBreaks = minor < 2;
    if (minor !== 1 && minor !== 2) {
      throwWarning(state, "unsupported YAML version of the document");
    }
  },
  TAG: function handleTagDirective(state, name, args) {
    var handle, prefix;
    if (args.length !== 2) {
      throwError(state, "TAG directive accepts exactly two arguments");
    }
    handle = args[0];
    prefix = args[1];
    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    }
    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }
    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    }
    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, "tag prefix is malformed: " + prefix);
    }
    state.tagMap[handle] = prefix;
  }
};
function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;
  if (start < end) {
    _result = state.input.slice(start, end);
    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, "the stream contains non-printable characters");
    }
    state.result += _result;
  }
}
function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;
  if (!common.isObject(source)) {
    throwError(state, "cannot merge mappings; the provided source object is unacceptable");
  }
  sourceKeys = Object.keys(source);
  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];
    if (!_hasOwnProperty$1.call(destination, key)) {
      setProperty(destination, key, source[key]);
      overridableKeys[key] = true;
    }
  }
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity;
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);
    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
      }
      if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
        keyNode[index] = "[object Object]";
      }
    }
  }
  if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
    keyNode = "[object Object]";
  }
  keyNode = String(keyNode);
  if (_result === null) {
    _result = {};
  }
  if (keyTag === "tag:yaml.org,2002:merge") {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    setProperty(_result, keyNode, valueNode);
    delete overridableKeys[keyNode];
  }
  return _result;
}
function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 10) {
    state.position++;
  } else if (ch === 13) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }
  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 9 && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 10 && ch !== 13 && ch !== 0);
    }
    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;
      while (ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }
  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, "deficient indentation");
  }
  return lineBreaks;
}
function testDocumentSeparator(state) {
  var _position = state.position, ch;
  ch = state.input.charCodeAt(_position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);
    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }
  return false;
}
function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += " ";
  } else if (count > 1) {
    state.result += common.repeat("\n", count - 1);
  }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
  ch = state.input.charCodeAt(state.position);
  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
    return false;
  }
  if (ch === 63 || ch === 45) {
    following = state.input.charCodeAt(state.position + 1);
    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }
  state.kind = "scalar";
  state.result = "";
  captureStart = captureEnd = state.position;
  hasPendingContent = false;
  while (ch !== 0) {
    if (ch === 58) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 35) {
      preceding = state.input.charCodeAt(state.position - 1);
      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);
      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }
    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }
    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }
    ch = state.input.charCodeAt(++state.position);
  }
  captureSegment(state, captureStart, captureEnd, false);
  if (state.result) {
    return true;
  }
  state.kind = _kind;
  state.result = _result;
  return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 39) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 39) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (ch === 39) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a single quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 34) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 34) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 92) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);
          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }
        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }
      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a double quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
  var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 91) {
    terminator = 93;
    isMapping = false;
    _result = [];
  } else if (ch === 123) {
    terminator = 125;
    isMapping = true;
    _result = {};
  } else {
    return false;
  }
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(++state.position);
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    } else if (ch === 44) {
      throwError(state, "expected the node content, but found ','");
    }
    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;
    if (ch === 63) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }
    _line = state.line;
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if ((isExplicitPair || state.line === _line) && ch === 58) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }
    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === 44) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 124) {
    folding = false;
  } else if (ch === 62) {
    folding = true;
  } else {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);
    if (ch === 43 || ch === 45) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }
  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));
    if (ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }
  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);
    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }
    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }
    if (state.lineIndent < textIndent) {
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          state.result += "\n";
        }
      }
      break;
    }
    if (folding) {
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat("\n", emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) {
          state.result += " ";
        }
      } else {
        state.result += common.repeat("\n", emptyLines);
      }
    } else {
      state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
    }
    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;
    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, state.position, false);
  }
  return true;
}
function readBlockSequence(state, nodeIndent) {
  var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    if (ch !== 45) {
      break;
    }
    following = state.input.charCodeAt(state.position + 1);
    if (!is_WS_OR_EOL(following)) {
      break;
    }
    detected = true;
    state.position++;
    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }
    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "sequence";
    state.result = _result;
    return true;
  }
  return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
      if (ch === 63) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
      }
      state.position += 1;
      ch = following;
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;
      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break;
      }
      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!is_WS_OR_EOL(ch)) {
            throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          }
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, "can not read an implicit mapping pair; a colon is missed");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else if (detected) {
        throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    }
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }
      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "mapping";
    state.result = _result;
  }
  return detected;
}
function readTagProperty(state) {
  var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 33) return false;
  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }
  ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }
  _position = state.position;
  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 62);
    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, "named tag handle cannot contain such characters");
          }
          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(_position, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }
  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, "tag name cannot contain such characters: " + tagName);
  }
  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, "tag name is malformed: " + tagName);
  }
  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = "!" + tagName;
  } else if (tagHandle === "!!") {
    state.tag = "tag:yaml.org,2002:" + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }
  return true;
}
function readAnchorProperty(state) {
  var _position, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 38) return false;
  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an anchor node must contain at least one character");
  }
  state.anchor = state.input.slice(_position, state.position);
  return true;
}
function readAlias(state) {
  var _position, alias, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 42) return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an alias node must contain at least one character");
  }
  alias = state.input.slice(_position, state.position);
  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }
  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type2, flowIndent, blockIndent;
  if (state.listener !== null) {
    state.listener("open", state);
  }
  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;
      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }
  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }
  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }
  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }
    blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;
          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;
          if (state.tag === null) {
            state.tag = "?";
          }
        }
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }
  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === "?") {
    if (state.result !== null && state.kind !== "scalar") {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }
    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type2 = state.implicitTypes[typeIndex];
      if (type2.resolve(state.result)) {
        state.result = type2.construct(state.result);
        state.tag = type2.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== "!") {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
      type2 = state.typeMap[state.kind || "fallback"][state.tag];
    } else {
      type2 = null;
      typeList = state.typeMap.multi[state.kind || "fallback"];
      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type2 = typeList[typeIndex];
          break;
        }
      }
    }
    if (!type2) {
      throwError(state, "unknown tag !<" + state.tag + ">");
    }
    if (state.result !== null && type2.kind !== state.kind) {
      throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
    }
    if (!type2.resolve(state.result, state.tag)) {
      throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
    } else {
      state.result = type2.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }
  if (state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
  var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = /* @__PURE__ */ Object.create(null);
  state.anchorMap = /* @__PURE__ */ Object.create(null);
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || ch !== 37) {
      break;
    }
    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];
    if (directiveName.length < 1) {
      throwError(state, "directive name must not be less than one character in length");
    }
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }
      if (is_EOL(ch)) break;
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveArgs.push(state.input.slice(_position, state.position));
    }
    if (ch !== 0) readLineBreak(state);
    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }
  skipSeparationSpace(state, true, -1);
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }
  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);
  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }
  state.documents.push(state.result);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 46) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }
  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}
function loadDocuments(input, options) {
  input = String(input);
  options = options || {};
  if (input.length !== 0) {
    if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
      input += "\n";
    }
    if (input.charCodeAt(0) === 65279) {
      input = input.slice(1);
    }
  }
  var state = new State$1(input, options);
  var nullpos = input.indexOf("\0");
  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, "null byte is not allowed in input");
  }
  state.input += "\0";
  while (state.input.charCodeAt(state.position) === 32) {
    state.lineIndent += 1;
    state.position += 1;
  }
  while (state.position < state.length - 1) {
    readDocument(state);
  }
  return state.documents;
}
function load$1(input, options) {
  var documents = loadDocuments(input, options);
  if (documents.length === 0) {
    return void 0;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new exception("expected a single document in the stream, but found more");
}
var load_1 = load$1;
var loader = {
  load: load_1
};
var load = loader.load;
const VALID_CATEGORIES = ["functional", "integration", "performance", "security"];
const VALID_RISK_LEVELS = ["low", "medium", "high", "critical"];
const VALID_PRIORITIES = ["low", "medium", "high"];
const PROTOCOL_BLOCKS = ["http", "grpc", "graphql", "websocket"];
const VALID_HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
const VALID_ASSERTION_TYPES = ["status_code", "grpc_code", "response_time", "json_path", "header", "proto_field", "javascript", "include"];
const VALID_OPERATORS = ["equals", "eq", "not_equals", "neq", "exists", "not_exists", "not_empty", "contains", "not_contains", "matches", "gt", "gte", "lt", "lte", "type", "length"];
const VALID_DATA_FORMATS = ["csv", "json", "yaml", "yml"];
class TSpecDiagnosticProvider {
  constructor() {
    this.diagnosticCollection = vscode__namespace.languages.createDiagnosticCollection("tspec");
  }
  dispose() {
    this.diagnosticCollection.dispose();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
  validateDocumentDebounced(document) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.validateDocument(document);
    }, 300);
  }
  validateDocument(document) {
    if (document.languageId !== "tspec") {
      return;
    }
    const config = vscode__namespace.workspace.getConfiguration("tspec");
    if (!config.get("validation.enabled", true)) {
      this.diagnosticCollection.set(document.uri, []);
      return;
    }
    const diagnostics = [];
    const text = document.getText();
    if (!text.trim()) {
      this.diagnosticCollection.set(document.uri, []);
      return;
    }
    try {
      const spec = load(text);
      if (spec && typeof spec === "object") {
        this.validateSpec(document, spec, diagnostics);
      }
    } catch (error) {
      const yamlError = error;
      const diagnostic = this.createYamlErrorDiagnostic(document, yamlError);
      diagnostics.push(diagnostic);
    }
    this.diagnosticCollection.set(document.uri, diagnostics);
  }
  validateSpec(document, spec, diagnostics) {
    const strict = vscode__namespace.workspace.getConfiguration("tspec").get("validation.strictMode", false);
    this.validateRequiredField(document, spec, "version", diagnostics);
    this.validateRequiredField(document, spec, "description", diagnostics);
    this.validateRequiredField(document, spec, "metadata", diagnostics);
    this.validateRequiredField(document, spec, "assertions", diagnostics);
    if (spec.version && spec.version !== "1.0") {
      this.addDiagnostic(document, "version", `Invalid version: "${spec.version}". Currently only "1.0" is supported.`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
    const hasProtocol = PROTOCOL_BLOCKS.some((p) => p in spec);
    if (!hasProtocol) {
      const diagnostic = new vscode__namespace.Diagnostic(
        new vscode__namespace.Range(0, 0, 0, 0),
        "Missing protocol block (http, grpc, graphql, or websocket)",
        vscode__namespace.DiagnosticSeverity.Error
      );
      diagnostic.source = "tspec";
      diagnostics.push(diagnostic);
    }
    if (spec.metadata) {
      this.validateMetadata(document, spec.metadata, diagnostics);
    }
    if (spec.http) {
      this.validateHttp(document, spec.http, diagnostics);
    }
    if (spec.grpc) {
      this.validateGrpc(document, spec.grpc, diagnostics);
    }
    if (spec.graphql) {
      this.validateGraphql(document, spec.graphql, diagnostics);
    }
    if (spec.websocket) {
      this.validateWebsocket(document, spec.websocket, diagnostics);
    }
    if (spec.assertions) {
      this.validateAssertions(document, spec.assertions, diagnostics, strict);
    }
    if (spec.data) {
      this.validateData(document, spec.data, diagnostics);
    }
  }
  validateMetadata(document, metadata, diagnostics) {
    if (!metadata) return;
    const requiredFields = ["ai_prompt", "related_code", "test_category", "risk_level", "tags", "priority", "timeout"];
    for (const field of requiredFields) {
      if (!(field in metadata)) {
        this.addDiagnostic(document, "metadata", `Missing required metadata field: ${field}`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
      }
    }
    if (metadata.test_category && !VALID_CATEGORIES.includes(metadata.test_category)) {
      this.addDiagnostic(document, "test_category", `Invalid test_category: "${metadata.test_category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
    if (metadata.risk_level && !VALID_RISK_LEVELS.includes(metadata.risk_level)) {
      this.addDiagnostic(document, "risk_level", `Invalid risk_level: "${metadata.risk_level}". Must be one of: ${VALID_RISK_LEVELS.join(", ")}`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
    if (metadata.priority && !VALID_PRIORITIES.includes(metadata.priority)) {
      this.addDiagnostic(document, "priority", `Invalid priority: "${metadata.priority}". Must be one of: ${VALID_PRIORITIES.join(", ")}`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
    if (metadata.related_code && !Array.isArray(metadata.related_code)) {
      this.addDiagnostic(document, "related_code", "related_code must be an array", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
    if (metadata.tags && !Array.isArray(metadata.tags)) {
      this.addDiagnostic(document, "tags", "tags must be an array", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
    if (metadata.timeout && typeof metadata.timeout === "string") {
      if (!/^\d+(?:ms|s|m|h)$/.test(metadata.timeout)) {
        this.addDiagnostic(document, "timeout", `Invalid timeout format: "${metadata.timeout}". Use format like "10s", "500ms", "1m"`, vscode__namespace.DiagnosticSeverity.Warning, diagnostics);
      }
    }
  }
  validateHttp(document, http, diagnostics) {
    if (!http) return;
    if (!http.method) {
      this.addDiagnostic(document, "http", "http.method is required", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    } else if (!VALID_HTTP_METHODS.includes(http.method.toUpperCase())) {
      this.addDiagnostic(document, "method", `Invalid HTTP method: "${http.method}". Must be one of: ${VALID_HTTP_METHODS.join(", ")}`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
    if (!http.path) {
      this.addDiagnostic(document, "http", "http.path is required", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
  }
  validateGrpc(document, grpc, diagnostics) {
    if (!grpc) return;
    if (!grpc.service) {
      this.addDiagnostic(document, "grpc", "grpc.service is required", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
    if (!grpc.method) {
      this.addDiagnostic(document, "grpc", "grpc.method is required", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
  }
  validateGraphql(document, graphql, diagnostics) {
    if (!graphql) return;
    if (!graphql.query) {
      this.addDiagnostic(document, "graphql", "graphql.query is required", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
  }
  validateWebsocket(document, websocket, diagnostics) {
    if (!websocket) return;
    if (!websocket.url) {
      this.addDiagnostic(document, "websocket", "websocket.url is required", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
  }
  validateAssertions(document, assertions, diagnostics, strict) {
    if (!assertions) return;
    if (!Array.isArray(assertions)) {
      this.addDiagnostic(document, "assertions", "assertions must be an array", vscode__namespace.DiagnosticSeverity.Error, diagnostics);
      return;
    }
    if (assertions.length === 0) {
      this.addDiagnostic(document, "assertions", "No assertions defined - test will always pass", vscode__namespace.DiagnosticSeverity.Warning, diagnostics);
    }
    assertions.forEach((assertion, index) => {
      if (!assertion.type && !assertion.include) {
        this.addDiagnostic(document, "assertions", `assertions[${index}]: must have either 'type' or 'include'`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
      }
      if (assertion.type && !VALID_ASSERTION_TYPES.includes(assertion.type)) {
        this.addDiagnostic(document, "type", `Invalid assertion type: "${assertion.type}". Must be one of: ${VALID_ASSERTION_TYPES.join(", ")}`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
      }
      if (assertion.operator && !VALID_OPERATORS.includes(assertion.operator)) {
        this.addDiagnostic(document, "operator", `Invalid operator: "${assertion.operator}". Must be one of: ${VALID_OPERATORS.join(", ")}`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
      }
    });
  }
  validateData(document, data, diagnostics) {
    if (!data) return;
    if (data.format && !VALID_DATA_FORMATS.includes(data.format.toLowerCase())) {
      this.addDiagnostic(document, "format", `Invalid data format: "${data.format}". Must be one of: ${VALID_DATA_FORMATS.join(", ")}`, vscode__namespace.DiagnosticSeverity.Error, diagnostics);
    }
  }
  validateRequiredField(document, spec, field, diagnostics) {
    if (!(field in spec)) {
      const diagnostic = new vscode__namespace.Diagnostic(
        new vscode__namespace.Range(0, 0, 0, 0),
        `Missing required field: ${field}`,
        vscode__namespace.DiagnosticSeverity.Error
      );
      diagnostic.source = "tspec";
      diagnostics.push(diagnostic);
    }
  }
  addDiagnostic(document, key, message, severity, diagnostics) {
    const position = YamlHelper.findKeyPosition(document, key);
    const range = position ? new vscode__namespace.Range(position, position.translate(0, key.length)) : new vscode__namespace.Range(0, 0, 0, 0);
    const diagnostic = new vscode__namespace.Diagnostic(range, message, severity);
    diagnostic.source = "tspec";
    diagnostics.push(diagnostic);
  }
  createYamlErrorDiagnostic(document, error) {
    let range;
    if (error.mark) {
      const line = error.mark.line || 0;
      const column = error.mark.column || 0;
      range = new vscode__namespace.Range(line, column, line, column + 1);
    } else {
      range = new vscode__namespace.Range(0, 0, 0, 0);
    }
    const diagnostic = new vscode__namespace.Diagnostic(
      range,
      `YAML syntax error: ${error.message}`,
      vscode__namespace.DiagnosticSeverity.Error
    );
    diagnostic.source = "tspec";
    return diagnostic;
  }
}
let diagnosticProvider;
function activate(context) {
  console.log("TSpec extension is now active");
  const tspecSelector = {
    language: "tspec",
    scheme: "file"
  };
  diagnosticProvider = new TSpecDiagnosticProvider();
  context.subscriptions.push(diagnosticProvider);
  const completionProvider = new TSpecCompletionProvider();
  context.subscriptions.push(
    vscode__namespace.languages.registerCompletionItemProvider(
      tspecSelector,
      completionProvider,
      ":",
      "$",
      "{",
      "."
      // Trigger characters
    )
  );
  vscode__namespace.workspace.textDocuments.forEach((document) => {
    if (document.languageId === "tspec") {
      diagnosticProvider.validateDocument(document);
    }
  });
  context.subscriptions.push(
    vscode__namespace.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === "tspec") {
        diagnosticProvider.validateDocument(document);
      }
    })
  );
  context.subscriptions.push(
    vscode__namespace.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === "tspec") {
        diagnosticProvider.validateDocumentDebounced(event.document);
      }
    })
  );
  context.subscriptions.push(
    vscode__namespace.workspace.onDidSaveTextDocument((document) => {
      if (document.languageId === "tspec") {
        diagnosticProvider.validateDocument(document);
      }
    })
  );
  context.subscriptions.push(
    vscode__namespace.workspace.onDidCloseTextDocument((document) => {
      if (document.languageId === "tspec") ;
    })
  );
}
function deactivate() {
  console.log("TSpec extension is now deactivated");
}
exports.activate = activate;
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMveWFtbEhlbHBlci50cyIsIi4uL3NyYy91dGlscy9zY2hlbWFEYXRhLnRzIiwiLi4vc3JjL3Byb3ZpZGVycy9jb21wbGV0aW9uUHJvdmlkZXIudHMiLCIuLi9ub2RlX21vZHVsZXMvanMteWFtbC9kaXN0L2pzLXlhbWwubWpzIiwiLi4vc3JjL3Byb3ZpZGVycy9kaWFnbm9zdGljUHJvdmlkZXIudHMiLCIuLi9zcmMvZXh0ZW5zaW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHZzY29kZSBmcm9tICd2c2NvZGUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFlhbWxDb250ZXh0IHtcbiAgdHlwZTogJ3RvcC1sZXZlbCcgfCAnbWV0YWRhdGEnIHwgJ2h0dHAnIHwgJ2dycGMnIHwgJ2dyYXBocWwnIHwgJ3dlYnNvY2tldCcgfCAnZW52aXJvbm1lbnQnIHwgJ2Fzc2VydGlvbnMnIHwgJ2Fzc2VydGlvbi1pdGVtJyB8ICdkYXRhJyB8ICdsaWZlY3ljbGUnIHwgJ291dHB1dCcgfCAnZXh0cmFjdCcgfCAndmFyaWFibGVzJyB8ICdib2R5JyB8ICd1bmtub3duJztcbiAga2V5UGF0aDogc3RyaW5nW107XG4gIGlzVmFsdWVQb3NpdGlvbjogYm9vbGVhbjtcbiAgY3VycmVudEtleT86IHN0cmluZztcbiAgaW5WYXJpYWJsZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFlhbWxIZWxwZXIge1xuICAvKipcbiAgICogR2V0IHRoZSBZQU1MIGNvbnRleHQgYXQgdGhlIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uXG4gICAqL1xuICBzdGF0aWMgZ2V0Q29udGV4dChkb2N1bWVudDogdnNjb2RlLlRleHREb2N1bWVudCwgcG9zaXRpb246IHZzY29kZS5Qb3NpdGlvbik6IFlhbWxDb250ZXh0IHtcbiAgICBjb25zdCBsaW5lVGV4dCA9IGRvY3VtZW50LmxpbmVBdChwb3NpdGlvbi5saW5lKS50ZXh0O1xuICAgIGNvbnN0IGxpbmVQcmVmaXggPSBsaW5lVGV4dC5zdWJzdHJpbmcoMCwgcG9zaXRpb24uY2hhcmFjdGVyKTtcbiAgICBcbiAgICAvLyBDaGVjayBpZiBpbnNpZGUgdmFyaWFibGUgaW50ZXJwb2xhdGlvblxuICAgIGNvbnN0IGluVmFyaWFibGUgPSB0aGlzLmlzSW5zaWRlVmFyaWFibGUobGluZVByZWZpeCk7XG4gICAgXG4gICAgLy8gQ2hlY2sgaWYgaW4gdmFsdWUgcG9zaXRpb24gKGFmdGVyIGNvbG9uKVxuICAgIGNvbnN0IGlzVmFsdWVQb3NpdGlvbiA9IGxpbmVQcmVmaXguaW5jbHVkZXMoJzonKTtcbiAgICBcbiAgICAvLyBHZXQgY3VycmVudCBrZXkgaWYgaW4gdmFsdWUgcG9zaXRpb25cbiAgICBsZXQgY3VycmVudEtleTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIGNvbnN0IGtleU1hdGNoID0gbGluZVRleHQubWF0Y2goL15cXHMqKFxcdyspOi8pO1xuICAgIGlmIChrZXlNYXRjaCkge1xuICAgICAgY3VycmVudEtleSA9IGtleU1hdGNoWzFdO1xuICAgIH1cbiAgICBcbiAgICAvLyBCdWlsZCBrZXkgcGF0aFxuICAgIGNvbnN0IGtleVBhdGggPSB0aGlzLmdldEtleVBhdGgoZG9jdW1lbnQsIHBvc2l0aW9uKTtcbiAgICBcbiAgICAvLyBEZXRlcm1pbmUgY29udGV4dCB0eXBlXG4gICAgY29uc3QgdHlwZSA9IHRoaXMuZGV0ZXJtaW5lQ29udGV4dFR5cGUoa2V5UGF0aCwgcG9zaXRpb24sIGRvY3VtZW50KTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZSxcbiAgICAgIGtleVBhdGgsXG4gICAgICBpc1ZhbHVlUG9zaXRpb24sXG4gICAgICBjdXJyZW50S2V5LFxuICAgICAgaW5WYXJpYWJsZSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGN1cnNvciBpcyBpbnNpZGUgYSB2YXJpYWJsZSBpbnRlcnBvbGF0aW9uICR7Li4ufVxuICAgKi9cbiAgc3RhdGljIGlzSW5zaWRlVmFyaWFibGUobGluZVByZWZpeDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGFzdE9wZW4gPSBsaW5lUHJlZml4Lmxhc3RJbmRleE9mKCckeycpO1xuICAgIGlmIChsYXN0T3BlbiA9PT0gLTEpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBsYXN0Q2xvc2UgPSBsaW5lUHJlZml4Lmxhc3RJbmRleE9mKCd9JywgbGluZVByZWZpeC5sZW5ndGgpO1xuICAgIHJldHVybiBsYXN0Q2xvc2UgPCBsYXN0T3BlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGtleSBwYXRoIGZyb20gcm9vdCB0byBjdXJyZW50IHBvc2l0aW9uXG4gICAqL1xuICBzdGF0aWMgZ2V0S2V5UGF0aChkb2N1bWVudDogdnNjb2RlLlRleHREb2N1bWVudCwgcG9zaXRpb246IHZzY29kZS5Qb3NpdGlvbik6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBwYXRoOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IGN1cnJlbnRJbmRlbnQgPSB0aGlzLmdldEluZGVudExldmVsKGRvY3VtZW50LmxpbmVBdChwb3NpdGlvbi5saW5lKS50ZXh0KTtcbiAgICBcbiAgICAvLyBXYWxrIGJhY2t3YXJkcyB0aHJvdWdoIGxpbmVzXG4gICAgZm9yIChsZXQgaSA9IHBvc2l0aW9uLmxpbmU7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBjb25zdCBsaW5lID0gZG9jdW1lbnQubGluZUF0KGkpLnRleHQ7XG4gICAgICBjb25zdCBpbmRlbnQgPSB0aGlzLmdldEluZGVudExldmVsKGxpbmUpO1xuICAgICAgXG4gICAgICAvLyBTa2lwIGVtcHR5IGxpbmVzIGFuZCBjb21tZW50c1xuICAgICAgaWYgKGxpbmUudHJpbSgpID09PSAnJyB8fCBsaW5lLnRyaW0oKS5zdGFydHNXaXRoKCcjJykpIGNvbnRpbnVlO1xuICAgICAgXG4gICAgICAvLyBDaGVjayBmb3Iga2V5IGF0IHRoaXMgb3IgbG93ZXIgaW5kZW50IGxldmVsXG4gICAgICBjb25zdCBrZXlNYXRjaCA9IGxpbmUubWF0Y2goL14oXFxzKikoXFx3Kyk6Lyk7XG4gICAgICBpZiAoa2V5TWF0Y2gpIHtcbiAgICAgICAgY29uc3Qga2V5SW5kZW50ID0ga2V5TWF0Y2hbMV0ubGVuZ3RoO1xuICAgICAgICBcbiAgICAgICAgLy8gSWYgdGhpcyBrZXkgaXMgYXQgYSBsb3dlciBpbmRlbnQgbGV2ZWwgdGhhbiBvdXIgY3VycmVudCBjb250ZXh0XG4gICAgICAgIGlmIChrZXlJbmRlbnQgPCBjdXJyZW50SW5kZW50IHx8IChpID09PSBwb3NpdGlvbi5saW5lICYmIGtleUluZGVudCA8PSBjdXJyZW50SW5kZW50KSkge1xuICAgICAgICAgIC8vIE9ubHkgYWRkIGlmIGl0J3MgYSBwYXJlbnQgKGxvd2VyIGluZGVudCkgb3Igc2FtZSBsaW5lXG4gICAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSAwIHx8IGtleUluZGVudCA8IHRoaXMuZ2V0SW5kZW50TGV2ZWwoZG9jdW1lbnQubGluZUF0KHBhdGgubGVuZ3RoID4gMCA/IHBvc2l0aW9uLmxpbmUgOiBpKS50ZXh0KSkge1xuICAgICAgICAgICAgcGF0aC51bnNoaWZ0KGtleU1hdGNoWzJdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIElmIHdlJ3ZlIHJlYWNoZWQgcm9vdCBsZXZlbCwgc3RvcFxuICAgICAgICBpZiAoa2V5SW5kZW50ID09PSAwKSBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGluZGVudGF0aW9uIGxldmVsIG9mIGEgbGluZVxuICAgKi9cbiAgc3RhdGljIGdldEluZGVudExldmVsKGxpbmU6IHN0cmluZyk6IG51bWJlciB7XG4gICAgY29uc3QgbWF0Y2ggPSBsaW5lLm1hdGNoKC9eKFxccyopLyk7XG4gICAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0ubGVuZ3RoIDogMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmUgdGhlIGNvbnRleHQgdHlwZSBiYXNlZCBvbiBrZXkgcGF0aFxuICAgKi9cbiAgc3RhdGljIGRldGVybWluZUNvbnRleHRUeXBlKGtleVBhdGg6IHN0cmluZ1tdLCBwb3NpdGlvbjogdnNjb2RlLlBvc2l0aW9uLCBkb2N1bWVudDogdnNjb2RlLlRleHREb2N1bWVudCk6IFlhbWxDb250ZXh0Wyd0eXBlJ10ge1xuICAgIGlmIChrZXlQYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICd0b3AtbGV2ZWwnO1xuICAgIFxuICAgIGNvbnN0IHJvb3QgPSBrZXlQYXRoWzBdO1xuICAgIFxuICAgIHN3aXRjaCAocm9vdCkge1xuICAgICAgY2FzZSAnbWV0YWRhdGEnOiByZXR1cm4gJ21ldGFkYXRhJztcbiAgICAgIGNhc2UgJ2h0dHAnOiByZXR1cm4ga2V5UGF0aC5pbmNsdWRlcygnYm9keScpID8gJ2JvZHknIDogJ2h0dHAnO1xuICAgICAgY2FzZSAnZ3JwYyc6IHJldHVybiAnZ3JwYyc7XG4gICAgICBjYXNlICdncmFwaHFsJzogcmV0dXJuICdncmFwaHFsJztcbiAgICAgIGNhc2UgJ3dlYnNvY2tldCc6IHJldHVybiAnd2Vic29ja2V0JztcbiAgICAgIGNhc2UgJ2Vudmlyb25tZW50JzogcmV0dXJuICdlbnZpcm9ubWVudCc7XG4gICAgICBjYXNlICdhc3NlcnRpb25zJzogcmV0dXJuIGtleVBhdGgubGVuZ3RoID4gMSA/ICdhc3NlcnRpb24taXRlbScgOiAnYXNzZXJ0aW9ucyc7XG4gICAgICBjYXNlICdkYXRhJzogcmV0dXJuICdkYXRhJztcbiAgICAgIGNhc2UgJ2xpZmVjeWNsZSc6IHJldHVybiAnbGlmZWN5Y2xlJztcbiAgICAgIGNhc2UgJ291dHB1dCc6IHJldHVybiAnb3V0cHV0JztcbiAgICAgIGNhc2UgJ2V4dHJhY3QnOiByZXR1cm4gJ2V4dHJhY3QnO1xuICAgICAgY2FzZSAndmFyaWFibGVzJzogcmV0dXJuICd2YXJpYWJsZXMnO1xuICAgICAgZGVmYXVsdDogcmV0dXJuICd1bmtub3duJztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmluZCB0aGUgcG9zaXRpb24gb2YgYSBrZXkgaW4gdGhlIGRvY3VtZW50XG4gICAqL1xuICBzdGF0aWMgZmluZEtleVBvc2l0aW9uKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50LCBrZXk6IHN0cmluZyk6IHZzY29kZS5Qb3NpdGlvbiB8IG51bGwge1xuICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5nZXRUZXh0KCk7XG4gICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBeXFxcXHMqJHtrZXl9OmAsICdtJyk7XG4gICAgY29uc3QgbWF0Y2ggPSByZWdleC5leGVjKHRleHQpO1xuICAgIFxuICAgIGlmIChtYXRjaCkge1xuICAgICAgY29uc3QgcG9zID0gZG9jdW1lbnQucG9zaXRpb25BdChtYXRjaC5pbmRleCk7XG4gICAgICByZXR1cm4gcG9zO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGRlZmluZWQgdmFyaWFibGUgbmFtZXMgZnJvbSB0aGUgdmFyaWFibGVzIHNlY3Rpb25cbiAgICovXG4gIHN0YXRpYyBnZXREZWZpbmVkVmFyaWFibGVzKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5nZXRUZXh0KCk7XG4gICAgY29uc3QgdmFyaWFibGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIC8vIEZpbmQgdmFyaWFibGVzIHNlY3Rpb25cbiAgICBjb25zdCB2YXJpYWJsZXNNYXRjaCA9IHRleHQubWF0Y2goL152YXJpYWJsZXM6XFxzKlxcbigoPzpbIFxcdF0rXFx3KzouKlxcbj8pKikvbSk7XG4gICAgaWYgKHZhcmlhYmxlc01hdGNoKSB7XG4gICAgICBjb25zdCB2YXJpYWJsZXNDb250ZW50ID0gdmFyaWFibGVzTWF0Y2hbMV07XG4gICAgICBjb25zdCB2YXJNYXRjaGVzID0gdmFyaWFibGVzQ29udGVudC5tYXRjaEFsbCgvXlxccysoXFx3Kyk6L2dtKTtcbiAgICAgIGZvciAoY29uc3QgbWF0Y2ggb2YgdmFyTWF0Y2hlcykge1xuICAgICAgICB2YXJpYWJsZXMucHVzaChtYXRjaFsxXSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB2YXJpYWJsZXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBleHRyYWN0ZWQgdmFyaWFibGUgbmFtZXMgZnJvbSB0aGUgZXh0cmFjdCBzZWN0aW9uXG4gICAqL1xuICBzdGF0aWMgZ2V0RXh0cmFjdGVkVmFyaWFibGVzKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5nZXRUZXh0KCk7XG4gICAgY29uc3QgdmFyaWFibGVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIC8vIEZpbmQgZXh0cmFjdCBzZWN0aW9uXG4gICAgY29uc3QgZXh0cmFjdE1hdGNoID0gdGV4dC5tYXRjaCgvXmV4dHJhY3Q6XFxzKlxcbigoPzpbIFxcdF0rXFx3KzouKlxcbj8pKikvbSk7XG4gICAgaWYgKGV4dHJhY3RNYXRjaCkge1xuICAgICAgY29uc3QgZXh0cmFjdENvbnRlbnQgPSBleHRyYWN0TWF0Y2hbMV07XG4gICAgICBjb25zdCB2YXJNYXRjaGVzID0gZXh0cmFjdENvbnRlbnQubWF0Y2hBbGwoL15cXHMrKFxcdyspOi9nbSk7XG4gICAgICBmb3IgKGNvbnN0IG1hdGNoIG9mIHZhck1hdGNoZXMpIHtcbiAgICAgICAgdmFyaWFibGVzLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdmFyaWFibGVzO1xuICB9XG59XG4iLCJpbXBvcnQgKiBhcyB2c2NvZGUgZnJvbSAndnNjb2RlJztcblxuZXhwb3J0IGludGVyZmFjZSBTY2hlbWFGaWVsZCB7XG4gIGtleTogc3RyaW5nO1xuICByZXF1aXJlZDogYm9vbGVhbjtcbiAgdHlwZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICB2YWx1ZXM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNvbnN0IFRPUF9MRVZFTF9GSUVMRFM6IFNjaGVtYUZpZWxkW10gPSBbXG4gIHsga2V5OiAndmVyc2lvbicsIHJlcXVpcmVkOiB0cnVlLCB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUU3BlYyBmb3JtYXQgdmVyc2lvbiAoY3VycmVudGx5IFwiMS4wXCIpJyB9LFxuICB7IGtleTogJ2Rlc2NyaXB0aW9uJywgcmVxdWlyZWQ6IHRydWUsIHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Rlc3QgY2FzZSBkZXNjcmlwdGlvbicgfSxcbiAgeyBrZXk6ICdtZXRhZGF0YScsIHJlcXVpcmVkOiB0cnVlLCB0eXBlOiAnb2JqZWN0JywgZGVzY3JpcHRpb246ICdUZXN0IG1ldGFkYXRhIGFuZCBjbGFzc2lmaWNhdGlvbicgfSxcbiAgeyBrZXk6ICdlbnZpcm9ubWVudCcsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ29iamVjdCcsIGRlc2NyaXB0aW9uOiAnRW52aXJvbm1lbnQgY29uZmlndXJhdGlvbicgfSxcbiAgeyBrZXk6ICd2YXJpYWJsZXMnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdvYmplY3QnLCBkZXNjcmlwdGlvbjogJ1ZhcmlhYmxlIGRlZmluaXRpb25zJyB9LFxuICB7IGtleTogJ2RhdGEnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdvYmplY3QnLCBkZXNjcmlwdGlvbjogJ0RhdGEtZHJpdmVuIHRlc3RpbmcgY29uZmlndXJhdGlvbicgfSxcbiAgeyBrZXk6ICdleHRlbmRzJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdUZW1wbGF0ZSBmaWxlIHRvIGV4dGVuZCcgfSxcbiAgeyBrZXk6ICdsaWZlY3ljbGUnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdvYmplY3QnLCBkZXNjcmlwdGlvbjogJ1NldHVwIGFuZCB0ZWFyZG93biBob29rcycgfSxcbiAgeyBrZXk6ICdodHRwJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnb2JqZWN0JywgZGVzY3JpcHRpb246ICdIVFRQIHJlcXVlc3QgY29uZmlndXJhdGlvbicgfSxcbiAgeyBrZXk6ICdncnBjJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnb2JqZWN0JywgZGVzY3JpcHRpb246ICdnUlBDIHJlcXVlc3QgY29uZmlndXJhdGlvbicgfSxcbiAgeyBrZXk6ICdncmFwaHFsJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnb2JqZWN0JywgZGVzY3JpcHRpb246ICdHcmFwaFFMIHJlcXVlc3QgY29uZmlndXJhdGlvbicgfSxcbiAgeyBrZXk6ICd3ZWJzb2NrZXQnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdvYmplY3QnLCBkZXNjcmlwdGlvbjogJ1dlYlNvY2tldCByZXF1ZXN0IGNvbmZpZ3VyYXRpb24nIH0sXG4gIHsga2V5OiAnYXNzZXJ0aW9ucycsIHJlcXVpcmVkOiB0cnVlLCB0eXBlOiAnYXJyYXknLCBkZXNjcmlwdGlvbjogJ1Rlc3QgYXNzZXJ0aW9ucycgfSxcbiAgeyBrZXk6ICdleHRyYWN0JywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnb2JqZWN0JywgZGVzY3JpcHRpb246ICdSZXNwb25zZSBkYXRhIGV4dHJhY3Rpb24nIH0sXG4gIHsga2V5OiAnb3V0cHV0JywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnb2JqZWN0JywgZGVzY3JpcHRpb246ICdPdXRwdXQgY29uZmlndXJhdGlvbicgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBNRVRBREFUQV9GSUVMRFM6IFNjaGVtYUZpZWxkW10gPSBbXG4gIHsga2V5OiAnYWlfcHJvbXB0JywgcmVxdWlyZWQ6IHRydWUsIHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ05hdHVyYWwgbGFuZ3VhZ2UgdGVzdCBkZXNjcmlwdGlvbiBmb3IgQUknIH0sXG4gIHsga2V5OiAncmVsYXRlZF9jb2RlJywgcmVxdWlyZWQ6IHRydWUsIHR5cGU6ICdhcnJheScsIGRlc2NyaXB0aW9uOiAnUGF0aHMgdG8gcmVsYXRlZCBzb3VyY2UgZmlsZXMnIH0sXG4gIHsga2V5OiAndGVzdF9jYXRlZ29yeScsIHJlcXVpcmVkOiB0cnVlLCB0eXBlOiAnZW51bScsIGRlc2NyaXB0aW9uOiAnVGVzdCBjYXRlZ29yeScsIHZhbHVlczogWydmdW5jdGlvbmFsJywgJ2ludGVncmF0aW9uJywgJ3BlcmZvcm1hbmNlJywgJ3NlY3VyaXR5J10gfSxcbiAgeyBrZXk6ICdyaXNrX2xldmVsJywgcmVxdWlyZWQ6IHRydWUsIHR5cGU6ICdlbnVtJywgZGVzY3JpcHRpb246ICdSaXNrIGxldmVsJywgdmFsdWVzOiBbJ2xvdycsICdtZWRpdW0nLCAnaGlnaCcsICdjcml0aWNhbCddIH0sXG4gIHsga2V5OiAndGFncycsIHJlcXVpcmVkOiB0cnVlLCB0eXBlOiAnYXJyYXknLCBkZXNjcmlwdGlvbjogJ1RhZ3MgZm9yIGZpbHRlcmluZyBhbmQgZ3JvdXBpbmcnIH0sXG4gIHsga2V5OiAncHJpb3JpdHknLCByZXF1aXJlZDogdHJ1ZSwgdHlwZTogJ2VudW0nLCBkZXNjcmlwdGlvbjogJ1Rlc3QgcHJpb3JpdHknLCB2YWx1ZXM6IFsnbG93JywgJ21lZGl1bScsICdoaWdoJ10gfSxcbiAgeyBrZXk6ICd0aW1lb3V0JywgcmVxdWlyZWQ6IHRydWUsIHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Rlc3QgdGltZW91dCAoZS5nLiwgXCIxMHNcIiwgXCI1MDBtc1wiKScgfSxcbiAgeyBrZXk6ICdidXNpbmVzc19ydWxlJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCdXNpbmVzcyBydWxlIHJlZmVyZW5jZScgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBIVFRQX0ZJRUxEUzogU2NoZW1hRmllbGRbXSA9IFtcbiAgeyBrZXk6ICdtZXRob2QnLCByZXF1aXJlZDogdHJ1ZSwgdHlwZTogJ2VudW0nLCBkZXNjcmlwdGlvbjogJ0hUVFAgbWV0aG9kJywgdmFsdWVzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdERUxFVEUnLCAnUEFUQ0gnLCAnSEVBRCcsICdPUFRJT05TJ10gfSxcbiAgeyBrZXk6ICdwYXRoJywgcmVxdWlyZWQ6IHRydWUsIHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1JlcXVlc3QgcGF0aCcgfSxcbiAgeyBrZXk6ICdoZWFkZXJzJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnb2JqZWN0JywgZGVzY3JpcHRpb246ICdSZXF1ZXN0IGhlYWRlcnMnIH0sXG4gIHsga2V5OiAncXVlcnknLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdvYmplY3QnLCBkZXNjcmlwdGlvbjogJ1F1ZXJ5IHBhcmFtZXRlcnMnIH0sXG4gIHsga2V5OiAnYm9keScsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ29iamVjdCcsIGRlc2NyaXB0aW9uOiAnUmVxdWVzdCBib2R5JyB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IEdSUENfRklFTERTOiBTY2hlbWFGaWVsZFtdID0gW1xuICB7IGtleTogJ3NlcnZpY2UnLCByZXF1aXJlZDogdHJ1ZSwgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnZ1JQQyBzZXJ2aWNlIG5hbWUnIH0sXG4gIHsga2V5OiAnbWV0aG9kJywgcmVxdWlyZWQ6IHRydWUsIHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ2dSUEMgbWV0aG9kIG5hbWUnIH0sXG4gIHsga2V5OiAnbWVzc2FnZScsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ29iamVjdCcsIGRlc2NyaXB0aW9uOiAnZ1JQQyBtZXNzYWdlIHBheWxvYWQnIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgR1JBUEhRTF9GSUVMRFM6IFNjaGVtYUZpZWxkW10gPSBbXG4gIHsga2V5OiAncXVlcnknLCByZXF1aXJlZDogdHJ1ZSwgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnR3JhcGhRTCBxdWVyeScgfSxcbiAgeyBrZXk6ICd2YXJpYWJsZXMnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdvYmplY3QnLCBkZXNjcmlwdGlvbjogJ1F1ZXJ5IHZhcmlhYmxlcycgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBXRUJTT0NLRVRfRklFTERTOiBTY2hlbWFGaWVsZFtdID0gW1xuICB7IGtleTogJ3VybCcsIHJlcXVpcmVkOiB0cnVlLCB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdXZWJTb2NrZXQgVVJMJyB9LFxuICB7IGtleTogJ21lc3NhZ2VzJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnYXJyYXknLCBkZXNjcmlwdGlvbjogJ01lc3NhZ2VzIHRvIHNlbmQnIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgRU5WSVJPTk1FTlRfRklFTERTOiBTY2hlbWFGaWVsZFtdID0gW1xuICB7IGtleTogJ25hbWUnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0Vudmlyb25tZW50IG5hbWUnIH0sXG4gIHsga2V5OiAnaG9zdCcsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQVBJIGhvc3QnIH0sXG4gIHsga2V5OiAnc2NoZW1lJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnZW51bScsIGRlc2NyaXB0aW9uOiAnVVJMIHNjaGVtZScsIHZhbHVlczogWydodHRwJywgJ2h0dHBzJ10gfSxcbiAgeyBrZXk6ICdwb3J0JywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdQb3J0IG51bWJlcicgfSxcbiAgeyBrZXk6ICd2YXJpYWJsZXMnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdvYmplY3QnLCBkZXNjcmlwdGlvbjogJ0Vudmlyb25tZW50LXNwZWNpZmljIHZhcmlhYmxlcycgfSxcbl07XG5cbmV4cG9ydCBjb25zdCBBU1NFUlRJT05fRklFTERTOiBTY2hlbWFGaWVsZFtdID0gW1xuICB7IGtleTogJ3R5cGUnLCByZXF1aXJlZDogdHJ1ZSwgdHlwZTogJ2VudW0nLCBkZXNjcmlwdGlvbjogJ0Fzc2VydGlvbiB0eXBlJywgdmFsdWVzOiBbJ3N0YXR1c19jb2RlJywgJ2dycGNfY29kZScsICdyZXNwb25zZV90aW1lJywgJ2pzb25fcGF0aCcsICdoZWFkZXInLCAncHJvdG9fZmllbGQnLCAnamF2YXNjcmlwdCcsICdpbmNsdWRlJ10gfSxcbiAgeyBrZXk6ICdleHBlY3RlZCcsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ2FueScsIGRlc2NyaXB0aW9uOiAnRXhwZWN0ZWQgdmFsdWUnIH0sXG4gIHsga2V5OiAnZXhwcmVzc2lvbicsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnSlNPTlBhdGggZXhwcmVzc2lvbicgfSxcbiAgeyBrZXk6ICdvcGVyYXRvcicsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ2VudW0nLCBkZXNjcmlwdGlvbjogJ0NvbXBhcmlzb24gb3BlcmF0b3InLCB2YWx1ZXM6IFsnZXF1YWxzJywgJ2VxJywgJ25vdF9lcXVhbHMnLCAnbmVxJywgJ2V4aXN0cycsICdub3RfZXhpc3RzJywgJ25vdF9lbXB0eScsICdjb250YWlucycsICdub3RfY29udGFpbnMnLCAnbWF0Y2hlcycsICdndCcsICdndGUnLCAnbHQnLCAnbHRlJywgJ3R5cGUnLCAnbGVuZ3RoJ10gfSxcbiAgeyBrZXk6ICdwYXRoJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdGaWVsZCBwYXRoJyB9LFxuICB7IGtleTogJ25hbWUnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0hlYWRlciBuYW1lJyB9LFxuICB7IGtleTogJ3ZhbHVlJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnYW55JywgZGVzY3JpcHRpb246ICdIZWFkZXIgdmFsdWUnIH0sXG4gIHsga2V5OiAncGF0dGVybicsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUmVnZXggcGF0dGVybicgfSxcbiAgeyBrZXk6ICdtYXhfbXMnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ01heGltdW0gcmVzcG9uc2UgdGltZSBpbiBtcycgfSxcbiAgeyBrZXk6ICdzb3VyY2UnLCByZXF1aXJlZDogZmFsc2UsIHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0phdmFTY3JpcHQgc291cmNlIGNvZGUnIH0sXG4gIHsga2V5OiAnbWVzc2FnZScsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ3VzdG9tIGZhaWx1cmUgbWVzc2FnZScgfSxcbiAgeyBrZXk6ICdpbmNsdWRlJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdQYXRoIHRvIGFzc2VydGlvbiBsaWJyYXJ5JyB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IERBVEFfRklFTERTOiBTY2hlbWFGaWVsZFtdID0gW1xuICB7IGtleTogJ3NvdXJjZScsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnUGF0aCB0byBkYXRhIGZpbGUnIH0sXG4gIHsga2V5OiAnZm9ybWF0JywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnZW51bScsIGRlc2NyaXB0aW9uOiAnRGF0YSBmb3JtYXQnLCB2YWx1ZXM6IFsnY3N2JywgJ2pzb24nLCAneWFtbCddIH0sXG4gIHsga2V5OiAnZHJpdmVyJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdEcml2ZXIgbW9kZScgfSxcbiAgeyBrZXk6ICdjdXJyZW50X3JvdycsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ251bWJlcicsIGRlc2NyaXB0aW9uOiAnQ3VycmVudCByb3cgaW5kZXgnIH0sXG5dO1xuXG5leHBvcnQgY29uc3QgTElGRUNZQ0xFX0ZJRUxEUzogU2NoZW1hRmllbGRbXSA9IFtcbiAgeyBrZXk6ICdzZXR1cCcsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ2FycmF5JywgZGVzY3JpcHRpb246ICdQcmUtdGVzdCBhY3Rpb25zJyB9LFxuICB7IGtleTogJ3RlYXJkb3duJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnYXJyYXknLCBkZXNjcmlwdGlvbjogJ1Bvc3QtdGVzdCBhY3Rpb25zJyB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IE9VVFBVVF9GSUVMRFM6IFNjaGVtYUZpZWxkW10gPSBbXG4gIHsga2V5OiAnc2F2ZV9yZXNwb25zZV9vbl9mYWlsdXJlJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnYm9vbGVhbicsIGRlc2NyaXB0aW9uOiAnU2F2ZSByZXNwb25zZSBvbiB0ZXN0IGZhaWx1cmUnIH0sXG4gIHsga2V5OiAnbWV0cmljcycsIHJlcXVpcmVkOiBmYWxzZSwgdHlwZTogJ2FycmF5JywgZGVzY3JpcHRpb246ICdNZXRyaWNzIHRvIHJlcG9ydCcgfSxcbiAgeyBrZXk6ICdub3RpZmljYXRpb25zJywgcmVxdWlyZWQ6IGZhbHNlLCB0eXBlOiAnYXJyYXknLCBkZXNjcmlwdGlvbjogJ05vdGlmaWNhdGlvbiBjb25maWd1cmF0aW9uJyB9LFxuXTtcblxuZXhwb3J0IGNvbnN0IFZBUklBQkxFX0ZVTkNUSU9OUyA9IFtcbiAgeyBuYW1lOiAndXVpZCcsIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgVVVJRCB2NCcgfSxcbiAgeyBuYW1lOiAndGltZXN0YW1wJywgZGVzY3JpcHRpb246ICdDdXJyZW50IFVuaXggdGltZXN0YW1wIGluIG1pbGxpc2Vjb25kcycgfSxcbiAgeyBuYW1lOiAnbm93JywgZGVzY3JpcHRpb246ICdDdXJyZW50IHRpbWVzdGFtcCcgfSxcbiAgeyBuYW1lOiAncmFuZG9tX2ludChtaW4sbWF4KScsIGRlc2NyaXB0aW9uOiAnUmFuZG9tIGludGVnZXIgaW4gcmFuZ2UnIH0sXG5dO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29tcGxldGlvbkl0ZW0oXG4gIGxhYmVsOiBzdHJpbmcsXG4gIGtpbmQ6IHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQsXG4gIGRldGFpbD86IHN0cmluZyxcbiAgZG9jdW1lbnRhdGlvbj86IHN0cmluZyxcbiAgaW5zZXJ0VGV4dD86IHN0cmluZyB8IHZzY29kZS5TbmlwcGV0U3RyaW5nXG4pOiB2c2NvZGUuQ29tcGxldGlvbkl0ZW0ge1xuICBjb25zdCBpdGVtID0gbmV3IHZzY29kZS5Db21wbGV0aW9uSXRlbShsYWJlbCwga2luZCk7XG4gIGlmIChkZXRhaWwpIGl0ZW0uZGV0YWlsID0gZGV0YWlsO1xuICBpZiAoZG9jdW1lbnRhdGlvbikgaXRlbS5kb2N1bWVudGF0aW9uID0gbmV3IHZzY29kZS5NYXJrZG93blN0cmluZyhkb2N1bWVudGF0aW9uKTtcbiAgaWYgKGluc2VydFRleHQpIGl0ZW0uaW5zZXJ0VGV4dCA9IGluc2VydFRleHQ7XG4gIHJldHVybiBpdGVtO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmllbGRDb21wbGV0aW9ucyhmaWVsZHM6IFNjaGVtYUZpZWxkW10sIGtpbmQ6IHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQgPSB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLlByb3BlcnR5KTogdnNjb2RlLkNvbXBsZXRpb25JdGVtW10ge1xuICByZXR1cm4gZmllbGRzLm1hcChmaWVsZCA9PiB7XG4gICAgY29uc3QgaXRlbSA9IGNyZWF0ZUNvbXBsZXRpb25JdGVtKFxuICAgICAgZmllbGQua2V5LFxuICAgICAga2luZCxcbiAgICAgIGZpZWxkLnJlcXVpcmVkID8gJyhyZXF1aXJlZCknIDogJyhvcHRpb25hbCknLFxuICAgICAgZmllbGQuZGVzY3JpcHRpb25cbiAgICApO1xuICAgIFxuICAgIGlmIChmaWVsZC50eXBlID09PSAnZW51bScgJiYgZmllbGQudmFsdWVzKSB7XG4gICAgICBpdGVtLmluc2VydFRleHQgPSBuZXcgdnNjb2RlLlNuaXBwZXRTdHJpbmcoYCR7ZmllbGQua2V5fTogXCJcXCR7MXwke2ZpZWxkLnZhbHVlcy5qb2luKCcsJyl9fH1cImApO1xuICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gJ2FycmF5Jykge1xuICAgICAgaXRlbS5pbnNlcnRUZXh0ID0gbmV3IHZzY29kZS5TbmlwcGV0U3RyaW5nKGAke2ZpZWxkLmtleX06XFxuICAtICQwYCk7XG4gICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSAnb2JqZWN0Jykge1xuICAgICAgaXRlbS5pbnNlcnRUZXh0ID0gbmV3IHZzY29kZS5TbmlwcGV0U3RyaW5nKGAke2ZpZWxkLmtleX06XFxuICAkMGApO1xuICAgIH0gZWxzZSB7XG4gICAgICBpdGVtLmluc2VydFRleHQgPSBuZXcgdnNjb2RlLlNuaXBwZXRTdHJpbmcoYCR7ZmllbGQua2V5fTogJDBgKTtcbiAgICB9XG4gICAgXG4gICAgLy8gU29ydCByZXF1aXJlZCBmaWVsZHMgZmlyc3RcbiAgICBpdGVtLnNvcnRUZXh0ID0gZmllbGQucmVxdWlyZWQgPyBgMF8ke2ZpZWxkLmtleX1gIDogYDFfJHtmaWVsZC5rZXl9YDtcbiAgICBcbiAgICByZXR1cm4gaXRlbTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnVtQ29tcGxldGlvbnModmFsdWVzOiBzdHJpbmdbXSwga2luZDogdnNjb2RlLkNvbXBsZXRpb25JdGVtS2luZCA9IHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQuRW51bU1lbWJlcik6IHZzY29kZS5Db21wbGV0aW9uSXRlbVtdIHtcbiAgcmV0dXJuIHZhbHVlcy5tYXAodmFsdWUgPT4ge1xuICAgIGNvbnN0IGl0ZW0gPSBjcmVhdGVDb21wbGV0aW9uSXRlbSh2YWx1ZSwga2luZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGBcIiR7dmFsdWV9XCJgKTtcbiAgICByZXR1cm4gaXRlbTtcbiAgfSk7XG59XG4iLCJpbXBvcnQgKiBhcyB2c2NvZGUgZnJvbSAndnNjb2RlJztcbmltcG9ydCB7IFlhbWxIZWxwZXIgfSBmcm9tICcuLi91dGlscy95YW1sSGVscGVyJztcbmltcG9ydCB7XG4gIFRPUF9MRVZFTF9GSUVMRFMsXG4gIE1FVEFEQVRBX0ZJRUxEUyxcbiAgSFRUUF9GSUVMRFMsXG4gIEdSUENfRklFTERTLFxuICBHUkFQSFFMX0ZJRUxEUyxcbiAgV0VCU09DS0VUX0ZJRUxEUyxcbiAgRU5WSVJPTk1FTlRfRklFTERTLFxuICBBU1NFUlRJT05fRklFTERTLFxuICBEQVRBX0ZJRUxEUyxcbiAgTElGRUNZQ0xFX0ZJRUxEUyxcbiAgT1VUUFVUX0ZJRUxEUyxcbiAgVkFSSUFCTEVfRlVOQ1RJT05TLFxuICBjcmVhdGVGaWVsZENvbXBsZXRpb25zLFxuICBjcmVhdGVFbnVtQ29tcGxldGlvbnMsXG4gIGNyZWF0ZUNvbXBsZXRpb25JdGVtLFxufSBmcm9tICcuLi91dGlscy9zY2hlbWFEYXRhJztcblxuZXhwb3J0IGNsYXNzIFRTcGVjQ29tcGxldGlvblByb3ZpZGVyIGltcGxlbWVudHMgdnNjb2RlLkNvbXBsZXRpb25JdGVtUHJvdmlkZXIge1xuICBwcm92aWRlQ29tcGxldGlvbkl0ZW1zKFxuICAgIGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50LFxuICAgIHBvc2l0aW9uOiB2c2NvZGUuUG9zaXRpb24sXG4gICAgdG9rZW46IHZzY29kZS5DYW5jZWxsYXRpb25Ub2tlbixcbiAgICBjb250ZXh0OiB2c2NvZGUuQ29tcGxldGlvbkNvbnRleHRcbiAgKTogdnNjb2RlLlByb3ZpZGVyUmVzdWx0PHZzY29kZS5Db21wbGV0aW9uSXRlbVtdIHwgdnNjb2RlLkNvbXBsZXRpb25MaXN0PiB7XG4gICAgY29uc3QgeWFtbENvbnRleHQgPSBZYW1sSGVscGVyLmdldENvbnRleHQoZG9jdW1lbnQsIHBvc2l0aW9uKTtcbiAgICBcbiAgICAvLyBIYW5kbGUgdmFyaWFibGUgaW50ZXJwb2xhdGlvblxuICAgIGlmICh5YW1sQ29udGV4dC5pblZhcmlhYmxlKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRWYXJpYWJsZUNvbXBsZXRpb25zKGRvY3VtZW50KTtcbiAgICB9XG4gICAgXG4gICAgLy8gSGFuZGxlIHZhbHVlIGNvbXBsZXRpb25zIGZvciBlbnVtIGZpZWxkc1xuICAgIGlmICh5YW1sQ29udGV4dC5pc1ZhbHVlUG9zaXRpb24gJiYgeWFtbENvbnRleHQuY3VycmVudEtleSkge1xuICAgICAgY29uc3QgZW51bUNvbXBsZXRpb25zID0gdGhpcy5nZXRFbnVtQ29tcGxldGlvbnMoeWFtbENvbnRleHQuY3VycmVudEtleSwgeWFtbENvbnRleHQudHlwZSk7XG4gICAgICBpZiAoZW51bUNvbXBsZXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIGVudW1Db21wbGV0aW9ucztcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gSGFuZGxlIGtleSBjb21wbGV0aW9ucyBiYXNlZCBvbiBjb250ZXh0XG4gICAgcmV0dXJuIHRoaXMuZ2V0S2V5Q29tcGxldGlvbnMoeWFtbENvbnRleHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRLZXlDb21wbGV0aW9ucyhjb250ZXh0OiBSZXR1cm5UeXBlPHR5cGVvZiBZYW1sSGVscGVyLmdldENvbnRleHQ+KTogdnNjb2RlLkNvbXBsZXRpb25JdGVtW10ge1xuICAgIHN3aXRjaCAoY29udGV4dC50eXBlKSB7XG4gICAgICBjYXNlICd0b3AtbGV2ZWwnOlxuICAgICAgICByZXR1cm4gY3JlYXRlRmllbGRDb21wbGV0aW9ucyhUT1BfTEVWRUxfRklFTERTLCB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLktleXdvcmQpO1xuICAgICAgXG4gICAgICBjYXNlICdtZXRhZGF0YSc6XG4gICAgICAgIHJldHVybiBjcmVhdGVGaWVsZENvbXBsZXRpb25zKE1FVEFEQVRBX0ZJRUxEUyk7XG4gICAgICBcbiAgICAgIGNhc2UgJ2h0dHAnOlxuICAgICAgICByZXR1cm4gY3JlYXRlRmllbGRDb21wbGV0aW9ucyhIVFRQX0ZJRUxEUyk7XG4gICAgICBcbiAgICAgIGNhc2UgJ2dycGMnOlxuICAgICAgICByZXR1cm4gY3JlYXRlRmllbGRDb21wbGV0aW9ucyhHUlBDX0ZJRUxEUyk7XG4gICAgICBcbiAgICAgIGNhc2UgJ2dyYXBocWwnOlxuICAgICAgICByZXR1cm4gY3JlYXRlRmllbGRDb21wbGV0aW9ucyhHUkFQSFFMX0ZJRUxEUyk7XG4gICAgICBcbiAgICAgIGNhc2UgJ3dlYnNvY2tldCc6XG4gICAgICAgIHJldHVybiBjcmVhdGVGaWVsZENvbXBsZXRpb25zKFdFQlNPQ0tFVF9GSUVMRFMpO1xuICAgICAgXG4gICAgICBjYXNlICdlbnZpcm9ubWVudCc6XG4gICAgICAgIHJldHVybiBjcmVhdGVGaWVsZENvbXBsZXRpb25zKEVOVklST05NRU5UX0ZJRUxEUyk7XG4gICAgICBcbiAgICAgIGNhc2UgJ2Fzc2VydGlvbnMnOlxuICAgICAgY2FzZSAnYXNzZXJ0aW9uLWl0ZW0nOlxuICAgICAgICByZXR1cm4gY3JlYXRlRmllbGRDb21wbGV0aW9ucyhBU1NFUlRJT05fRklFTERTKTtcbiAgICAgIFxuICAgICAgY2FzZSAnZGF0YSc6XG4gICAgICAgIHJldHVybiBjcmVhdGVGaWVsZENvbXBsZXRpb25zKERBVEFfRklFTERTKTtcbiAgICAgIFxuICAgICAgY2FzZSAnbGlmZWN5Y2xlJzpcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUZpZWxkQ29tcGxldGlvbnMoTElGRUNZQ0xFX0ZJRUxEUyk7XG4gICAgICBcbiAgICAgIGNhc2UgJ291dHB1dCc6XG4gICAgICAgIHJldHVybiBjcmVhdGVGaWVsZENvbXBsZXRpb25zKE9VVFBVVF9GSUVMRFMpO1xuICAgICAgXG4gICAgICBjYXNlICdib2R5JzpcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICBjcmVhdGVDb21wbGV0aW9uSXRlbSgnanNvbicsIHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQuUHJvcGVydHksICdKU09OIGJvZHknLCAnSlNPTiByZXF1ZXN0IGJvZHknLCBuZXcgdnNjb2RlLlNuaXBwZXRTdHJpbmcoJ2pzb246XFxuICAkMCcpKSxcbiAgICAgICAgICBjcmVhdGVDb21wbGV0aW9uSXRlbSgnZm9ybScsIHZzY29kZS5Db21wbGV0aW9uSXRlbUtpbmQuUHJvcGVydHksICdGb3JtIGJvZHknLCAnRm9ybS1lbmNvZGVkIHJlcXVlc3QgYm9keScsIG5ldyB2c2NvZGUuU25pcHBldFN0cmluZygnZm9ybTpcXG4gICQwJykpLFxuICAgICAgICAgIGNyZWF0ZUNvbXBsZXRpb25JdGVtKCdyYXcnLCB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLlByb3BlcnR5LCAnUmF3IGJvZHknLCAnUmF3IHRleHQgcmVxdWVzdCBib2R5JywgbmV3IHZzY29kZS5TbmlwcGV0U3RyaW5nKCdyYXc6IFwiJDBcIicpKSxcbiAgICAgICAgXTtcbiAgICAgIFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0RW51bUNvbXBsZXRpb25zKGtleTogc3RyaW5nLCBjb250ZXh0VHlwZTogc3RyaW5nKTogdnNjb2RlLkNvbXBsZXRpb25JdGVtW10ge1xuICAgIC8vIE1ldGFkYXRhIGVudW1zXG4gICAgaWYgKGtleSA9PT0gJ3Rlc3RfY2F0ZWdvcnknKSB7XG4gICAgICByZXR1cm4gY3JlYXRlRW51bUNvbXBsZXRpb25zKFsnZnVuY3Rpb25hbCcsICdpbnRlZ3JhdGlvbicsICdwZXJmb3JtYW5jZScsICdzZWN1cml0eSddKTtcbiAgICB9XG4gICAgaWYgKGtleSA9PT0gJ3Jpc2tfbGV2ZWwnKSB7XG4gICAgICByZXR1cm4gY3JlYXRlRW51bUNvbXBsZXRpb25zKFsnbG93JywgJ21lZGl1bScsICdoaWdoJywgJ2NyaXRpY2FsJ10pO1xuICAgIH1cbiAgICBpZiAoa2V5ID09PSAncHJpb3JpdHknKSB7XG4gICAgICByZXR1cm4gY3JlYXRlRW51bUNvbXBsZXRpb25zKFsnbG93JywgJ21lZGl1bScsICdoaWdoJ10pO1xuICAgIH1cbiAgICBcbiAgICAvLyBIVFRQIG1ldGhvZFxuICAgIGlmIChrZXkgPT09ICdtZXRob2QnICYmIGNvbnRleHRUeXBlID09PSAnaHR0cCcpIHtcbiAgICAgIHJldHVybiBjcmVhdGVFbnVtQ29tcGxldGlvbnMoWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJywgJ1BBVENIJywgJ0hFQUQnLCAnT1BUSU9OUyddKTtcbiAgICB9XG4gICAgXG4gICAgLy8gRW52aXJvbm1lbnQgc2NoZW1lXG4gICAgaWYgKGtleSA9PT0gJ3NjaGVtZScpIHtcbiAgICAgIHJldHVybiBjcmVhdGVFbnVtQ29tcGxldGlvbnMoWydodHRwJywgJ2h0dHBzJ10pO1xuICAgIH1cbiAgICBcbiAgICAvLyBBc3NlcnRpb24gdHlwZVxuICAgIGlmIChrZXkgPT09ICd0eXBlJyAmJiAoY29udGV4dFR5cGUgPT09ICdhc3NlcnRpb25zJyB8fCBjb250ZXh0VHlwZSA9PT0gJ2Fzc2VydGlvbi1pdGVtJykpIHtcbiAgICAgIHJldHVybiBjcmVhdGVFbnVtQ29tcGxldGlvbnMoWydzdGF0dXNfY29kZScsICdncnBjX2NvZGUnLCAncmVzcG9uc2VfdGltZScsICdqc29uX3BhdGgnLCAnaGVhZGVyJywgJ3Byb3RvX2ZpZWxkJywgJ2phdmFzY3JpcHQnLCAnaW5jbHVkZSddKTtcbiAgICB9XG4gICAgXG4gICAgLy8gQXNzZXJ0aW9uIG9wZXJhdG9yXG4gICAgaWYgKGtleSA9PT0gJ29wZXJhdG9yJykge1xuICAgICAgcmV0dXJuIGNyZWF0ZUVudW1Db21wbGV0aW9ucyhbJ2VxdWFscycsICdlcScsICdub3RfZXF1YWxzJywgJ25lcScsICdleGlzdHMnLCAnbm90X2V4aXN0cycsICdub3RfZW1wdHknLCAnY29udGFpbnMnLCAnbm90X2NvbnRhaW5zJywgJ21hdGNoZXMnLCAnZ3QnLCAnZ3RlJywgJ2x0JywgJ2x0ZScsICd0eXBlJywgJ2xlbmd0aCddKTtcbiAgICB9XG4gICAgXG4gICAgLy8gRGF0YSBmb3JtYXRcbiAgICBpZiAoa2V5ID09PSAnZm9ybWF0JyAmJiBjb250ZXh0VHlwZSA9PT0gJ2RhdGEnKSB7XG4gICAgICByZXR1cm4gY3JlYXRlRW51bUNvbXBsZXRpb25zKFsnY3N2JywgJ2pzb24nLCAneWFtbCddKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRWYXJpYWJsZUNvbXBsZXRpb25zKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50KTogdnNjb2RlLkNvbXBsZXRpb25JdGVtW10ge1xuICAgIGNvbnN0IGl0ZW1zOiB2c2NvZGUuQ29tcGxldGlvbkl0ZW1bXSA9IFtdO1xuICAgIFxuICAgIC8vIEJ1aWx0LWluIGZ1bmN0aW9uc1xuICAgIGZvciAoY29uc3QgZnVuYyBvZiBWQVJJQUJMRV9GVU5DVElPTlMpIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBjcmVhdGVDb21wbGV0aW9uSXRlbShcbiAgICAgICAgZnVuYy5uYW1lLFxuICAgICAgICB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLkZ1bmN0aW9uLFxuICAgICAgICAnQnVpbHQtaW4gZnVuY3Rpb24nLFxuICAgICAgICBmdW5jLmRlc2NyaXB0aW9uXG4gICAgICApO1xuICAgICAgaXRlbXMucHVzaChpdGVtKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZW52LiBwcmVmaXhcbiAgICBjb25zdCBlbnZJdGVtID0gY3JlYXRlQ29tcGxldGlvbkl0ZW0oXG4gICAgICAnZW52LicsXG4gICAgICB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLk1vZHVsZSxcbiAgICAgICdFbnZpcm9ubWVudCB2YXJpYWJsZScsXG4gICAgICAnUmVmZXJlbmNlIGVudmlyb25tZW50IHZhcmlhYmxlOiBlbnYuVkFSX05BTUUnXG4gICAgKTtcbiAgICBpdGVtcy5wdXNoKGVudkl0ZW0pO1xuICAgIFxuICAgIC8vIGV4dHJhY3QuIHByZWZpeFxuICAgIGNvbnN0IGV4dHJhY3RJdGVtID0gY3JlYXRlQ29tcGxldGlvbkl0ZW0oXG4gICAgICAnZXh0cmFjdC4nLFxuICAgICAgdnNjb2RlLkNvbXBsZXRpb25JdGVtS2luZC5Nb2R1bGUsXG4gICAgICAnRXh0cmFjdGVkIHZhbHVlJyxcbiAgICAgICdSZWZlcmVuY2UgZXh0cmFjdGVkIHZhbHVlOiBleHRyYWN0LnZhcmlhYmxlX25hbWUnXG4gICAgKTtcbiAgICBpdGVtcy5wdXNoKGV4dHJhY3RJdGVtKTtcbiAgICBcbiAgICAvLyBVc2VyLWRlZmluZWQgdmFyaWFibGVzXG4gICAgY29uc3QgZGVmaW5lZFZhcnMgPSBZYW1sSGVscGVyLmdldERlZmluZWRWYXJpYWJsZXMoZG9jdW1lbnQpO1xuICAgIGZvciAoY29uc3QgdmFyTmFtZSBvZiBkZWZpbmVkVmFycykge1xuICAgICAgY29uc3QgaXRlbSA9IGNyZWF0ZUNvbXBsZXRpb25JdGVtKFxuICAgICAgICB2YXJOYW1lLFxuICAgICAgICB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLlZhcmlhYmxlLFxuICAgICAgICAnVXNlciB2YXJpYWJsZScsXG4gICAgICAgIGBWYXJpYWJsZSBkZWZpbmVkIGluIHZhcmlhYmxlcyBzZWN0aW9uYFxuICAgICAgKTtcbiAgICAgIGl0ZW1zLnB1c2goaXRlbSk7XG4gICAgfVxuICAgIFxuICAgIC8vIEV4dHJhY3RlZCB2YXJpYWJsZXNcbiAgICBjb25zdCBleHRyYWN0ZWRWYXJzID0gWWFtbEhlbHBlci5nZXRFeHRyYWN0ZWRWYXJpYWJsZXMoZG9jdW1lbnQpO1xuICAgIGZvciAoY29uc3QgdmFyTmFtZSBvZiBleHRyYWN0ZWRWYXJzKSB7XG4gICAgICBjb25zdCBpdGVtID0gY3JlYXRlQ29tcGxldGlvbkl0ZW0oXG4gICAgICAgIGBleHRyYWN0LiR7dmFyTmFtZX1gLFxuICAgICAgICB2c2NvZGUuQ29tcGxldGlvbkl0ZW1LaW5kLlZhcmlhYmxlLFxuICAgICAgICAnRXh0cmFjdGVkIHZhbHVlJyxcbiAgICAgICAgYFZhbHVlIGV4dHJhY3RlZCBmcm9tIHJlc3BvbnNlYFxuICAgICAgKTtcbiAgICAgIGl0ZW1zLnB1c2goaXRlbSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBpdGVtcztcbiAgfVxufVxuIiwiXG4vKiEganMteWFtbCA0LjEuMSBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwgQGxpY2Vuc2UgTUlUICovXG5mdW5jdGlvbiBpc05vdGhpbmcoc3ViamVjdCkge1xuICByZXR1cm4gKHR5cGVvZiBzdWJqZWN0ID09PSAndW5kZWZpbmVkJykgfHwgKHN1YmplY3QgPT09IG51bGwpO1xufVxuXG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHN1YmplY3QpIHtcbiAgcmV0dXJuICh0eXBlb2Ygc3ViamVjdCA9PT0gJ29iamVjdCcpICYmIChzdWJqZWN0ICE9PSBudWxsKTtcbn1cblxuXG5mdW5jdGlvbiB0b0FycmF5KHNlcXVlbmNlKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHNlcXVlbmNlKSkgcmV0dXJuIHNlcXVlbmNlO1xuICBlbHNlIGlmIChpc05vdGhpbmcoc2VxdWVuY2UpKSByZXR1cm4gW107XG5cbiAgcmV0dXJuIFsgc2VxdWVuY2UgXTtcbn1cblxuXG5mdW5jdGlvbiBleHRlbmQodGFyZ2V0LCBzb3VyY2UpIHtcbiAgdmFyIGluZGV4LCBsZW5ndGgsIGtleSwgc291cmNlS2V5cztcblxuICBpZiAoc291cmNlKSB7XG4gICAgc291cmNlS2V5cyA9IE9iamVjdC5rZXlzKHNvdXJjZSk7XG5cbiAgICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gc291cmNlS2V5cy5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgICBrZXkgPSBzb3VyY2VLZXlzW2luZGV4XTtcbiAgICAgIHRhcmdldFtrZXldID0gc291cmNlW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuXG5mdW5jdGlvbiByZXBlYXQoc3RyaW5nLCBjb3VudCkge1xuICB2YXIgcmVzdWx0ID0gJycsIGN5Y2xlO1xuXG4gIGZvciAoY3ljbGUgPSAwOyBjeWNsZSA8IGNvdW50OyBjeWNsZSArPSAxKSB7XG4gICAgcmVzdWx0ICs9IHN0cmluZztcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuZnVuY3Rpb24gaXNOZWdhdGl2ZVplcm8obnVtYmVyKSB7XG4gIHJldHVybiAobnVtYmVyID09PSAwKSAmJiAoTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZID09PSAxIC8gbnVtYmVyKTtcbn1cblxuXG52YXIgaXNOb3RoaW5nXzEgICAgICA9IGlzTm90aGluZztcbnZhciBpc09iamVjdF8xICAgICAgID0gaXNPYmplY3Q7XG52YXIgdG9BcnJheV8xICAgICAgICA9IHRvQXJyYXk7XG52YXIgcmVwZWF0XzEgICAgICAgICA9IHJlcGVhdDtcbnZhciBpc05lZ2F0aXZlWmVyb18xID0gaXNOZWdhdGl2ZVplcm87XG52YXIgZXh0ZW5kXzEgICAgICAgICA9IGV4dGVuZDtcblxudmFyIGNvbW1vbiA9IHtcblx0aXNOb3RoaW5nOiBpc05vdGhpbmdfMSxcblx0aXNPYmplY3Q6IGlzT2JqZWN0XzEsXG5cdHRvQXJyYXk6IHRvQXJyYXlfMSxcblx0cmVwZWF0OiByZXBlYXRfMSxcblx0aXNOZWdhdGl2ZVplcm86IGlzTmVnYXRpdmVaZXJvXzEsXG5cdGV4dGVuZDogZXh0ZW5kXzFcbn07XG5cbi8vIFlBTUwgZXJyb3IgY2xhc3MuIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODQ1ODk4NFxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKGV4Y2VwdGlvbiwgY29tcGFjdCkge1xuICB2YXIgd2hlcmUgPSAnJywgbWVzc2FnZSA9IGV4Y2VwdGlvbi5yZWFzb24gfHwgJyh1bmtub3duIHJlYXNvbiknO1xuXG4gIGlmICghZXhjZXB0aW9uLm1hcmspIHJldHVybiBtZXNzYWdlO1xuXG4gIGlmIChleGNlcHRpb24ubWFyay5uYW1lKSB7XG4gICAgd2hlcmUgKz0gJ2luIFwiJyArIGV4Y2VwdGlvbi5tYXJrLm5hbWUgKyAnXCIgJztcbiAgfVxuXG4gIHdoZXJlICs9ICcoJyArIChleGNlcHRpb24ubWFyay5saW5lICsgMSkgKyAnOicgKyAoZXhjZXB0aW9uLm1hcmsuY29sdW1uICsgMSkgKyAnKSc7XG5cbiAgaWYgKCFjb21wYWN0ICYmIGV4Y2VwdGlvbi5tYXJrLnNuaXBwZXQpIHtcbiAgICB3aGVyZSArPSAnXFxuXFxuJyArIGV4Y2VwdGlvbi5tYXJrLnNuaXBwZXQ7XG4gIH1cblxuICByZXR1cm4gbWVzc2FnZSArICcgJyArIHdoZXJlO1xufVxuXG5cbmZ1bmN0aW9uIFlBTUxFeGNlcHRpb24kMShyZWFzb24sIG1hcmspIHtcbiAgLy8gU3VwZXIgY29uc3RydWN0b3JcbiAgRXJyb3IuY2FsbCh0aGlzKTtcblxuICB0aGlzLm5hbWUgPSAnWUFNTEV4Y2VwdGlvbic7XG4gIHRoaXMucmVhc29uID0gcmVhc29uO1xuICB0aGlzLm1hcmsgPSBtYXJrO1xuICB0aGlzLm1lc3NhZ2UgPSBmb3JtYXRFcnJvcih0aGlzLCBmYWxzZSk7XG5cbiAgLy8gSW5jbHVkZSBzdGFjayB0cmFjZSBpbiBlcnJvciBvYmplY3RcbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgLy8gQ2hyb21lIGFuZCBOb2RlSlNcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBGRiwgSUUgMTArIGFuZCBTYWZhcmkgNisuIEZhbGxiYWNrIGZvciBvdGhlcnNcbiAgICB0aGlzLnN0YWNrID0gKG5ldyBFcnJvcigpKS5zdGFjayB8fCAnJztcbiAgfVxufVxuXG5cbi8vIEluaGVyaXQgZnJvbSBFcnJvclxuWUFNTEV4Y2VwdGlvbiQxLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbllBTUxFeGNlcHRpb24kMS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBZQU1MRXhjZXB0aW9uJDE7XG5cblxuWUFNTEV4Y2VwdGlvbiQxLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKGNvbXBhY3QpIHtcbiAgcmV0dXJuIHRoaXMubmFtZSArICc6ICcgKyBmb3JtYXRFcnJvcih0aGlzLCBjb21wYWN0KTtcbn07XG5cblxudmFyIGV4Y2VwdGlvbiA9IFlBTUxFeGNlcHRpb24kMTtcblxuLy8gZ2V0IHNuaXBwZXQgZm9yIGEgc2luZ2xlIGxpbmUsIHJlc3BlY3RpbmcgbWF4TGVuZ3RoXG5mdW5jdGlvbiBnZXRMaW5lKGJ1ZmZlciwgbGluZVN0YXJ0LCBsaW5lRW5kLCBwb3NpdGlvbiwgbWF4TGluZUxlbmd0aCkge1xuICB2YXIgaGVhZCA9ICcnO1xuICB2YXIgdGFpbCA9ICcnO1xuICB2YXIgbWF4SGFsZkxlbmd0aCA9IE1hdGguZmxvb3IobWF4TGluZUxlbmd0aCAvIDIpIC0gMTtcblxuICBpZiAocG9zaXRpb24gLSBsaW5lU3RhcnQgPiBtYXhIYWxmTGVuZ3RoKSB7XG4gICAgaGVhZCA9ICcgLi4uICc7XG4gICAgbGluZVN0YXJ0ID0gcG9zaXRpb24gLSBtYXhIYWxmTGVuZ3RoICsgaGVhZC5sZW5ndGg7XG4gIH1cblxuICBpZiAobGluZUVuZCAtIHBvc2l0aW9uID4gbWF4SGFsZkxlbmd0aCkge1xuICAgIHRhaWwgPSAnIC4uLic7XG4gICAgbGluZUVuZCA9IHBvc2l0aW9uICsgbWF4SGFsZkxlbmd0aCAtIHRhaWwubGVuZ3RoO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdHI6IGhlYWQgKyBidWZmZXIuc2xpY2UobGluZVN0YXJ0LCBsaW5lRW5kKS5yZXBsYWNlKC9cXHQvZywgJ+KGkicpICsgdGFpbCxcbiAgICBwb3M6IHBvc2l0aW9uIC0gbGluZVN0YXJ0ICsgaGVhZC5sZW5ndGggLy8gcmVsYXRpdmUgcG9zaXRpb25cbiAgfTtcbn1cblxuXG5mdW5jdGlvbiBwYWRTdGFydChzdHJpbmcsIG1heCkge1xuICByZXR1cm4gY29tbW9uLnJlcGVhdCgnICcsIG1heCAtIHN0cmluZy5sZW5ndGgpICsgc3RyaW5nO1xufVxuXG5cbmZ1bmN0aW9uIG1ha2VTbmlwcGV0KG1hcmssIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IE9iamVjdC5jcmVhdGUob3B0aW9ucyB8fCBudWxsKTtcblxuICBpZiAoIW1hcmsuYnVmZmVyKSByZXR1cm4gbnVsbDtcblxuICBpZiAoIW9wdGlvbnMubWF4TGVuZ3RoKSBvcHRpb25zLm1heExlbmd0aCA9IDc5O1xuICBpZiAodHlwZW9mIG9wdGlvbnMuaW5kZW50ICAgICAgIT09ICdudW1iZXInKSBvcHRpb25zLmluZGVudCAgICAgID0gMTtcbiAgaWYgKHR5cGVvZiBvcHRpb25zLmxpbmVzQmVmb3JlICE9PSAnbnVtYmVyJykgb3B0aW9ucy5saW5lc0JlZm9yZSA9IDM7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5saW5lc0FmdGVyICAhPT0gJ251bWJlcicpIG9wdGlvbnMubGluZXNBZnRlciAgPSAyO1xuXG4gIHZhciByZSA9IC9cXHI/XFxufFxccnxcXDAvZztcbiAgdmFyIGxpbmVTdGFydHMgPSBbIDAgXTtcbiAgdmFyIGxpbmVFbmRzID0gW107XG4gIHZhciBtYXRjaDtcbiAgdmFyIGZvdW5kTGluZU5vID0gLTE7XG5cbiAgd2hpbGUgKChtYXRjaCA9IHJlLmV4ZWMobWFyay5idWZmZXIpKSkge1xuICAgIGxpbmVFbmRzLnB1c2gobWF0Y2guaW5kZXgpO1xuICAgIGxpbmVTdGFydHMucHVzaChtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XG5cbiAgICBpZiAobWFyay5wb3NpdGlvbiA8PSBtYXRjaC5pbmRleCAmJiBmb3VuZExpbmVObyA8IDApIHtcbiAgICAgIGZvdW5kTGluZU5vID0gbGluZVN0YXJ0cy5sZW5ndGggLSAyO1xuICAgIH1cbiAgfVxuXG4gIGlmIChmb3VuZExpbmVObyA8IDApIGZvdW5kTGluZU5vID0gbGluZVN0YXJ0cy5sZW5ndGggLSAxO1xuXG4gIHZhciByZXN1bHQgPSAnJywgaSwgbGluZTtcbiAgdmFyIGxpbmVOb0xlbmd0aCA9IE1hdGgubWluKG1hcmsubGluZSArIG9wdGlvbnMubGluZXNBZnRlciwgbGluZUVuZHMubGVuZ3RoKS50b1N0cmluZygpLmxlbmd0aDtcbiAgdmFyIG1heExpbmVMZW5ndGggPSBvcHRpb25zLm1heExlbmd0aCAtIChvcHRpb25zLmluZGVudCArIGxpbmVOb0xlbmd0aCArIDMpO1xuXG4gIGZvciAoaSA9IDE7IGkgPD0gb3B0aW9ucy5saW5lc0JlZm9yZTsgaSsrKSB7XG4gICAgaWYgKGZvdW5kTGluZU5vIC0gaSA8IDApIGJyZWFrO1xuICAgIGxpbmUgPSBnZXRMaW5lKFxuICAgICAgbWFyay5idWZmZXIsXG4gICAgICBsaW5lU3RhcnRzW2ZvdW5kTGluZU5vIC0gaV0sXG4gICAgICBsaW5lRW5kc1tmb3VuZExpbmVObyAtIGldLFxuICAgICAgbWFyay5wb3NpdGlvbiAtIChsaW5lU3RhcnRzW2ZvdW5kTGluZU5vXSAtIGxpbmVTdGFydHNbZm91bmRMaW5lTm8gLSBpXSksXG4gICAgICBtYXhMaW5lTGVuZ3RoXG4gICAgKTtcbiAgICByZXN1bHQgPSBjb21tb24ucmVwZWF0KCcgJywgb3B0aW9ucy5pbmRlbnQpICsgcGFkU3RhcnQoKG1hcmsubGluZSAtIGkgKyAxKS50b1N0cmluZygpLCBsaW5lTm9MZW5ndGgpICtcbiAgICAgICcgfCAnICsgbGluZS5zdHIgKyAnXFxuJyArIHJlc3VsdDtcbiAgfVxuXG4gIGxpbmUgPSBnZXRMaW5lKG1hcmsuYnVmZmVyLCBsaW5lU3RhcnRzW2ZvdW5kTGluZU5vXSwgbGluZUVuZHNbZm91bmRMaW5lTm9dLCBtYXJrLnBvc2l0aW9uLCBtYXhMaW5lTGVuZ3RoKTtcbiAgcmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJyAnLCBvcHRpb25zLmluZGVudCkgKyBwYWRTdGFydCgobWFyay5saW5lICsgMSkudG9TdHJpbmcoKSwgbGluZU5vTGVuZ3RoKSArXG4gICAgJyB8ICcgKyBsaW5lLnN0ciArICdcXG4nO1xuICByZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnLScsIG9wdGlvbnMuaW5kZW50ICsgbGluZU5vTGVuZ3RoICsgMyArIGxpbmUucG9zKSArICdeJyArICdcXG4nO1xuXG4gIGZvciAoaSA9IDE7IGkgPD0gb3B0aW9ucy5saW5lc0FmdGVyOyBpKyspIHtcbiAgICBpZiAoZm91bmRMaW5lTm8gKyBpID49IGxpbmVFbmRzLmxlbmd0aCkgYnJlYWs7XG4gICAgbGluZSA9IGdldExpbmUoXG4gICAgICBtYXJrLmJ1ZmZlcixcbiAgICAgIGxpbmVTdGFydHNbZm91bmRMaW5lTm8gKyBpXSxcbiAgICAgIGxpbmVFbmRzW2ZvdW5kTGluZU5vICsgaV0sXG4gICAgICBtYXJrLnBvc2l0aW9uIC0gKGxpbmVTdGFydHNbZm91bmRMaW5lTm9dIC0gbGluZVN0YXJ0c1tmb3VuZExpbmVObyArIGldKSxcbiAgICAgIG1heExpbmVMZW5ndGhcbiAgICApO1xuICAgIHJlc3VsdCArPSBjb21tb24ucmVwZWF0KCcgJywgb3B0aW9ucy5pbmRlbnQpICsgcGFkU3RhcnQoKG1hcmsubGluZSArIGkgKyAxKS50b1N0cmluZygpLCBsaW5lTm9MZW5ndGgpICtcbiAgICAgICcgfCAnICsgbGluZS5zdHIgKyAnXFxuJztcbiAgfVxuXG4gIHJldHVybiByZXN1bHQucmVwbGFjZSgvXFxuJC8sICcnKTtcbn1cblxuXG52YXIgc25pcHBldCA9IG1ha2VTbmlwcGV0O1xuXG52YXIgVFlQRV9DT05TVFJVQ1RPUl9PUFRJT05TID0gW1xuICAna2luZCcsXG4gICdtdWx0aScsXG4gICdyZXNvbHZlJyxcbiAgJ2NvbnN0cnVjdCcsXG4gICdpbnN0YW5jZU9mJyxcbiAgJ3ByZWRpY2F0ZScsXG4gICdyZXByZXNlbnQnLFxuICAncmVwcmVzZW50TmFtZScsXG4gICdkZWZhdWx0U3R5bGUnLFxuICAnc3R5bGVBbGlhc2VzJ1xuXTtcblxudmFyIFlBTUxfTk9ERV9LSU5EUyA9IFtcbiAgJ3NjYWxhcicsXG4gICdzZXF1ZW5jZScsXG4gICdtYXBwaW5nJ1xuXTtcblxuZnVuY3Rpb24gY29tcGlsZVN0eWxlQWxpYXNlcyhtYXApIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuXG4gIGlmIChtYXAgIT09IG51bGwpIHtcbiAgICBPYmplY3Qua2V5cyhtYXApLmZvckVhY2goZnVuY3Rpb24gKHN0eWxlKSB7XG4gICAgICBtYXBbc3R5bGVdLmZvckVhY2goZnVuY3Rpb24gKGFsaWFzKSB7XG4gICAgICAgIHJlc3VsdFtTdHJpbmcoYWxpYXMpXSA9IHN0eWxlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBUeXBlJDEodGFnLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIE9iamVjdC5rZXlzKG9wdGlvbnMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAoVFlQRV9DT05TVFJVQ1RPUl9PUFRJT05TLmluZGV4T2YobmFtZSkgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgZXhjZXB0aW9uKCdVbmtub3duIG9wdGlvbiBcIicgKyBuYW1lICsgJ1wiIGlzIG1ldCBpbiBkZWZpbml0aW9uIG9mIFwiJyArIHRhZyArICdcIiBZQU1MIHR5cGUuJyk7XG4gICAgfVxuICB9KTtcblxuICAvLyBUT0RPOiBBZGQgdGFnIGZvcm1hdCBjaGVjay5cbiAgdGhpcy5vcHRpb25zICAgICAgID0gb3B0aW9uczsgLy8ga2VlcCBvcmlnaW5hbCBvcHRpb25zIGluIGNhc2UgdXNlciB3YW50cyB0byBleHRlbmQgdGhpcyB0eXBlIGxhdGVyXG4gIHRoaXMudGFnICAgICAgICAgICA9IHRhZztcbiAgdGhpcy5raW5kICAgICAgICAgID0gb3B0aW9uc1sna2luZCddICAgICAgICAgIHx8IG51bGw7XG4gIHRoaXMucmVzb2x2ZSAgICAgICA9IG9wdGlvbnNbJ3Jlc29sdmUnXSAgICAgICB8fCBmdW5jdGlvbiAoKSB7IHJldHVybiB0cnVlOyB9O1xuICB0aGlzLmNvbnN0cnVjdCAgICAgPSBvcHRpb25zWydjb25zdHJ1Y3QnXSAgICAgfHwgZnVuY3Rpb24gKGRhdGEpIHsgcmV0dXJuIGRhdGE7IH07XG4gIHRoaXMuaW5zdGFuY2VPZiAgICA9IG9wdGlvbnNbJ2luc3RhbmNlT2YnXSAgICB8fCBudWxsO1xuICB0aGlzLnByZWRpY2F0ZSAgICAgPSBvcHRpb25zWydwcmVkaWNhdGUnXSAgICAgfHwgbnVsbDtcbiAgdGhpcy5yZXByZXNlbnQgICAgID0gb3B0aW9uc1sncmVwcmVzZW50J10gICAgIHx8IG51bGw7XG4gIHRoaXMucmVwcmVzZW50TmFtZSA9IG9wdGlvbnNbJ3JlcHJlc2VudE5hbWUnXSB8fCBudWxsO1xuICB0aGlzLmRlZmF1bHRTdHlsZSAgPSBvcHRpb25zWydkZWZhdWx0U3R5bGUnXSAgfHwgbnVsbDtcbiAgdGhpcy5tdWx0aSAgICAgICAgID0gb3B0aW9uc1snbXVsdGknXSAgICAgICAgIHx8IGZhbHNlO1xuICB0aGlzLnN0eWxlQWxpYXNlcyAgPSBjb21waWxlU3R5bGVBbGlhc2VzKG9wdGlvbnNbJ3N0eWxlQWxpYXNlcyddIHx8IG51bGwpO1xuXG4gIGlmIChZQU1MX05PREVfS0lORFMuaW5kZXhPZih0aGlzLmtpbmQpID09PSAtMSkge1xuICAgIHRocm93IG5ldyBleGNlcHRpb24oJ1Vua25vd24ga2luZCBcIicgKyB0aGlzLmtpbmQgKyAnXCIgaXMgc3BlY2lmaWVkIGZvciBcIicgKyB0YWcgKyAnXCIgWUFNTCB0eXBlLicpO1xuICB9XG59XG5cbnZhciB0eXBlID0gVHlwZSQxO1xuXG4vKmVzbGludC1kaXNhYmxlIG1heC1sZW4qL1xuXG5cblxuXG5cbmZ1bmN0aW9uIGNvbXBpbGVMaXN0KHNjaGVtYSwgbmFtZSkge1xuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgc2NoZW1hW25hbWVdLmZvckVhY2goZnVuY3Rpb24gKGN1cnJlbnRUeXBlKSB7XG4gICAgdmFyIG5ld0luZGV4ID0gcmVzdWx0Lmxlbmd0aDtcblxuICAgIHJlc3VsdC5mb3JFYWNoKGZ1bmN0aW9uIChwcmV2aW91c1R5cGUsIHByZXZpb3VzSW5kZXgpIHtcbiAgICAgIGlmIChwcmV2aW91c1R5cGUudGFnID09PSBjdXJyZW50VHlwZS50YWcgJiZcbiAgICAgICAgICBwcmV2aW91c1R5cGUua2luZCA9PT0gY3VycmVudFR5cGUua2luZCAmJlxuICAgICAgICAgIHByZXZpb3VzVHlwZS5tdWx0aSA9PT0gY3VycmVudFR5cGUubXVsdGkpIHtcblxuICAgICAgICBuZXdJbmRleCA9IHByZXZpb3VzSW5kZXg7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXN1bHRbbmV3SW5kZXhdID0gY3VycmVudFR5cGU7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuZnVuY3Rpb24gY29tcGlsZU1hcCgvKiBsaXN0cy4uLiAqLykge1xuICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICBzY2FsYXI6IHt9LFxuICAgICAgICBzZXF1ZW5jZToge30sXG4gICAgICAgIG1hcHBpbmc6IHt9LFxuICAgICAgICBmYWxsYmFjazoge30sXG4gICAgICAgIG11bHRpOiB7XG4gICAgICAgICAgc2NhbGFyOiBbXSxcbiAgICAgICAgICBzZXF1ZW5jZTogW10sXG4gICAgICAgICAgbWFwcGluZzogW10sXG4gICAgICAgICAgZmFsbGJhY2s6IFtdXG4gICAgICAgIH1cbiAgICAgIH0sIGluZGV4LCBsZW5ndGg7XG5cbiAgZnVuY3Rpb24gY29sbGVjdFR5cGUodHlwZSkge1xuICAgIGlmICh0eXBlLm11bHRpKSB7XG4gICAgICByZXN1bHQubXVsdGlbdHlwZS5raW5kXS5wdXNoKHR5cGUpO1xuICAgICAgcmVzdWx0Lm11bHRpWydmYWxsYmFjayddLnB1c2godHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdFt0eXBlLmtpbmRdW3R5cGUudGFnXSA9IHJlc3VsdFsnZmFsbGJhY2snXVt0eXBlLnRhZ10gPSB0eXBlO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGFyZ3VtZW50c1tpbmRleF0uZm9yRWFjaChjb2xsZWN0VHlwZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5mdW5jdGlvbiBTY2hlbWEkMShkZWZpbml0aW9uKSB7XG4gIHJldHVybiB0aGlzLmV4dGVuZChkZWZpbml0aW9uKTtcbn1cblxuXG5TY2hlbWEkMS5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKGRlZmluaXRpb24pIHtcbiAgdmFyIGltcGxpY2l0ID0gW107XG4gIHZhciBleHBsaWNpdCA9IFtdO1xuXG4gIGlmIChkZWZpbml0aW9uIGluc3RhbmNlb2YgdHlwZSkge1xuICAgIC8vIFNjaGVtYS5leHRlbmQodHlwZSlcbiAgICBleHBsaWNpdC5wdXNoKGRlZmluaXRpb24pO1xuXG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkZWZpbml0aW9uKSkge1xuICAgIC8vIFNjaGVtYS5leHRlbmQoWyB0eXBlMSwgdHlwZTIsIC4uLiBdKVxuICAgIGV4cGxpY2l0ID0gZXhwbGljaXQuY29uY2F0KGRlZmluaXRpb24pO1xuXG4gIH0gZWxzZSBpZiAoZGVmaW5pdGlvbiAmJiAoQXJyYXkuaXNBcnJheShkZWZpbml0aW9uLmltcGxpY2l0KSB8fCBBcnJheS5pc0FycmF5KGRlZmluaXRpb24uZXhwbGljaXQpKSkge1xuICAgIC8vIFNjaGVtYS5leHRlbmQoeyBleHBsaWNpdDogWyB0eXBlMSwgdHlwZTIsIC4uLiBdLCBpbXBsaWNpdDogWyB0eXBlMSwgdHlwZTIsIC4uLiBdIH0pXG4gICAgaWYgKGRlZmluaXRpb24uaW1wbGljaXQpIGltcGxpY2l0ID0gaW1wbGljaXQuY29uY2F0KGRlZmluaXRpb24uaW1wbGljaXQpO1xuICAgIGlmIChkZWZpbml0aW9uLmV4cGxpY2l0KSBleHBsaWNpdCA9IGV4cGxpY2l0LmNvbmNhdChkZWZpbml0aW9uLmV4cGxpY2l0KTtcblxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBleGNlcHRpb24oJ1NjaGVtYS5leHRlbmQgYXJndW1lbnQgc2hvdWxkIGJlIGEgVHlwZSwgWyBUeXBlIF0sICcgK1xuICAgICAgJ29yIGEgc2NoZW1hIGRlZmluaXRpb24gKHsgaW1wbGljaXQ6IFsuLi5dLCBleHBsaWNpdDogWy4uLl0gfSknKTtcbiAgfVxuXG4gIGltcGxpY2l0LmZvckVhY2goZnVuY3Rpb24gKHR5cGUkMSkge1xuICAgIGlmICghKHR5cGUkMSBpbnN0YW5jZW9mIHR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgZXhjZXB0aW9uKCdTcGVjaWZpZWQgbGlzdCBvZiBZQU1MIHR5cGVzIChvciBhIHNpbmdsZSBUeXBlIG9iamVjdCkgY29udGFpbnMgYSBub24tVHlwZSBvYmplY3QuJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGUkMS5sb2FkS2luZCAmJiB0eXBlJDEubG9hZEtpbmQgIT09ICdzY2FsYXInKSB7XG4gICAgICB0aHJvdyBuZXcgZXhjZXB0aW9uKCdUaGVyZSBpcyBhIG5vbi1zY2FsYXIgdHlwZSBpbiB0aGUgaW1wbGljaXQgbGlzdCBvZiBhIHNjaGVtYS4gSW1wbGljaXQgcmVzb2x2aW5nIG9mIHN1Y2ggdHlwZXMgaXMgbm90IHN1cHBvcnRlZC4nKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZSQxLm11bHRpKSB7XG4gICAgICB0aHJvdyBuZXcgZXhjZXB0aW9uKCdUaGVyZSBpcyBhIG11bHRpIHR5cGUgaW4gdGhlIGltcGxpY2l0IGxpc3Qgb2YgYSBzY2hlbWEuIE11bHRpIHRhZ3MgY2FuIG9ubHkgYmUgbGlzdGVkIGFzIGV4cGxpY2l0LicpO1xuICAgIH1cbiAgfSk7XG5cbiAgZXhwbGljaXQuZm9yRWFjaChmdW5jdGlvbiAodHlwZSQxKSB7XG4gICAgaWYgKCEodHlwZSQxIGluc3RhbmNlb2YgdHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBleGNlcHRpb24oJ1NwZWNpZmllZCBsaXN0IG9mIFlBTUwgdHlwZXMgKG9yIGEgc2luZ2xlIFR5cGUgb2JqZWN0KSBjb250YWlucyBhIG5vbi1UeXBlIG9iamVjdC4nKTtcbiAgICB9XG4gIH0pO1xuXG4gIHZhciByZXN1bHQgPSBPYmplY3QuY3JlYXRlKFNjaGVtYSQxLnByb3RvdHlwZSk7XG5cbiAgcmVzdWx0LmltcGxpY2l0ID0gKHRoaXMuaW1wbGljaXQgfHwgW10pLmNvbmNhdChpbXBsaWNpdCk7XG4gIHJlc3VsdC5leHBsaWNpdCA9ICh0aGlzLmV4cGxpY2l0IHx8IFtdKS5jb25jYXQoZXhwbGljaXQpO1xuXG4gIHJlc3VsdC5jb21waWxlZEltcGxpY2l0ID0gY29tcGlsZUxpc3QocmVzdWx0LCAnaW1wbGljaXQnKTtcbiAgcmVzdWx0LmNvbXBpbGVkRXhwbGljaXQgPSBjb21waWxlTGlzdChyZXN1bHQsICdleHBsaWNpdCcpO1xuICByZXN1bHQuY29tcGlsZWRUeXBlTWFwICA9IGNvbXBpbGVNYXAocmVzdWx0LmNvbXBpbGVkSW1wbGljaXQsIHJlc3VsdC5jb21waWxlZEV4cGxpY2l0KTtcblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG52YXIgc2NoZW1hID0gU2NoZW1hJDE7XG5cbnZhciBzdHIgPSBuZXcgdHlwZSgndGFnOnlhbWwub3JnLDIwMDI6c3RyJywge1xuICBraW5kOiAnc2NhbGFyJyxcbiAgY29uc3RydWN0OiBmdW5jdGlvbiAoZGF0YSkgeyByZXR1cm4gZGF0YSAhPT0gbnVsbCA/IGRhdGEgOiAnJzsgfVxufSk7XG5cbnZhciBzZXEgPSBuZXcgdHlwZSgndGFnOnlhbWwub3JnLDIwMDI6c2VxJywge1xuICBraW5kOiAnc2VxdWVuY2UnLFxuICBjb25zdHJ1Y3Q6IGZ1bmN0aW9uIChkYXRhKSB7IHJldHVybiBkYXRhICE9PSBudWxsID8gZGF0YSA6IFtdOyB9XG59KTtcblxudmFyIG1hcCA9IG5ldyB0eXBlKCd0YWc6eWFtbC5vcmcsMjAwMjptYXAnLCB7XG4gIGtpbmQ6ICdtYXBwaW5nJyxcbiAgY29uc3RydWN0OiBmdW5jdGlvbiAoZGF0YSkgeyByZXR1cm4gZGF0YSAhPT0gbnVsbCA/IGRhdGEgOiB7fTsgfVxufSk7XG5cbnZhciBmYWlsc2FmZSA9IG5ldyBzY2hlbWEoe1xuICBleHBsaWNpdDogW1xuICAgIHN0cixcbiAgICBzZXEsXG4gICAgbWFwXG4gIF1cbn0pO1xuXG5mdW5jdGlvbiByZXNvbHZlWWFtbE51bGwoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XG5cbiAgdmFyIG1heCA9IGRhdGEubGVuZ3RoO1xuXG4gIHJldHVybiAobWF4ID09PSAxICYmIGRhdGEgPT09ICd+JykgfHxcbiAgICAgICAgIChtYXggPT09IDQgJiYgKGRhdGEgPT09ICdudWxsJyB8fCBkYXRhID09PSAnTnVsbCcgfHwgZGF0YSA9PT0gJ05VTEwnKSk7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxOdWxsKCkge1xuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNOdWxsKG9iamVjdCkge1xuICByZXR1cm4gb2JqZWN0ID09PSBudWxsO1xufVxuXG52YXIgX251bGwgPSBuZXcgdHlwZSgndGFnOnlhbWwub3JnLDIwMDI6bnVsbCcsIHtcbiAga2luZDogJ3NjYWxhcicsXG4gIHJlc29sdmU6IHJlc29sdmVZYW1sTnVsbCxcbiAgY29uc3RydWN0OiBjb25zdHJ1Y3RZYW1sTnVsbCxcbiAgcHJlZGljYXRlOiBpc051bGwsXG4gIHJlcHJlc2VudDoge1xuICAgIGNhbm9uaWNhbDogZnVuY3Rpb24gKCkgeyByZXR1cm4gJ34nOyAgICB9LFxuICAgIGxvd2VyY2FzZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJ251bGwnOyB9LFxuICAgIHVwcGVyY2FzZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJ05VTEwnOyB9LFxuICAgIGNhbWVsY2FzZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJ051bGwnOyB9LFxuICAgIGVtcHR5OiAgICAgZnVuY3Rpb24gKCkgeyByZXR1cm4gJyc7ICAgICB9XG4gIH0sXG4gIGRlZmF1bHRTdHlsZTogJ2xvd2VyY2FzZSdcbn0pO1xuXG5mdW5jdGlvbiByZXNvbHZlWWFtbEJvb2xlYW4oZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBtYXggPSBkYXRhLmxlbmd0aDtcblxuICByZXR1cm4gKG1heCA9PT0gNCAmJiAoZGF0YSA9PT0gJ3RydWUnIHx8IGRhdGEgPT09ICdUcnVlJyB8fCBkYXRhID09PSAnVFJVRScpKSB8fFxuICAgICAgICAgKG1heCA9PT0gNSAmJiAoZGF0YSA9PT0gJ2ZhbHNlJyB8fCBkYXRhID09PSAnRmFsc2UnIHx8IGRhdGEgPT09ICdGQUxTRScpKTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0WWFtbEJvb2xlYW4oZGF0YSkge1xuICByZXR1cm4gZGF0YSA9PT0gJ3RydWUnIHx8XG4gICAgICAgICBkYXRhID09PSAnVHJ1ZScgfHxcbiAgICAgICAgIGRhdGEgPT09ICdUUlVFJztcbn1cblxuZnVuY3Rpb24gaXNCb29sZWFuKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT09ICdbb2JqZWN0IEJvb2xlYW5dJztcbn1cblxudmFyIGJvb2wgPSBuZXcgdHlwZSgndGFnOnlhbWwub3JnLDIwMDI6Ym9vbCcsIHtcbiAga2luZDogJ3NjYWxhcicsXG4gIHJlc29sdmU6IHJlc29sdmVZYW1sQm9vbGVhbixcbiAgY29uc3RydWN0OiBjb25zdHJ1Y3RZYW1sQm9vbGVhbixcbiAgcHJlZGljYXRlOiBpc0Jvb2xlYW4sXG4gIHJlcHJlc2VudDoge1xuICAgIGxvd2VyY2FzZTogZnVuY3Rpb24gKG9iamVjdCkgeyByZXR1cm4gb2JqZWN0ID8gJ3RydWUnIDogJ2ZhbHNlJzsgfSxcbiAgICB1cHBlcmNhc2U6IGZ1bmN0aW9uIChvYmplY3QpIHsgcmV0dXJuIG9iamVjdCA/ICdUUlVFJyA6ICdGQUxTRSc7IH0sXG4gICAgY2FtZWxjYXNlOiBmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiBvYmplY3QgPyAnVHJ1ZScgOiAnRmFsc2UnOyB9XG4gIH0sXG4gIGRlZmF1bHRTdHlsZTogJ2xvd2VyY2FzZSdcbn0pO1xuXG5mdW5jdGlvbiBpc0hleENvZGUoYykge1xuICByZXR1cm4gKCgweDMwLyogMCAqLyA8PSBjKSAmJiAoYyA8PSAweDM5LyogOSAqLykpIHx8XG4gICAgICAgICAoKDB4NDEvKiBBICovIDw9IGMpICYmIChjIDw9IDB4NDYvKiBGICovKSkgfHxcbiAgICAgICAgICgoMHg2MS8qIGEgKi8gPD0gYykgJiYgKGMgPD0gMHg2Ni8qIGYgKi8pKTtcbn1cblxuZnVuY3Rpb24gaXNPY3RDb2RlKGMpIHtcbiAgcmV0dXJuICgoMHgzMC8qIDAgKi8gPD0gYykgJiYgKGMgPD0gMHgzNy8qIDcgKi8pKTtcbn1cblxuZnVuY3Rpb24gaXNEZWNDb2RlKGMpIHtcbiAgcmV0dXJuICgoMHgzMC8qIDAgKi8gPD0gYykgJiYgKGMgPD0gMHgzOS8qIDkgKi8pKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxJbnRlZ2VyKGRhdGEpIHtcbiAgaWYgKGRhdGEgPT09IG51bGwpIHJldHVybiBmYWxzZTtcblxuICB2YXIgbWF4ID0gZGF0YS5sZW5ndGgsXG4gICAgICBpbmRleCA9IDAsXG4gICAgICBoYXNEaWdpdHMgPSBmYWxzZSxcbiAgICAgIGNoO1xuXG4gIGlmICghbWF4KSByZXR1cm4gZmFsc2U7XG5cbiAgY2ggPSBkYXRhW2luZGV4XTtcblxuICAvLyBzaWduXG4gIGlmIChjaCA9PT0gJy0nIHx8IGNoID09PSAnKycpIHtcbiAgICBjaCA9IGRhdGFbKytpbmRleF07XG4gIH1cblxuICBpZiAoY2ggPT09ICcwJykge1xuICAgIC8vIDBcbiAgICBpZiAoaW5kZXggKyAxID09PSBtYXgpIHJldHVybiB0cnVlO1xuICAgIGNoID0gZGF0YVsrK2luZGV4XTtcblxuICAgIC8vIGJhc2UgMiwgYmFzZSA4LCBiYXNlIDE2XG5cbiAgICBpZiAoY2ggPT09ICdiJykge1xuICAgICAgLy8gYmFzZSAyXG4gICAgICBpbmRleCsrO1xuXG4gICAgICBmb3IgKDsgaW5kZXggPCBtYXg7IGluZGV4KyspIHtcbiAgICAgICAgY2ggPSBkYXRhW2luZGV4XTtcbiAgICAgICAgaWYgKGNoID09PSAnXycpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoY2ggIT09ICcwJyAmJiBjaCAhPT0gJzEnKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGhhc0RpZ2l0cyA9IHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzRGlnaXRzICYmIGNoICE9PSAnXyc7XG4gICAgfVxuXG5cbiAgICBpZiAoY2ggPT09ICd4Jykge1xuICAgICAgLy8gYmFzZSAxNlxuICAgICAgaW5kZXgrKztcblxuICAgICAgZm9yICg7IGluZGV4IDwgbWF4OyBpbmRleCsrKSB7XG4gICAgICAgIGNoID0gZGF0YVtpbmRleF07XG4gICAgICAgIGlmIChjaCA9PT0gJ18nKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFpc0hleENvZGUoZGF0YS5jaGFyQ29kZUF0KGluZGV4KSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaGFzRGlnaXRzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNEaWdpdHMgJiYgY2ggIT09ICdfJztcbiAgICB9XG5cblxuICAgIGlmIChjaCA9PT0gJ28nKSB7XG4gICAgICAvLyBiYXNlIDhcbiAgICAgIGluZGV4Kys7XG5cbiAgICAgIGZvciAoOyBpbmRleCA8IG1heDsgaW5kZXgrKykge1xuICAgICAgICBjaCA9IGRhdGFbaW5kZXhdO1xuICAgICAgICBpZiAoY2ggPT09ICdfJykgY29udGludWU7XG4gICAgICAgIGlmICghaXNPY3RDb2RlKGRhdGEuY2hhckNvZGVBdChpbmRleCkpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGhhc0RpZ2l0cyA9IHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzRGlnaXRzICYmIGNoICE9PSAnXyc7XG4gICAgfVxuICB9XG5cbiAgLy8gYmFzZSAxMCAoZXhjZXB0IDApXG5cbiAgLy8gdmFsdWUgc2hvdWxkIG5vdCBzdGFydCB3aXRoIGBfYDtcbiAgaWYgKGNoID09PSAnXycpIHJldHVybiBmYWxzZTtcblxuICBmb3IgKDsgaW5kZXggPCBtYXg7IGluZGV4KyspIHtcbiAgICBjaCA9IGRhdGFbaW5kZXhdO1xuICAgIGlmIChjaCA9PT0gJ18nKSBjb250aW51ZTtcbiAgICBpZiAoIWlzRGVjQ29kZShkYXRhLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBoYXNEaWdpdHMgPSB0cnVlO1xuICB9XG5cbiAgLy8gU2hvdWxkIGhhdmUgZGlnaXRzIGFuZCBzaG91bGQgbm90IGVuZCB3aXRoIGBfYFxuICBpZiAoIWhhc0RpZ2l0cyB8fCBjaCA9PT0gJ18nKSByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxJbnRlZ2VyKGRhdGEpIHtcbiAgdmFyIHZhbHVlID0gZGF0YSwgc2lnbiA9IDEsIGNoO1xuXG4gIGlmICh2YWx1ZS5pbmRleE9mKCdfJykgIT09IC0xKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9fL2csICcnKTtcbiAgfVxuXG4gIGNoID0gdmFsdWVbMF07XG5cbiAgaWYgKGNoID09PSAnLScgfHwgY2ggPT09ICcrJykge1xuICAgIGlmIChjaCA9PT0gJy0nKSBzaWduID0gLTE7XG4gICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgxKTtcbiAgICBjaCA9IHZhbHVlWzBdO1xuICB9XG5cbiAgaWYgKHZhbHVlID09PSAnMCcpIHJldHVybiAwO1xuXG4gIGlmIChjaCA9PT0gJzAnKSB7XG4gICAgaWYgKHZhbHVlWzFdID09PSAnYicpIHJldHVybiBzaWduICogcGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIDIpO1xuICAgIGlmICh2YWx1ZVsxXSA9PT0gJ3gnKSByZXR1cm4gc2lnbiAqIHBhcnNlSW50KHZhbHVlLnNsaWNlKDIpLCAxNik7XG4gICAgaWYgKHZhbHVlWzFdID09PSAnbycpIHJldHVybiBzaWduICogcGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIDgpO1xuICB9XG5cbiAgcmV0dXJuIHNpZ24gKiBwYXJzZUludCh2YWx1ZSwgMTApO1xufVxuXG5mdW5jdGlvbiBpc0ludGVnZXIob2JqZWN0KSB7XG4gIHJldHVybiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkpID09PSAnW29iamVjdCBOdW1iZXJdJyAmJlxuICAgICAgICAgKG9iamVjdCAlIDEgPT09IDAgJiYgIWNvbW1vbi5pc05lZ2F0aXZlWmVybyhvYmplY3QpKTtcbn1cblxudmFyIGludCA9IG5ldyB0eXBlKCd0YWc6eWFtbC5vcmcsMjAwMjppbnQnLCB7XG4gIGtpbmQ6ICdzY2FsYXInLFxuICByZXNvbHZlOiByZXNvbHZlWWFtbEludGVnZXIsXG4gIGNvbnN0cnVjdDogY29uc3RydWN0WWFtbEludGVnZXIsXG4gIHByZWRpY2F0ZTogaXNJbnRlZ2VyLFxuICByZXByZXNlbnQ6IHtcbiAgICBiaW5hcnk6ICAgICAgZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gb2JqID49IDAgPyAnMGInICsgb2JqLnRvU3RyaW5nKDIpIDogJy0wYicgKyBvYmoudG9TdHJpbmcoMikuc2xpY2UoMSk7IH0sXG4gICAgb2N0YWw6ICAgICAgIGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiA+PSAwID8gJzBvJyAgKyBvYmoudG9TdHJpbmcoOCkgOiAnLTBvJyAgKyBvYmoudG9TdHJpbmcoOCkuc2xpY2UoMSk7IH0sXG4gICAgZGVjaW1hbDogICAgIGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iai50b1N0cmluZygxMCk7IH0sXG4gICAgLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuICAgIGhleGFkZWNpbWFsOiBmdW5jdGlvbiAob2JqKSB7IHJldHVybiBvYmogPj0gMCA/ICcweCcgKyBvYmoudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkgOiAgJy0weCcgKyBvYmoudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkuc2xpY2UoMSk7IH1cbiAgfSxcbiAgZGVmYXVsdFN0eWxlOiAnZGVjaW1hbCcsXG4gIHN0eWxlQWxpYXNlczoge1xuICAgIGJpbmFyeTogICAgICBbIDIsICAnYmluJyBdLFxuICAgIG9jdGFsOiAgICAgICBbIDgsICAnb2N0JyBdLFxuICAgIGRlY2ltYWw6ICAgICBbIDEwLCAnZGVjJyBdLFxuICAgIGhleGFkZWNpbWFsOiBbIDE2LCAnaGV4JyBdXG4gIH1cbn0pO1xuXG52YXIgWUFNTF9GTE9BVF9QQVRURVJOID0gbmV3IFJlZ0V4cChcbiAgLy8gMi41ZTQsIDIuNSBhbmQgaW50ZWdlcnNcbiAgJ14oPzpbLStdPyg/OlswLTldWzAtOV9dKikoPzpcXFxcLlswLTlfXSopPyg/OltlRV1bLStdP1swLTldKyk/JyArXG4gIC8vIC4yZTQsIC4yXG4gIC8vIHNwZWNpYWwgY2FzZSwgc2VlbXMgbm90IGZyb20gc3BlY1xuICAnfFxcXFwuWzAtOV9dKyg/OltlRV1bLStdP1swLTldKyk/JyArXG4gIC8vIC5pbmZcbiAgJ3xbLStdP1xcXFwuKD86aW5mfEluZnxJTkYpJyArXG4gIC8vIC5uYW5cbiAgJ3xcXFxcLig/Om5hbnxOYU58TkFOKSkkJyk7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sRmxvYXQoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICghWUFNTF9GTE9BVF9QQVRURVJOLnRlc3QoZGF0YSkgfHxcbiAgICAgIC8vIFF1aWNrIGhhY2sgdG8gbm90IGFsbG93IGludGVnZXJzIGVuZCB3aXRoIGBfYFxuICAgICAgLy8gUHJvYmFibHkgc2hvdWxkIHVwZGF0ZSByZWdleHAgJiBjaGVjayBzcGVlZFxuICAgICAgZGF0YVtkYXRhLmxlbmd0aCAtIDFdID09PSAnXycpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0WWFtbEZsb2F0KGRhdGEpIHtcbiAgdmFyIHZhbHVlLCBzaWduO1xuXG4gIHZhbHVlICA9IGRhdGEucmVwbGFjZSgvXy9nLCAnJykudG9Mb3dlckNhc2UoKTtcbiAgc2lnbiAgID0gdmFsdWVbMF0gPT09ICctJyA/IC0xIDogMTtcblxuICBpZiAoJystJy5pbmRleE9mKHZhbHVlWzBdKSA+PSAwKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgxKTtcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PT0gJy5pbmYnKSB7XG4gICAgcmV0dXJuIChzaWduID09PSAxKSA/IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSA6IE51bWJlci5ORUdBVElWRV9JTkZJTklUWTtcblxuICB9IGVsc2UgaWYgKHZhbHVlID09PSAnLm5hbicpIHtcbiAgICByZXR1cm4gTmFOO1xuICB9XG4gIHJldHVybiBzaWduICogcGFyc2VGbG9hdCh2YWx1ZSwgMTApO1xufVxuXG5cbnZhciBTQ0lFTlRJRklDX1dJVEhPVVRfRE9UID0gL15bLStdP1swLTldK2UvO1xuXG5mdW5jdGlvbiByZXByZXNlbnRZYW1sRmxvYXQob2JqZWN0LCBzdHlsZSkge1xuICB2YXIgcmVzO1xuXG4gIGlmIChpc05hTihvYmplY3QpKSB7XG4gICAgc3dpdGNoIChzdHlsZSkge1xuICAgICAgY2FzZSAnbG93ZXJjYXNlJzogcmV0dXJuICcubmFuJztcbiAgICAgIGNhc2UgJ3VwcGVyY2FzZSc6IHJldHVybiAnLk5BTic7XG4gICAgICBjYXNlICdjYW1lbGNhc2UnOiByZXR1cm4gJy5OYU4nO1xuICAgIH1cbiAgfSBlbHNlIGlmIChOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFkgPT09IG9iamVjdCkge1xuICAgIHN3aXRjaCAoc3R5bGUpIHtcbiAgICAgIGNhc2UgJ2xvd2VyY2FzZSc6IHJldHVybiAnLmluZic7XG4gICAgICBjYXNlICd1cHBlcmNhc2UnOiByZXR1cm4gJy5JTkYnO1xuICAgICAgY2FzZSAnY2FtZWxjYXNlJzogcmV0dXJuICcuSW5mJztcbiAgICB9XG4gIH0gZWxzZSBpZiAoTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZID09PSBvYmplY3QpIHtcbiAgICBzd2l0Y2ggKHN0eWxlKSB7XG4gICAgICBjYXNlICdsb3dlcmNhc2UnOiByZXR1cm4gJy0uaW5mJztcbiAgICAgIGNhc2UgJ3VwcGVyY2FzZSc6IHJldHVybiAnLS5JTkYnO1xuICAgICAgY2FzZSAnY2FtZWxjYXNlJzogcmV0dXJuICctLkluZic7XG4gICAgfVxuICB9IGVsc2UgaWYgKGNvbW1vbi5pc05lZ2F0aXZlWmVybyhvYmplY3QpKSB7XG4gICAgcmV0dXJuICctMC4wJztcbiAgfVxuXG4gIHJlcyA9IG9iamVjdC50b1N0cmluZygxMCk7XG5cbiAgLy8gSlMgc3RyaW5naWZpZXIgY2FuIGJ1aWxkIHNjaWVudGlmaWMgZm9ybWF0IHdpdGhvdXQgZG90czogNWUtMTAwLFxuICAvLyB3aGlsZSBZQU1MIHJlcXVyZXMgZG90OiA1LmUtMTAwLiBGaXggaXQgd2l0aCBzaW1wbGUgaGFja1xuXG4gIHJldHVybiBTQ0lFTlRJRklDX1dJVEhPVVRfRE9ULnRlc3QocmVzKSA/IHJlcy5yZXBsYWNlKCdlJywgJy5lJykgOiByZXM7XG59XG5cbmZ1bmN0aW9uIGlzRmxvYXQob2JqZWN0KSB7XG4gIHJldHVybiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT09ICdbb2JqZWN0IE51bWJlcl0nKSAmJlxuICAgICAgICAgKG9iamVjdCAlIDEgIT09IDAgfHwgY29tbW9uLmlzTmVnYXRpdmVaZXJvKG9iamVjdCkpO1xufVxuXG52YXIgZmxvYXQgPSBuZXcgdHlwZSgndGFnOnlhbWwub3JnLDIwMDI6ZmxvYXQnLCB7XG4gIGtpbmQ6ICdzY2FsYXInLFxuICByZXNvbHZlOiByZXNvbHZlWWFtbEZsb2F0LFxuICBjb25zdHJ1Y3Q6IGNvbnN0cnVjdFlhbWxGbG9hdCxcbiAgcHJlZGljYXRlOiBpc0Zsb2F0LFxuICByZXByZXNlbnQ6IHJlcHJlc2VudFlhbWxGbG9hdCxcbiAgZGVmYXVsdFN0eWxlOiAnbG93ZXJjYXNlJ1xufSk7XG5cbnZhciBqc29uID0gZmFpbHNhZmUuZXh0ZW5kKHtcbiAgaW1wbGljaXQ6IFtcbiAgICBfbnVsbCxcbiAgICBib29sLFxuICAgIGludCxcbiAgICBmbG9hdFxuICBdXG59KTtcblxudmFyIGNvcmUgPSBqc29uO1xuXG52YXIgWUFNTF9EQVRFX1JFR0VYUCA9IG5ldyBSZWdFeHAoXG4gICdeKFswLTldWzAtOV1bMC05XVswLTldKScgICAgICAgICAgKyAvLyBbMV0geWVhclxuICAnLShbMC05XVswLTldKScgICAgICAgICAgICAgICAgICAgICsgLy8gWzJdIG1vbnRoXG4gICctKFswLTldWzAtOV0pJCcpOyAgICAgICAgICAgICAgICAgICAvLyBbM10gZGF5XG5cbnZhciBZQU1MX1RJTUVTVEFNUF9SRUdFWFAgPSBuZXcgUmVnRXhwKFxuICAnXihbMC05XVswLTldWzAtOV1bMC05XSknICAgICAgICAgICsgLy8gWzFdIHllYXJcbiAgJy0oWzAtOV1bMC05XT8pJyAgICAgICAgICAgICAgICAgICArIC8vIFsyXSBtb250aFxuICAnLShbMC05XVswLTldPyknICAgICAgICAgICAgICAgICAgICsgLy8gWzNdIGRheVxuICAnKD86W1R0XXxbIFxcXFx0XSspJyAgICAgICAgICAgICAgICAgKyAvLyAuLi5cbiAgJyhbMC05XVswLTldPyknICAgICAgICAgICAgICAgICAgICArIC8vIFs0XSBob3VyXG4gICc6KFswLTldWzAtOV0pJyAgICAgICAgICAgICAgICAgICAgKyAvLyBbNV0gbWludXRlXG4gICc6KFswLTldWzAtOV0pJyAgICAgICAgICAgICAgICAgICAgKyAvLyBbNl0gc2Vjb25kXG4gICcoPzpcXFxcLihbMC05XSopKT8nICAgICAgICAgICAgICAgICArIC8vIFs3XSBmcmFjdGlvblxuICAnKD86WyBcXFxcdF0qKFp8KFstK10pKFswLTldWzAtOV0/KScgKyAvLyBbOF0gdHogWzldIHR6X3NpZ24gWzEwXSB0el9ob3VyXG4gICcoPzo6KFswLTldWzAtOV0pKT8pKT8kJyk7ICAgICAgICAgICAvLyBbMTFdIHR6X21pbnV0ZVxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbFRpbWVzdGFtcChkYXRhKSB7XG4gIGlmIChkYXRhID09PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gIGlmIChZQU1MX0RBVEVfUkVHRVhQLmV4ZWMoZGF0YSkgIT09IG51bGwpIHJldHVybiB0cnVlO1xuICBpZiAoWUFNTF9USU1FU1RBTVBfUkVHRVhQLmV4ZWMoZGF0YSkgIT09IG51bGwpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxUaW1lc3RhbXAoZGF0YSkge1xuICB2YXIgbWF0Y2gsIHllYXIsIG1vbnRoLCBkYXksIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBmcmFjdGlvbiA9IDAsXG4gICAgICBkZWx0YSA9IG51bGwsIHR6X2hvdXIsIHR6X21pbnV0ZSwgZGF0ZTtcblxuICBtYXRjaCA9IFlBTUxfREFURV9SRUdFWFAuZXhlYyhkYXRhKTtcbiAgaWYgKG1hdGNoID09PSBudWxsKSBtYXRjaCA9IFlBTUxfVElNRVNUQU1QX1JFR0VYUC5leGVjKGRhdGEpO1xuXG4gIGlmIChtYXRjaCA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCdEYXRlIHJlc29sdmUgZXJyb3InKTtcblxuICAvLyBtYXRjaDogWzFdIHllYXIgWzJdIG1vbnRoIFszXSBkYXlcblxuICB5ZWFyID0gKyhtYXRjaFsxXSk7XG4gIG1vbnRoID0gKyhtYXRjaFsyXSkgLSAxOyAvLyBKUyBtb250aCBzdGFydHMgd2l0aCAwXG4gIGRheSA9ICsobWF0Y2hbM10pO1xuXG4gIGlmICghbWF0Y2hbNF0pIHsgLy8gbm8gaG91clxuICAgIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCwgZGF5KSk7XG4gIH1cblxuICAvLyBtYXRjaDogWzRdIGhvdXIgWzVdIG1pbnV0ZSBbNl0gc2Vjb25kIFs3XSBmcmFjdGlvblxuXG4gIGhvdXIgPSArKG1hdGNoWzRdKTtcbiAgbWludXRlID0gKyhtYXRjaFs1XSk7XG4gIHNlY29uZCA9ICsobWF0Y2hbNl0pO1xuXG4gIGlmIChtYXRjaFs3XSkge1xuICAgIGZyYWN0aW9uID0gbWF0Y2hbN10uc2xpY2UoMCwgMyk7XG4gICAgd2hpbGUgKGZyYWN0aW9uLmxlbmd0aCA8IDMpIHsgLy8gbWlsbGktc2Vjb25kc1xuICAgICAgZnJhY3Rpb24gKz0gJzAnO1xuICAgIH1cbiAgICBmcmFjdGlvbiA9ICtmcmFjdGlvbjtcbiAgfVxuXG4gIC8vIG1hdGNoOiBbOF0gdHogWzldIHR6X3NpZ24gWzEwXSB0el9ob3VyIFsxMV0gdHpfbWludXRlXG5cbiAgaWYgKG1hdGNoWzldKSB7XG4gICAgdHpfaG91ciA9ICsobWF0Y2hbMTBdKTtcbiAgICB0el9taW51dGUgPSArKG1hdGNoWzExXSB8fCAwKTtcbiAgICBkZWx0YSA9ICh0el9ob3VyICogNjAgKyB0el9taW51dGUpICogNjAwMDA7IC8vIGRlbHRhIGluIG1pbGktc2Vjb25kc1xuICAgIGlmIChtYXRjaFs5XSA9PT0gJy0nKSBkZWx0YSA9IC1kZWx0YTtcbiAgfVxuXG4gIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZCwgZnJhY3Rpb24pKTtcblxuICBpZiAoZGVsdGEpIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSAtIGRlbHRhKTtcblxuICByZXR1cm4gZGF0ZTtcbn1cblxuZnVuY3Rpb24gcmVwcmVzZW50WWFtbFRpbWVzdGFtcChvYmplY3QgLyosIHN0eWxlKi8pIHtcbiAgcmV0dXJuIG9iamVjdC50b0lTT1N0cmluZygpO1xufVxuXG52YXIgdGltZXN0YW1wID0gbmV3IHR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOnRpbWVzdGFtcCcsIHtcbiAga2luZDogJ3NjYWxhcicsXG4gIHJlc29sdmU6IHJlc29sdmVZYW1sVGltZXN0YW1wLFxuICBjb25zdHJ1Y3Q6IGNvbnN0cnVjdFlhbWxUaW1lc3RhbXAsXG4gIGluc3RhbmNlT2Y6IERhdGUsXG4gIHJlcHJlc2VudDogcmVwcmVzZW50WWFtbFRpbWVzdGFtcFxufSk7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sTWVyZ2UoZGF0YSkge1xuICByZXR1cm4gZGF0YSA9PT0gJzw8JyB8fCBkYXRhID09PSBudWxsO1xufVxuXG52YXIgbWVyZ2UgPSBuZXcgdHlwZSgndGFnOnlhbWwub3JnLDIwMDI6bWVyZ2UnLCB7XG4gIGtpbmQ6ICdzY2FsYXInLFxuICByZXNvbHZlOiByZXNvbHZlWWFtbE1lcmdlXG59KTtcblxuLyplc2xpbnQtZGlzYWJsZSBuby1iaXR3aXNlKi9cblxuXG5cblxuXG4vLyBbIDY0LCA2NSwgNjYgXSAtPiBbIHBhZGRpbmcsIENSLCBMRiBdXG52YXIgQkFTRTY0X01BUCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVxcblxccic7XG5cblxuZnVuY3Rpb24gcmVzb2x2ZVlhbWxCaW5hcnkoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBjb2RlLCBpZHgsIGJpdGxlbiA9IDAsIG1heCA9IGRhdGEubGVuZ3RoLCBtYXAgPSBCQVNFNjRfTUFQO1xuXG4gIC8vIENvbnZlcnQgb25lIGJ5IG9uZS5cbiAgZm9yIChpZHggPSAwOyBpZHggPCBtYXg7IGlkeCsrKSB7XG4gICAgY29kZSA9IG1hcC5pbmRleE9mKGRhdGEuY2hhckF0KGlkeCkpO1xuXG4gICAgLy8gU2tpcCBDUi9MRlxuICAgIGlmIChjb2RlID4gNjQpIGNvbnRpbnVlO1xuXG4gICAgLy8gRmFpbCBvbiBpbGxlZ2FsIGNoYXJhY3RlcnNcbiAgICBpZiAoY29kZSA8IDApIHJldHVybiBmYWxzZTtcblxuICAgIGJpdGxlbiArPSA2O1xuICB9XG5cbiAgLy8gSWYgdGhlcmUgYXJlIGFueSBiaXRzIGxlZnQsIHNvdXJjZSB3YXMgY29ycnVwdGVkXG4gIHJldHVybiAoYml0bGVuICUgOCkgPT09IDA7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxCaW5hcnkoZGF0YSkge1xuICB2YXIgaWR4LCB0YWlsYml0cyxcbiAgICAgIGlucHV0ID0gZGF0YS5yZXBsYWNlKC9bXFxyXFxuPV0vZywgJycpLCAvLyByZW1vdmUgQ1IvTEYgJiBwYWRkaW5nIHRvIHNpbXBsaWZ5IHNjYW5cbiAgICAgIG1heCA9IGlucHV0Lmxlbmd0aCxcbiAgICAgIG1hcCA9IEJBU0U2NF9NQVAsXG4gICAgICBiaXRzID0gMCxcbiAgICAgIHJlc3VsdCA9IFtdO1xuXG4gIC8vIENvbGxlY3QgYnkgNio0IGJpdHMgKDMgYnl0ZXMpXG5cbiAgZm9yIChpZHggPSAwOyBpZHggPCBtYXg7IGlkeCsrKSB7XG4gICAgaWYgKChpZHggJSA0ID09PSAwKSAmJiBpZHgpIHtcbiAgICAgIHJlc3VsdC5wdXNoKChiaXRzID4+IDE2KSAmIDB4RkYpO1xuICAgICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gOCkgJiAweEZGKTtcbiAgICAgIHJlc3VsdC5wdXNoKGJpdHMgJiAweEZGKTtcbiAgICB9XG5cbiAgICBiaXRzID0gKGJpdHMgPDwgNikgfCBtYXAuaW5kZXhPZihpbnB1dC5jaGFyQXQoaWR4KSk7XG4gIH1cblxuICAvLyBEdW1wIHRhaWxcblxuICB0YWlsYml0cyA9IChtYXggJSA0KSAqIDY7XG5cbiAgaWYgKHRhaWxiaXRzID09PSAwKSB7XG4gICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gMTYpICYgMHhGRik7XG4gICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gOCkgJiAweEZGKTtcbiAgICByZXN1bHQucHVzaChiaXRzICYgMHhGRik7XG4gIH0gZWxzZSBpZiAodGFpbGJpdHMgPT09IDE4KSB7XG4gICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gMTApICYgMHhGRik7XG4gICAgcmVzdWx0LnB1c2goKGJpdHMgPj4gMikgJiAweEZGKTtcbiAgfSBlbHNlIGlmICh0YWlsYml0cyA9PT0gMTIpIHtcbiAgICByZXN1bHQucHVzaCgoYml0cyA+PiA0KSAmIDB4RkYpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHJlc3VsdCk7XG59XG5cbmZ1bmN0aW9uIHJlcHJlc2VudFlhbWxCaW5hcnkob2JqZWN0IC8qLCBzdHlsZSovKSB7XG4gIHZhciByZXN1bHQgPSAnJywgYml0cyA9IDAsIGlkeCwgdGFpbCxcbiAgICAgIG1heCA9IG9iamVjdC5sZW5ndGgsXG4gICAgICBtYXAgPSBCQVNFNjRfTUFQO1xuXG4gIC8vIENvbnZlcnQgZXZlcnkgdGhyZWUgYnl0ZXMgdG8gNCBBU0NJSSBjaGFyYWN0ZXJzLlxuXG4gIGZvciAoaWR4ID0gMDsgaWR4IDwgbWF4OyBpZHgrKykge1xuICAgIGlmICgoaWR4ICUgMyA9PT0gMCkgJiYgaWR4KSB7XG4gICAgICByZXN1bHQgKz0gbWFwWyhiaXRzID4+IDE4KSAmIDB4M0ZdO1xuICAgICAgcmVzdWx0ICs9IG1hcFsoYml0cyA+PiAxMikgJiAweDNGXTtcbiAgICAgIHJlc3VsdCArPSBtYXBbKGJpdHMgPj4gNikgJiAweDNGXTtcbiAgICAgIHJlc3VsdCArPSBtYXBbYml0cyAmIDB4M0ZdO1xuICAgIH1cblxuICAgIGJpdHMgPSAoYml0cyA8PCA4KSArIG9iamVjdFtpZHhdO1xuICB9XG5cbiAgLy8gRHVtcCB0YWlsXG5cbiAgdGFpbCA9IG1heCAlIDM7XG5cbiAgaWYgKHRhaWwgPT09IDApIHtcbiAgICByZXN1bHQgKz0gbWFwWyhiaXRzID4+IDE4KSAmIDB4M0ZdO1xuICAgIHJlc3VsdCArPSBtYXBbKGJpdHMgPj4gMTIpICYgMHgzRl07XG4gICAgcmVzdWx0ICs9IG1hcFsoYml0cyA+PiA2KSAmIDB4M0ZdO1xuICAgIHJlc3VsdCArPSBtYXBbYml0cyAmIDB4M0ZdO1xuICB9IGVsc2UgaWYgKHRhaWwgPT09IDIpIHtcbiAgICByZXN1bHQgKz0gbWFwWyhiaXRzID4+IDEwKSAmIDB4M0ZdO1xuICAgIHJlc3VsdCArPSBtYXBbKGJpdHMgPj4gNCkgJiAweDNGXTtcbiAgICByZXN1bHQgKz0gbWFwWyhiaXRzIDw8IDIpICYgMHgzRl07XG4gICAgcmVzdWx0ICs9IG1hcFs2NF07XG4gIH0gZWxzZSBpZiAodGFpbCA9PT0gMSkge1xuICAgIHJlc3VsdCArPSBtYXBbKGJpdHMgPj4gMikgJiAweDNGXTtcbiAgICByZXN1bHQgKz0gbWFwWyhiaXRzIDw8IDQpICYgMHgzRl07XG4gICAgcmVzdWx0ICs9IG1hcFs2NF07XG4gICAgcmVzdWx0ICs9IG1hcFs2NF07XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpc0JpbmFyeShvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAgJ1tvYmplY3QgVWludDhBcnJheV0nO1xufVxuXG52YXIgYmluYXJ5ID0gbmV3IHR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOmJpbmFyeScsIHtcbiAga2luZDogJ3NjYWxhcicsXG4gIHJlc29sdmU6IHJlc29sdmVZYW1sQmluYXJ5LFxuICBjb25zdHJ1Y3Q6IGNvbnN0cnVjdFlhbWxCaW5hcnksXG4gIHByZWRpY2F0ZTogaXNCaW5hcnksXG4gIHJlcHJlc2VudDogcmVwcmVzZW50WWFtbEJpbmFyeVxufSk7XG5cbnZhciBfaGFzT3duUHJvcGVydHkkMyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgX3RvU3RyaW5nJDIgICAgICAgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5mdW5jdGlvbiByZXNvbHZlWWFtbE9tYXAoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XG5cbiAgdmFyIG9iamVjdEtleXMgPSBbXSwgaW5kZXgsIGxlbmd0aCwgcGFpciwgcGFpcktleSwgcGFpckhhc0tleSxcbiAgICAgIG9iamVjdCA9IGRhdGE7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgcGFpciA9IG9iamVjdFtpbmRleF07XG4gICAgcGFpckhhc0tleSA9IGZhbHNlO1xuXG4gICAgaWYgKF90b1N0cmluZyQyLmNhbGwocGFpcikgIT09ICdbb2JqZWN0IE9iamVjdF0nKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHBhaXJLZXkgaW4gcGFpcikge1xuICAgICAgaWYgKF9oYXNPd25Qcm9wZXJ0eSQzLmNhbGwocGFpciwgcGFpcktleSkpIHtcbiAgICAgICAgaWYgKCFwYWlySGFzS2V5KSBwYWlySGFzS2V5ID0gdHJ1ZTtcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFwYWlySGFzS2V5KSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAob2JqZWN0S2V5cy5pbmRleE9mKHBhaXJLZXkpID09PSAtMSkgb2JqZWN0S2V5cy5wdXNoKHBhaXJLZXkpO1xuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxPbWFwKGRhdGEpIHtcbiAgcmV0dXJuIGRhdGEgIT09IG51bGwgPyBkYXRhIDogW107XG59XG5cbnZhciBvbWFwID0gbmV3IHR5cGUoJ3RhZzp5YW1sLm9yZywyMDAyOm9tYXAnLCB7XG4gIGtpbmQ6ICdzZXF1ZW5jZScsXG4gIHJlc29sdmU6IHJlc29sdmVZYW1sT21hcCxcbiAgY29uc3RydWN0OiBjb25zdHJ1Y3RZYW1sT21hcFxufSk7XG5cbnZhciBfdG9TdHJpbmckMSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sUGFpcnMoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XG5cbiAgdmFyIGluZGV4LCBsZW5ndGgsIHBhaXIsIGtleXMsIHJlc3VsdCxcbiAgICAgIG9iamVjdCA9IGRhdGE7XG5cbiAgcmVzdWx0ID0gbmV3IEFycmF5KG9iamVjdC5sZW5ndGgpO1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHBhaXIgPSBvYmplY3RbaW5kZXhdO1xuXG4gICAgaWYgKF90b1N0cmluZyQxLmNhbGwocGFpcikgIT09ICdbb2JqZWN0IE9iamVjdF0nKSByZXR1cm4gZmFsc2U7XG5cbiAgICBrZXlzID0gT2JqZWN0LmtleXMocGFpcik7XG5cbiAgICBpZiAoa2V5cy5sZW5ndGggIT09IDEpIHJldHVybiBmYWxzZTtcblxuICAgIHJlc3VsdFtpbmRleF0gPSBbIGtleXNbMF0sIHBhaXJba2V5c1swXV0gXTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RZYW1sUGFpcnMoZGF0YSkge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIFtdO1xuXG4gIHZhciBpbmRleCwgbGVuZ3RoLCBwYWlyLCBrZXlzLCByZXN1bHQsXG4gICAgICBvYmplY3QgPSBkYXRhO1xuXG4gIHJlc3VsdCA9IG5ldyBBcnJheShvYmplY3QubGVuZ3RoKTtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBwYWlyID0gb2JqZWN0W2luZGV4XTtcblxuICAgIGtleXMgPSBPYmplY3Qua2V5cyhwYWlyKTtcblxuICAgIHJlc3VsdFtpbmRleF0gPSBbIGtleXNbMF0sIHBhaXJba2V5c1swXV0gXTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbnZhciBwYWlycyA9IG5ldyB0eXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpwYWlycycsIHtcbiAga2luZDogJ3NlcXVlbmNlJyxcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxQYWlycyxcbiAgY29uc3RydWN0OiBjb25zdHJ1Y3RZYW1sUGFpcnNcbn0pO1xuXG52YXIgX2hhc093blByb3BlcnR5JDIgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5mdW5jdGlvbiByZXNvbHZlWWFtbFNldChkYXRhKSB7XG4gIGlmIChkYXRhID09PSBudWxsKSByZXR1cm4gdHJ1ZTtcblxuICB2YXIga2V5LCBvYmplY3QgPSBkYXRhO1xuXG4gIGZvciAoa2V5IGluIG9iamVjdCkge1xuICAgIGlmIChfaGFzT3duUHJvcGVydHkkMi5jYWxsKG9iamVjdCwga2V5KSkge1xuICAgICAgaWYgKG9iamVjdFtrZXldICE9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxTZXQoZGF0YSkge1xuICByZXR1cm4gZGF0YSAhPT0gbnVsbCA/IGRhdGEgOiB7fTtcbn1cblxudmFyIHNldCA9IG5ldyB0eXBlKCd0YWc6eWFtbC5vcmcsMjAwMjpzZXQnLCB7XG4gIGtpbmQ6ICdtYXBwaW5nJyxcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxTZXQsXG4gIGNvbnN0cnVjdDogY29uc3RydWN0WWFtbFNldFxufSk7XG5cbnZhciBfZGVmYXVsdCA9IGNvcmUuZXh0ZW5kKHtcbiAgaW1wbGljaXQ6IFtcbiAgICB0aW1lc3RhbXAsXG4gICAgbWVyZ2VcbiAgXSxcbiAgZXhwbGljaXQ6IFtcbiAgICBiaW5hcnksXG4gICAgb21hcCxcbiAgICBwYWlycyxcbiAgICBzZXRcbiAgXVxufSk7XG5cbi8qZXNsaW50LWRpc2FibGUgbWF4LWxlbixuby11c2UtYmVmb3JlLWRlZmluZSovXG5cblxuXG5cblxuXG5cbnZhciBfaGFzT3duUHJvcGVydHkkMSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cblxudmFyIENPTlRFWFRfRkxPV19JTiAgID0gMTtcbnZhciBDT05URVhUX0ZMT1dfT1VUICA9IDI7XG52YXIgQ09OVEVYVF9CTE9DS19JTiAgPSAzO1xudmFyIENPTlRFWFRfQkxPQ0tfT1VUID0gNDtcblxuXG52YXIgQ0hPTVBJTkdfQ0xJUCAgPSAxO1xudmFyIENIT01QSU5HX1NUUklQID0gMjtcbnZhciBDSE9NUElOR19LRUVQICA9IDM7XG5cblxudmFyIFBBVFRFUk5fTk9OX1BSSU5UQUJMRSAgICAgICAgID0gL1tcXHgwMC1cXHgwOFxceDBCXFx4MENcXHgwRS1cXHgxRlxceDdGLVxceDg0XFx4ODYtXFx4OUZcXHVGRkZFXFx1RkZGRl18W1xcdUQ4MDAtXFx1REJGRl0oPyFbXFx1REMwMC1cXHVERkZGXSl8KD86W15cXHVEODAwLVxcdURCRkZdfF4pW1xcdURDMDAtXFx1REZGRl0vO1xudmFyIFBBVFRFUk5fTk9OX0FTQ0lJX0xJTkVfQlJFQUtTID0gL1tcXHg4NVxcdTIwMjhcXHUyMDI5XS87XG52YXIgUEFUVEVSTl9GTE9XX0lORElDQVRPUlMgICAgICAgPSAvWyxcXFtcXF1cXHtcXH1dLztcbnZhciBQQVRURVJOX1RBR19IQU5ETEUgICAgICAgICAgICA9IC9eKD86IXwhIXwhW2EtelxcLV0rISkkL2k7XG52YXIgUEFUVEVSTl9UQUdfVVJJICAgICAgICAgICAgICAgPSAvXig/OiF8W14sXFxbXFxdXFx7XFx9XSkoPzolWzAtOWEtZl17Mn18WzAtOWEtelxcLSM7XFwvXFw/OkAmPVxcK1xcJCxfXFwuIX5cXConXFwoXFwpXFxbXFxdXSkqJC9pO1xuXG5cbmZ1bmN0aW9uIF9jbGFzcyhvYmopIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopOyB9XG5cbmZ1bmN0aW9uIGlzX0VPTChjKSB7XG4gIHJldHVybiAoYyA9PT0gMHgwQS8qIExGICovKSB8fCAoYyA9PT0gMHgwRC8qIENSICovKTtcbn1cblxuZnVuY3Rpb24gaXNfV0hJVEVfU1BBQ0UoYykge1xuICByZXR1cm4gKGMgPT09IDB4MDkvKiBUYWIgKi8pIHx8IChjID09PSAweDIwLyogU3BhY2UgKi8pO1xufVxuXG5mdW5jdGlvbiBpc19XU19PUl9FT0woYykge1xuICByZXR1cm4gKGMgPT09IDB4MDkvKiBUYWIgKi8pIHx8XG4gICAgICAgICAoYyA9PT0gMHgyMC8qIFNwYWNlICovKSB8fFxuICAgICAgICAgKGMgPT09IDB4MEEvKiBMRiAqLykgfHxcbiAgICAgICAgIChjID09PSAweDBELyogQ1IgKi8pO1xufVxuXG5mdW5jdGlvbiBpc19GTE9XX0lORElDQVRPUihjKSB7XG4gIHJldHVybiBjID09PSAweDJDLyogLCAqLyB8fFxuICAgICAgICAgYyA9PT0gMHg1Qi8qIFsgKi8gfHxcbiAgICAgICAgIGMgPT09IDB4NUQvKiBdICovIHx8XG4gICAgICAgICBjID09PSAweDdCLyogeyAqLyB8fFxuICAgICAgICAgYyA9PT0gMHg3RC8qIH0gKi87XG59XG5cbmZ1bmN0aW9uIGZyb21IZXhDb2RlKGMpIHtcbiAgdmFyIGxjO1xuXG4gIGlmICgoMHgzMC8qIDAgKi8gPD0gYykgJiYgKGMgPD0gMHgzOS8qIDkgKi8pKSB7XG4gICAgcmV0dXJuIGMgLSAweDMwO1xuICB9XG5cbiAgLyplc2xpbnQtZGlzYWJsZSBuby1iaXR3aXNlKi9cbiAgbGMgPSBjIHwgMHgyMDtcblxuICBpZiAoKDB4NjEvKiBhICovIDw9IGxjKSAmJiAobGMgPD0gMHg2Ni8qIGYgKi8pKSB7XG4gICAgcmV0dXJuIGxjIC0gMHg2MSArIDEwO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVkSGV4TGVuKGMpIHtcbiAgaWYgKGMgPT09IDB4NzgvKiB4ICovKSB7IHJldHVybiAyOyB9XG4gIGlmIChjID09PSAweDc1LyogdSAqLykgeyByZXR1cm4gNDsgfVxuICBpZiAoYyA9PT0gMHg1NS8qIFUgKi8pIHsgcmV0dXJuIDg7IH1cbiAgcmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIGZyb21EZWNpbWFsQ29kZShjKSB7XG4gIGlmICgoMHgzMC8qIDAgKi8gPD0gYykgJiYgKGMgPD0gMHgzOS8qIDkgKi8pKSB7XG4gICAgcmV0dXJuIGMgLSAweDMwO1xuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBzaW1wbGVFc2NhcGVTZXF1ZW5jZShjKSB7XG4gIC8qIGVzbGludC1kaXNhYmxlIGluZGVudCAqL1xuICByZXR1cm4gKGMgPT09IDB4MzAvKiAwICovKSA/ICdcXHgwMCcgOlxuICAgICAgICAoYyA9PT0gMHg2MS8qIGEgKi8pID8gJ1xceDA3JyA6XG4gICAgICAgIChjID09PSAweDYyLyogYiAqLykgPyAnXFx4MDgnIDpcbiAgICAgICAgKGMgPT09IDB4NzQvKiB0ICovKSA/ICdcXHgwOScgOlxuICAgICAgICAoYyA9PT0gMHgwOS8qIFRhYiAqLykgPyAnXFx4MDknIDpcbiAgICAgICAgKGMgPT09IDB4NkUvKiBuICovKSA/ICdcXHgwQScgOlxuICAgICAgICAoYyA9PT0gMHg3Ni8qIHYgKi8pID8gJ1xceDBCJyA6XG4gICAgICAgIChjID09PSAweDY2LyogZiAqLykgPyAnXFx4MEMnIDpcbiAgICAgICAgKGMgPT09IDB4NzIvKiByICovKSA/ICdcXHgwRCcgOlxuICAgICAgICAoYyA9PT0gMHg2NS8qIGUgKi8pID8gJ1xceDFCJyA6XG4gICAgICAgIChjID09PSAweDIwLyogU3BhY2UgKi8pID8gJyAnIDpcbiAgICAgICAgKGMgPT09IDB4MjIvKiBcIiAqLykgPyAnXFx4MjInIDpcbiAgICAgICAgKGMgPT09IDB4MkYvKiAvICovKSA/ICcvJyA6XG4gICAgICAgIChjID09PSAweDVDLyogXFwgKi8pID8gJ1xceDVDJyA6XG4gICAgICAgIChjID09PSAweDRFLyogTiAqLykgPyAnXFx4ODUnIDpcbiAgICAgICAgKGMgPT09IDB4NUYvKiBfICovKSA/ICdcXHhBMCcgOlxuICAgICAgICAoYyA9PT0gMHg0Qy8qIEwgKi8pID8gJ1xcdTIwMjgnIDpcbiAgICAgICAgKGMgPT09IDB4NTAvKiBQICovKSA/ICdcXHUyMDI5JyA6ICcnO1xufVxuXG5mdW5jdGlvbiBjaGFyRnJvbUNvZGVwb2ludChjKSB7XG4gIGlmIChjIDw9IDB4RkZGRikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICB9XG4gIC8vIEVuY29kZSBVVEYtMTYgc3Vycm9nYXRlIHBhaXJcbiAgLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVVRGLTE2I0NvZGVfcG9pbnRzX1UuMkIwMTAwMDBfdG9fVS4yQjEwRkZGRlxuICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAoKGMgLSAweDAxMDAwMCkgPj4gMTApICsgMHhEODAwLFxuICAgICgoYyAtIDB4MDEwMDAwKSAmIDB4MDNGRikgKyAweERDMDBcbiAgKTtcbn1cblxuLy8gc2V0IGEgcHJvcGVydHkgb2YgYSBsaXRlcmFsIG9iamVjdCwgd2hpbGUgcHJvdGVjdGluZyBhZ2FpbnN0IHByb3RvdHlwZSBwb2xsdXRpb24sXG4vLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVjYS9qcy15YW1sL2lzc3Vlcy8xNjQgZm9yIG1vcmUgZGV0YWlsc1xuZnVuY3Rpb24gc2V0UHJvcGVydHkob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gIC8vIHVzZWQgZm9yIHRoaXMgc3BlY2lmaWMga2V5IG9ubHkgYmVjYXVzZSBPYmplY3QuZGVmaW5lUHJvcGVydHkgaXMgc2xvd1xuICBpZiAoa2V5ID09PSAnX19wcm90b19fJykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmplY3QsIGtleSwge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IHZhbHVlXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgfVxufVxuXG52YXIgc2ltcGxlRXNjYXBlQ2hlY2sgPSBuZXcgQXJyYXkoMjU2KTsgLy8gaW50ZWdlciwgZm9yIGZhc3QgYWNjZXNzXG52YXIgc2ltcGxlRXNjYXBlTWFwID0gbmV3IEFycmF5KDI1Nik7XG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gIHNpbXBsZUVzY2FwZUNoZWNrW2ldID0gc2ltcGxlRXNjYXBlU2VxdWVuY2UoaSkgPyAxIDogMDtcbiAgc2ltcGxlRXNjYXBlTWFwW2ldID0gc2ltcGxlRXNjYXBlU2VxdWVuY2UoaSk7XG59XG5cblxuZnVuY3Rpb24gU3RhdGUkMShpbnB1dCwgb3B0aW9ucykge1xuICB0aGlzLmlucHV0ID0gaW5wdXQ7XG5cbiAgdGhpcy5maWxlbmFtZSAgPSBvcHRpb25zWydmaWxlbmFtZSddICB8fCBudWxsO1xuICB0aGlzLnNjaGVtYSAgICA9IG9wdGlvbnNbJ3NjaGVtYSddICAgIHx8IF9kZWZhdWx0O1xuICB0aGlzLm9uV2FybmluZyA9IG9wdGlvbnNbJ29uV2FybmluZyddIHx8IG51bGw7XG4gIC8vIChIaWRkZW4pIFJlbW92ZT8gbWFrZXMgdGhlIGxvYWRlciB0byBleHBlY3QgWUFNTCAxLjEgZG9jdW1lbnRzXG4gIC8vIGlmIHN1Y2ggZG9jdW1lbnRzIGhhdmUgbm8gZXhwbGljaXQgJVlBTUwgZGlyZWN0aXZlXG4gIHRoaXMubGVnYWN5ICAgID0gb3B0aW9uc1snbGVnYWN5J10gICAgfHwgZmFsc2U7XG5cbiAgdGhpcy5qc29uICAgICAgPSBvcHRpb25zWydqc29uJ10gICAgICB8fCBmYWxzZTtcbiAgdGhpcy5saXN0ZW5lciAgPSBvcHRpb25zWydsaXN0ZW5lciddICB8fCBudWxsO1xuXG4gIHRoaXMuaW1wbGljaXRUeXBlcyA9IHRoaXMuc2NoZW1hLmNvbXBpbGVkSW1wbGljaXQ7XG4gIHRoaXMudHlwZU1hcCAgICAgICA9IHRoaXMuc2NoZW1hLmNvbXBpbGVkVHlwZU1hcDtcblxuICB0aGlzLmxlbmd0aCAgICAgPSBpbnB1dC5sZW5ndGg7XG4gIHRoaXMucG9zaXRpb24gICA9IDA7XG4gIHRoaXMubGluZSAgICAgICA9IDA7XG4gIHRoaXMubGluZVN0YXJ0ICA9IDA7XG4gIHRoaXMubGluZUluZGVudCA9IDA7XG5cbiAgLy8gcG9zaXRpb24gb2YgZmlyc3QgbGVhZGluZyB0YWIgaW4gdGhlIGN1cnJlbnQgbGluZSxcbiAgLy8gdXNlZCB0byBtYWtlIHN1cmUgdGhlcmUgYXJlIG5vIHRhYnMgaW4gdGhlIGluZGVudGF0aW9uXG4gIHRoaXMuZmlyc3RUYWJJbkxpbmUgPSAtMTtcblxuICB0aGlzLmRvY3VtZW50cyA9IFtdO1xuXG4gIC8qXG4gIHRoaXMudmVyc2lvbjtcbiAgdGhpcy5jaGVja0xpbmVCcmVha3M7XG4gIHRoaXMudGFnTWFwO1xuICB0aGlzLmFuY2hvck1hcDtcbiAgdGhpcy50YWc7XG4gIHRoaXMuYW5jaG9yO1xuICB0aGlzLmtpbmQ7XG4gIHRoaXMucmVzdWx0OyovXG5cbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKSB7XG4gIHZhciBtYXJrID0ge1xuICAgIG5hbWU6ICAgICBzdGF0ZS5maWxlbmFtZSxcbiAgICBidWZmZXI6ICAgc3RhdGUuaW5wdXQuc2xpY2UoMCwgLTEpLCAvLyBvbWl0IHRyYWlsaW5nIFxcMFxuICAgIHBvc2l0aW9uOiBzdGF0ZS5wb3NpdGlvbixcbiAgICBsaW5lOiAgICAgc3RhdGUubGluZSxcbiAgICBjb2x1bW46ICAgc3RhdGUucG9zaXRpb24gLSBzdGF0ZS5saW5lU3RhcnRcbiAgfTtcblxuICBtYXJrLnNuaXBwZXQgPSBzbmlwcGV0KG1hcmspO1xuXG4gIHJldHVybiBuZXcgZXhjZXB0aW9uKG1lc3NhZ2UsIG1hcmspO1xufVxuXG5mdW5jdGlvbiB0aHJvd0Vycm9yKHN0YXRlLCBtZXNzYWdlKSB7XG4gIHRocm93IGdlbmVyYXRlRXJyb3Ioc3RhdGUsIG1lc3NhZ2UpO1xufVxuXG5mdW5jdGlvbiB0aHJvd1dhcm5pbmcoc3RhdGUsIG1lc3NhZ2UpIHtcbiAgaWYgKHN0YXRlLm9uV2FybmluZykge1xuICAgIHN0YXRlLm9uV2FybmluZy5jYWxsKG51bGwsIGdlbmVyYXRlRXJyb3Ioc3RhdGUsIG1lc3NhZ2UpKTtcbiAgfVxufVxuXG5cbnZhciBkaXJlY3RpdmVIYW5kbGVycyA9IHtcblxuICBZQU1MOiBmdW5jdGlvbiBoYW5kbGVZYW1sRGlyZWN0aXZlKHN0YXRlLCBuYW1lLCBhcmdzKSB7XG5cbiAgICB2YXIgbWF0Y2gsIG1ham9yLCBtaW5vcjtcblxuICAgIGlmIChzdGF0ZS52ZXJzaW9uICE9PSBudWxsKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZHVwbGljYXRpb24gb2YgJVlBTUwgZGlyZWN0aXZlJyk7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3MubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnWUFNTCBkaXJlY3RpdmUgYWNjZXB0cyBleGFjdGx5IG9uZSBhcmd1bWVudCcpO1xuICAgIH1cblxuICAgIG1hdGNoID0gL14oWzAtOV0rKVxcLihbMC05XSspJC8uZXhlYyhhcmdzWzBdKTtcblxuICAgIGlmIChtYXRjaCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2lsbC1mb3JtZWQgYXJndW1lbnQgb2YgdGhlIFlBTUwgZGlyZWN0aXZlJyk7XG4gICAgfVxuXG4gICAgbWFqb3IgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgIG1pbm9yID0gcGFyc2VJbnQobWF0Y2hbMl0sIDEwKTtcblxuICAgIGlmIChtYWpvciAhPT0gMSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuYWNjZXB0YWJsZSBZQU1MIHZlcnNpb24gb2YgdGhlIGRvY3VtZW50Jyk7XG4gICAgfVxuXG4gICAgc3RhdGUudmVyc2lvbiA9IGFyZ3NbMF07XG4gICAgc3RhdGUuY2hlY2tMaW5lQnJlYWtzID0gKG1pbm9yIDwgMik7XG5cbiAgICBpZiAobWlub3IgIT09IDEgJiYgbWlub3IgIT09IDIpIHtcbiAgICAgIHRocm93V2FybmluZyhzdGF0ZSwgJ3Vuc3VwcG9ydGVkIFlBTUwgdmVyc2lvbiBvZiB0aGUgZG9jdW1lbnQnKTtcbiAgICB9XG4gIH0sXG5cbiAgVEFHOiBmdW5jdGlvbiBoYW5kbGVUYWdEaXJlY3RpdmUoc3RhdGUsIG5hbWUsIGFyZ3MpIHtcblxuICAgIHZhciBoYW5kbGUsIHByZWZpeDtcblxuICAgIGlmIChhcmdzLmxlbmd0aCAhPT0gMikge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ1RBRyBkaXJlY3RpdmUgYWNjZXB0cyBleGFjdGx5IHR3byBhcmd1bWVudHMnKTtcbiAgICB9XG5cbiAgICBoYW5kbGUgPSBhcmdzWzBdO1xuICAgIHByZWZpeCA9IGFyZ3NbMV07XG5cbiAgICBpZiAoIVBBVFRFUk5fVEFHX0hBTkRMRS50ZXN0KGhhbmRsZSkpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdpbGwtZm9ybWVkIHRhZyBoYW5kbGUgKGZpcnN0IGFyZ3VtZW50KSBvZiB0aGUgVEFHIGRpcmVjdGl2ZScpO1xuICAgIH1cblxuICAgIGlmIChfaGFzT3duUHJvcGVydHkkMS5jYWxsKHN0YXRlLnRhZ01hcCwgaGFuZGxlKSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RoZXJlIGlzIGEgcHJldmlvdXNseSBkZWNsYXJlZCBzdWZmaXggZm9yIFwiJyArIGhhbmRsZSArICdcIiB0YWcgaGFuZGxlJyk7XG4gICAgfVxuXG4gICAgaWYgKCFQQVRURVJOX1RBR19VUkkudGVzdChwcmVmaXgpKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnaWxsLWZvcm1lZCB0YWcgcHJlZml4IChzZWNvbmQgYXJndW1lbnQpIG9mIHRoZSBUQUcgZGlyZWN0aXZlJyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHByZWZpeCA9IGRlY29kZVVSSUNvbXBvbmVudChwcmVmaXgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RhZyBwcmVmaXggaXMgbWFsZm9ybWVkOiAnICsgcHJlZml4KTtcbiAgICB9XG5cbiAgICBzdGF0ZS50YWdNYXBbaGFuZGxlXSA9IHByZWZpeDtcbiAgfVxufTtcblxuXG5mdW5jdGlvbiBjYXB0dXJlU2VnbWVudChzdGF0ZSwgc3RhcnQsIGVuZCwgY2hlY2tKc29uKSB7XG4gIHZhciBfcG9zaXRpb24sIF9sZW5ndGgsIF9jaGFyYWN0ZXIsIF9yZXN1bHQ7XG5cbiAgaWYgKHN0YXJ0IDwgZW5kKSB7XG4gICAgX3Jlc3VsdCA9IHN0YXRlLmlucHV0LnNsaWNlKHN0YXJ0LCBlbmQpO1xuXG4gICAgaWYgKGNoZWNrSnNvbikge1xuICAgICAgZm9yIChfcG9zaXRpb24gPSAwLCBfbGVuZ3RoID0gX3Jlc3VsdC5sZW5ndGg7IF9wb3NpdGlvbiA8IF9sZW5ndGg7IF9wb3NpdGlvbiArPSAxKSB7XG4gICAgICAgIF9jaGFyYWN0ZXIgPSBfcmVzdWx0LmNoYXJDb2RlQXQoX3Bvc2l0aW9uKTtcbiAgICAgICAgaWYgKCEoX2NoYXJhY3RlciA9PT0gMHgwOSB8fFxuICAgICAgICAgICAgICAoMHgyMCA8PSBfY2hhcmFjdGVyICYmIF9jaGFyYWN0ZXIgPD0gMHgxMEZGRkYpKSkge1xuICAgICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdleHBlY3RlZCB2YWxpZCBKU09OIGNoYXJhY3RlcicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChQQVRURVJOX05PTl9QUklOVEFCTEUudGVzdChfcmVzdWx0KSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RoZSBzdHJlYW0gY29udGFpbnMgbm9uLXByaW50YWJsZSBjaGFyYWN0ZXJzJyk7XG4gICAgfVxuXG4gICAgc3RhdGUucmVzdWx0ICs9IF9yZXN1bHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWVyZ2VNYXBwaW5ncyhzdGF0ZSwgZGVzdGluYXRpb24sIHNvdXJjZSwgb3ZlcnJpZGFibGVLZXlzKSB7XG4gIHZhciBzb3VyY2VLZXlzLCBrZXksIGluZGV4LCBxdWFudGl0eTtcblxuICBpZiAoIWNvbW1vbi5pc09iamVjdChzb3VyY2UpKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2Nhbm5vdCBtZXJnZSBtYXBwaW5nczsgdGhlIHByb3ZpZGVkIHNvdXJjZSBvYmplY3QgaXMgdW5hY2NlcHRhYmxlJyk7XG4gIH1cblxuICBzb3VyY2VLZXlzID0gT2JqZWN0LmtleXMoc291cmNlKTtcblxuICBmb3IgKGluZGV4ID0gMCwgcXVhbnRpdHkgPSBzb3VyY2VLZXlzLmxlbmd0aDsgaW5kZXggPCBxdWFudGl0eTsgaW5kZXggKz0gMSkge1xuICAgIGtleSA9IHNvdXJjZUtleXNbaW5kZXhdO1xuXG4gICAgaWYgKCFfaGFzT3duUHJvcGVydHkkMS5jYWxsKGRlc3RpbmF0aW9uLCBrZXkpKSB7XG4gICAgICBzZXRQcm9wZXJ0eShkZXN0aW5hdGlvbiwga2V5LCBzb3VyY2Vba2V5XSk7XG4gICAgICBvdmVycmlkYWJsZUtleXNba2V5XSA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIF9yZXN1bHQsIG92ZXJyaWRhYmxlS2V5cywga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUsXG4gIHN0YXJ0TGluZSwgc3RhcnRMaW5lU3RhcnQsIHN0YXJ0UG9zKSB7XG5cbiAgdmFyIGluZGV4LCBxdWFudGl0eTtcblxuICAvLyBUaGUgb3V0cHV0IGlzIGEgcGxhaW4gb2JqZWN0IGhlcmUsIHNvIGtleXMgY2FuIG9ubHkgYmUgc3RyaW5ncy5cbiAgLy8gV2UgbmVlZCB0byBjb252ZXJ0IGtleU5vZGUgdG8gYSBzdHJpbmcsIGJ1dCBkb2luZyBzbyBjYW4gaGFuZyB0aGUgcHJvY2Vzc1xuICAvLyAoZGVlcGx5IG5lc3RlZCBhcnJheXMgdGhhdCBleHBsb2RlIGV4cG9uZW50aWFsbHkgdXNpbmcgYWxpYXNlcykuXG4gIGlmIChBcnJheS5pc0FycmF5KGtleU5vZGUpKSB7XG4gICAga2V5Tm9kZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGtleU5vZGUpO1xuXG4gICAgZm9yIChpbmRleCA9IDAsIHF1YW50aXR5ID0ga2V5Tm9kZS5sZW5ndGg7IGluZGV4IDwgcXVhbnRpdHk7IGluZGV4ICs9IDEpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleU5vZGVbaW5kZXhdKSkge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbmVzdGVkIGFycmF5cyBhcmUgbm90IHN1cHBvcnRlZCBpbnNpZGUga2V5cycpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGtleU5vZGUgPT09ICdvYmplY3QnICYmIF9jbGFzcyhrZXlOb2RlW2luZGV4XSkgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgIGtleU5vZGVbaW5kZXhdID0gJ1tvYmplY3QgT2JqZWN0XSc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQXZvaWQgY29kZSBleGVjdXRpb24gaW4gbG9hZCgpIHZpYSB0b1N0cmluZyBwcm9wZXJ0eVxuICAvLyAoc3RpbGwgdXNlIGl0cyBvd24gdG9TdHJpbmcgZm9yIGFycmF5cywgdGltZXN0YW1wcyxcbiAgLy8gYW5kIHdoYXRldmVyIHVzZXIgc2NoZW1hIGV4dGVuc2lvbnMgaGFwcGVuIHRvIGhhdmUgQEB0b1N0cmluZ1RhZylcbiAgaWYgKHR5cGVvZiBrZXlOb2RlID09PSAnb2JqZWN0JyAmJiBfY2xhc3Moa2V5Tm9kZSkgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAga2V5Tm9kZSA9ICdbb2JqZWN0IE9iamVjdF0nO1xuICB9XG5cblxuICBrZXlOb2RlID0gU3RyaW5nKGtleU5vZGUpO1xuXG4gIGlmIChfcmVzdWx0ID09PSBudWxsKSB7XG4gICAgX3Jlc3VsdCA9IHt9O1xuICB9XG5cbiAgaWYgKGtleVRhZyA9PT0gJ3RhZzp5YW1sLm9yZywyMDAyOm1lcmdlJykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlTm9kZSkpIHtcbiAgICAgIGZvciAoaW5kZXggPSAwLCBxdWFudGl0eSA9IHZhbHVlTm9kZS5sZW5ndGg7IGluZGV4IDwgcXVhbnRpdHk7IGluZGV4ICs9IDEpIHtcbiAgICAgICAgbWVyZ2VNYXBwaW5ncyhzdGF0ZSwgX3Jlc3VsdCwgdmFsdWVOb2RlW2luZGV4XSwgb3ZlcnJpZGFibGVLZXlzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbWVyZ2VNYXBwaW5ncyhzdGF0ZSwgX3Jlc3VsdCwgdmFsdWVOb2RlLCBvdmVycmlkYWJsZUtleXMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIXN0YXRlLmpzb24gJiZcbiAgICAgICAgIV9oYXNPd25Qcm9wZXJ0eSQxLmNhbGwob3ZlcnJpZGFibGVLZXlzLCBrZXlOb2RlKSAmJlxuICAgICAgICBfaGFzT3duUHJvcGVydHkkMS5jYWxsKF9yZXN1bHQsIGtleU5vZGUpKSB7XG4gICAgICBzdGF0ZS5saW5lID0gc3RhcnRMaW5lIHx8IHN0YXRlLmxpbmU7XG4gICAgICBzdGF0ZS5saW5lU3RhcnQgPSBzdGFydExpbmVTdGFydCB8fCBzdGF0ZS5saW5lU3RhcnQ7XG4gICAgICBzdGF0ZS5wb3NpdGlvbiA9IHN0YXJ0UG9zIHx8IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2R1cGxpY2F0ZWQgbWFwcGluZyBrZXknKTtcbiAgICB9XG5cbiAgICBzZXRQcm9wZXJ0eShfcmVzdWx0LCBrZXlOb2RlLCB2YWx1ZU5vZGUpO1xuICAgIGRlbGV0ZSBvdmVycmlkYWJsZUtleXNba2V5Tm9kZV07XG4gIH1cblxuICByZXR1cm4gX3Jlc3VsdDtcbn1cblxuZnVuY3Rpb24gcmVhZExpbmVCcmVhayhzdGF0ZSkge1xuICB2YXIgY2g7XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoY2ggPT09IDB4MEEvKiBMRiAqLykge1xuICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gIH0gZWxzZSBpZiAoY2ggPT09IDB4MEQvKiBDUiAqLykge1xuICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gICAgaWYgKHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pID09PSAweDBBLyogTEYgKi8pIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICdhIGxpbmUgYnJlYWsgaXMgZXhwZWN0ZWQnKTtcbiAgfVxuXG4gIHN0YXRlLmxpbmUgKz0gMTtcbiAgc3RhdGUubGluZVN0YXJ0ID0gc3RhdGUucG9zaXRpb247XG4gIHN0YXRlLmZpcnN0VGFiSW5MaW5lID0gLTE7XG59XG5cbmZ1bmN0aW9uIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIGFsbG93Q29tbWVudHMsIGNoZWNrSW5kZW50KSB7XG4gIHZhciBsaW5lQnJlYWtzID0gMCxcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgd2hpbGUgKGNoICE9PSAwKSB7XG4gICAgd2hpbGUgKGlzX1dISVRFX1NQQUNFKGNoKSkge1xuICAgICAgaWYgKGNoID09PSAweDA5LyogVGFiICovICYmIHN0YXRlLmZpcnN0VGFiSW5MaW5lID09PSAtMSkge1xuICAgICAgICBzdGF0ZS5maXJzdFRhYkluTGluZSA9IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgfVxuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH1cblxuICAgIGlmIChhbGxvd0NvbW1lbnRzICYmIGNoID09PSAweDIzLyogIyAqLykge1xuICAgICAgZG8ge1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICB9IHdoaWxlIChjaCAhPT0gMHgwQS8qIExGICovICYmIGNoICE9PSAweDBELyogQ1IgKi8gJiYgY2ggIT09IDApO1xuICAgIH1cblxuICAgIGlmIChpc19FT0woY2gpKSB7XG4gICAgICByZWFkTGluZUJyZWFrKHN0YXRlKTtcblxuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcbiAgICAgIGxpbmVCcmVha3MrKztcbiAgICAgIHN0YXRlLmxpbmVJbmRlbnQgPSAwO1xuXG4gICAgICB3aGlsZSAoY2ggPT09IDB4MjAvKiBTcGFjZSAqLykge1xuICAgICAgICBzdGF0ZS5saW5lSW5kZW50Kys7XG4gICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNoZWNrSW5kZW50ICE9PSAtMSAmJiBsaW5lQnJlYWtzICE9PSAwICYmIHN0YXRlLmxpbmVJbmRlbnQgPCBjaGVja0luZGVudCkge1xuICAgIHRocm93V2FybmluZyhzdGF0ZSwgJ2RlZmljaWVudCBpbmRlbnRhdGlvbicpO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVCcmVha3M7XG59XG5cbmZ1bmN0aW9uIHRlc3REb2N1bWVudFNlcGFyYXRvcihzdGF0ZSkge1xuICB2YXIgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb24sXG4gICAgICBjaDtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoX3Bvc2l0aW9uKTtcblxuICAvLyBDb25kaXRpb24gc3RhdGUucG9zaXRpb24gPT09IHN0YXRlLmxpbmVTdGFydCBpcyB0ZXN0ZWRcbiAgLy8gaW4gcGFyZW50IG9uIGVhY2ggY2FsbCwgZm9yIGVmZmljaWVuY3kuIE5vIG5lZWRzIHRvIHRlc3QgaGVyZSBhZ2Fpbi5cbiAgaWYgKChjaCA9PT0gMHgyRC8qIC0gKi8gfHwgY2ggPT09IDB4MkUvKiAuICovKSAmJlxuICAgICAgY2ggPT09IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoX3Bvc2l0aW9uICsgMSkgJiZcbiAgICAgIGNoID09PSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KF9wb3NpdGlvbiArIDIpKSB7XG5cbiAgICBfcG9zaXRpb24gKz0gMztcblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChfcG9zaXRpb24pO1xuXG4gICAgaWYgKGNoID09PSAwIHx8IGlzX1dTX09SX0VPTChjaCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gd3JpdGVGb2xkZWRMaW5lcyhzdGF0ZSwgY291bnQpIHtcbiAgaWYgKGNvdW50ID09PSAxKSB7XG4gICAgc3RhdGUucmVzdWx0ICs9ICcgJztcbiAgfSBlbHNlIGlmIChjb3VudCA+IDEpIHtcbiAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnXFxuJywgY291bnQgLSAxKTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHJlYWRQbGFpblNjYWxhcihzdGF0ZSwgbm9kZUluZGVudCwgd2l0aGluRmxvd0NvbGxlY3Rpb24pIHtcbiAgdmFyIHByZWNlZGluZyxcbiAgICAgIGZvbGxvd2luZyxcbiAgICAgIGNhcHR1cmVTdGFydCxcbiAgICAgIGNhcHR1cmVFbmQsXG4gICAgICBoYXNQZW5kaW5nQ29udGVudCxcbiAgICAgIF9saW5lLFxuICAgICAgX2xpbmVTdGFydCxcbiAgICAgIF9saW5lSW5kZW50LFxuICAgICAgX2tpbmQgPSBzdGF0ZS5raW5kLFxuICAgICAgX3Jlc3VsdCA9IHN0YXRlLnJlc3VsdCxcbiAgICAgIGNoO1xuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGlzX1dTX09SX0VPTChjaCkgICAgICB8fFxuICAgICAgaXNfRkxPV19JTkRJQ0FUT1IoY2gpIHx8XG4gICAgICBjaCA9PT0gMHgyMy8qICMgKi8gICAgfHxcbiAgICAgIGNoID09PSAweDI2LyogJiAqLyAgICB8fFxuICAgICAgY2ggPT09IDB4MkEvKiAqICovICAgIHx8XG4gICAgICBjaCA9PT0gMHgyMS8qICEgKi8gICAgfHxcbiAgICAgIGNoID09PSAweDdDLyogfCAqLyAgICB8fFxuICAgICAgY2ggPT09IDB4M0UvKiA+ICovICAgIHx8XG4gICAgICBjaCA9PT0gMHgyNy8qICcgKi8gICAgfHxcbiAgICAgIGNoID09PSAweDIyLyogXCIgKi8gICAgfHxcbiAgICAgIGNoID09PSAweDI1LyogJSAqLyAgICB8fFxuICAgICAgY2ggPT09IDB4NDAvKiBAICovICAgIHx8XG4gICAgICBjaCA9PT0gMHg2MC8qIGAgKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoY2ggPT09IDB4M0YvKiA/ICovIHx8IGNoID09PSAweDJELyogLSAqLykge1xuICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgIGlmIChpc19XU19PUl9FT0woZm9sbG93aW5nKSB8fFxuICAgICAgICB3aXRoaW5GbG93Q29sbGVjdGlvbiAmJiBpc19GTE9XX0lORElDQVRPUihmb2xsb3dpbmcpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc3RhdGUua2luZCA9ICdzY2FsYXInO1xuICBzdGF0ZS5yZXN1bHQgPSAnJztcbiAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICBoYXNQZW5kaW5nQ29udGVudCA9IGZhbHNlO1xuXG4gIHdoaWxlIChjaCAhPT0gMCkge1xuICAgIGlmIChjaCA9PT0gMHgzQS8qIDogKi8pIHtcbiAgICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgICAgaWYgKGlzX1dTX09SX0VPTChmb2xsb3dpbmcpIHx8XG4gICAgICAgICAgd2l0aGluRmxvd0NvbGxlY3Rpb24gJiYgaXNfRkxPV19JTkRJQ0FUT1IoZm9sbG93aW5nKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4MjMvKiAjICovKSB7XG4gICAgICBwcmVjZWRpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uIC0gMSk7XG5cbiAgICAgIGlmIChpc19XU19PUl9FT0wocHJlY2VkaW5nKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAoKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiYgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSkgfHxcbiAgICAgICAgICAgICAgIHdpdGhpbkZsb3dDb2xsZWN0aW9uICYmIGlzX0ZMT1dfSU5ESUNBVE9SKGNoKSkge1xuICAgICAgYnJlYWs7XG5cbiAgICB9IGVsc2UgaWYgKGlzX0VPTChjaCkpIHtcbiAgICAgIF9saW5lID0gc3RhdGUubGluZTtcbiAgICAgIF9saW5lU3RhcnQgPSBzdGF0ZS5saW5lU3RhcnQ7XG4gICAgICBfbGluZUluZGVudCA9IHN0YXRlLmxpbmVJbmRlbnQ7XG4gICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBmYWxzZSwgLTEpO1xuXG4gICAgICBpZiAoc3RhdGUubGluZUluZGVudCA+PSBub2RlSW5kZW50KSB7XG4gICAgICAgIGhhc1BlbmRpbmdDb250ZW50ID0gdHJ1ZTtcbiAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5wb3NpdGlvbiA9IGNhcHR1cmVFbmQ7XG4gICAgICAgIHN0YXRlLmxpbmUgPSBfbGluZTtcbiAgICAgICAgc3RhdGUubGluZVN0YXJ0ID0gX2xpbmVTdGFydDtcbiAgICAgICAgc3RhdGUubGluZUluZGVudCA9IF9saW5lSW5kZW50O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaGFzUGVuZGluZ0NvbnRlbnQpIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIGZhbHNlKTtcbiAgICAgIHdyaXRlRm9sZGVkTGluZXMoc3RhdGUsIHN0YXRlLmxpbmUgLSBfbGluZSk7XG4gICAgICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG4gICAgICBoYXNQZW5kaW5nQ29udGVudCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaXNfV0hJVEVfU1BBQ0UoY2gpKSB7XG4gICAgICBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb24gKyAxO1xuICAgIH1cblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgfVxuXG4gIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIGZhbHNlKTtcblxuICBpZiAoc3RhdGUucmVzdWx0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBzdGF0ZS5raW5kID0gX2tpbmQ7XG4gIHN0YXRlLnJlc3VsdCA9IF9yZXN1bHQ7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcmVhZFNpbmdsZVF1b3RlZFNjYWxhcihzdGF0ZSwgbm9kZUluZGVudCkge1xuICB2YXIgY2gsXG4gICAgICBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQ7XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoY2ggIT09IDB4MjcvKiAnICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGUua2luZCA9ICdzY2FsYXInO1xuICBzdGF0ZS5yZXN1bHQgPSAnJztcbiAgc3RhdGUucG9zaXRpb24rKztcbiAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlICgoY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKSkgIT09IDApIHtcbiAgICBpZiAoY2ggPT09IDB4MjcvKiAnICovKSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBzdGF0ZS5wb3NpdGlvbiwgdHJ1ZSk7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICAgIGlmIChjaCA9PT0gMHgyNy8qICcgKi8pIHtcbiAgICAgICAgY2FwdHVyZVN0YXJ0ID0gc3RhdGUucG9zaXRpb247XG4gICAgICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gICAgICAgIGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChpc19FT0woY2gpKSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kLCB0cnVlKTtcbiAgICAgIHdyaXRlRm9sZGVkTGluZXMoc3RhdGUsIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIGZhbHNlLCBub2RlSW5kZW50KSk7XG4gICAgICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG5cbiAgICB9IGVsc2UgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiYgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZXhwZWN0ZWQgZW5kIG9mIHRoZSBkb2N1bWVudCB3aXRoaW4gYSBzaW5nbGUgcXVvdGVkIHNjYWxhcicpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gICAgICBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG4gICAgfVxuICB9XG5cbiAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZXhwZWN0ZWQgZW5kIG9mIHRoZSBzdHJlYW0gd2l0aGluIGEgc2luZ2xlIHF1b3RlZCBzY2FsYXInKTtcbn1cblxuZnVuY3Rpb24gcmVhZERvdWJsZVF1b3RlZFNjYWxhcihzdGF0ZSwgbm9kZUluZGVudCkge1xuICB2YXIgY2FwdHVyZVN0YXJ0LFxuICAgICAgY2FwdHVyZUVuZCxcbiAgICAgIGhleExlbmd0aCxcbiAgICAgIGhleFJlc3VsdCxcbiAgICAgIHRtcCxcbiAgICAgIGNoO1xuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoICE9PSAweDIyLyogXCIgKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0ZS5raW5kID0gJ3NjYWxhcic7XG4gIHN0YXRlLnJlc3VsdCA9ICcnO1xuICBzdGF0ZS5wb3NpdGlvbisrO1xuICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG5cbiAgd2hpbGUgKChjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pKSAhPT0gMCkge1xuICAgIGlmIChjaCA9PT0gMHgyMi8qIFwiICovKSB7XG4gICAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBzdGF0ZS5wb3NpdGlvbiwgdHJ1ZSk7XG4gICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICB9IGVsc2UgaWYgKGNoID09PSAweDVDLyogXFwgKi8pIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIHN0YXRlLnBvc2l0aW9uLCB0cnVlKTtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgaWYgKGlzX0VPTChjaCkpIHtcbiAgICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgZmFsc2UsIG5vZGVJbmRlbnQpO1xuXG4gICAgICAgIC8vIFRPRE86IHJld29yayB0byBpbmxpbmUgZm4gd2l0aCBubyB0eXBlIGNhc3Q/XG4gICAgICB9IGVsc2UgaWYgKGNoIDwgMjU2ICYmIHNpbXBsZUVzY2FwZUNoZWNrW2NoXSkge1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gc2ltcGxlRXNjYXBlTWFwW2NoXTtcbiAgICAgICAgc3RhdGUucG9zaXRpb24rKztcblxuICAgICAgfSBlbHNlIGlmICgodG1wID0gZXNjYXBlZEhleExlbihjaCkpID4gMCkge1xuICAgICAgICBoZXhMZW5ndGggPSB0bXA7XG4gICAgICAgIGhleFJlc3VsdCA9IDA7XG5cbiAgICAgICAgZm9yICg7IGhleExlbmd0aCA+IDA7IGhleExlbmd0aC0tKSB7XG4gICAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICAgICAgaWYgKCh0bXAgPSBmcm9tSGV4Q29kZShjaCkpID49IDApIHtcbiAgICAgICAgICAgIGhleFJlc3VsdCA9IChoZXhSZXN1bHQgPDwgNCkgKyB0bXA7XG5cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2V4cGVjdGVkIGhleGFkZWNpbWFsIGNoYXJhY3RlcicpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjaGFyRnJvbUNvZGVwb2ludChoZXhSZXN1bHQpO1xuXG4gICAgICAgIHN0YXRlLnBvc2l0aW9uKys7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmtub3duIGVzY2FwZSBzZXF1ZW5jZScpO1xuICAgICAgfVxuXG4gICAgICBjYXB0dXJlU3RhcnQgPSBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb247XG5cbiAgICB9IGVsc2UgaWYgKGlzX0VPTChjaCkpIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIHRydWUpO1xuICAgICAgd3JpdGVGb2xkZWRMaW5lcyhzdGF0ZSwgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgZmFsc2UsIG5vZGVJbmRlbnQpKTtcbiAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcblxuICAgIH0gZWxzZSBpZiAoc3RhdGUucG9zaXRpb24gPT09IHN0YXRlLmxpbmVTdGFydCAmJiB0ZXN0RG9jdW1lbnRTZXBhcmF0b3Ioc3RhdGUpKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndW5leHBlY3RlZCBlbmQgb2YgdGhlIGRvY3VtZW50IHdpdGhpbiBhIGRvdWJsZSBxdW90ZWQgc2NhbGFyJyk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUucG9zaXRpb24rKztcbiAgICAgIGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICB9XG4gIH1cblxuICB0aHJvd0Vycm9yKHN0YXRlLCAndW5leHBlY3RlZCBlbmQgb2YgdGhlIHN0cmVhbSB3aXRoaW4gYSBkb3VibGUgcXVvdGVkIHNjYWxhcicpO1xufVxuXG5mdW5jdGlvbiByZWFkRmxvd0NvbGxlY3Rpb24oc3RhdGUsIG5vZGVJbmRlbnQpIHtcbiAgdmFyIHJlYWROZXh0ID0gdHJ1ZSxcbiAgICAgIF9saW5lLFxuICAgICAgX2xpbmVTdGFydCxcbiAgICAgIF9wb3MsXG4gICAgICBfdGFnICAgICA9IHN0YXRlLnRhZyxcbiAgICAgIF9yZXN1bHQsXG4gICAgICBfYW5jaG9yICA9IHN0YXRlLmFuY2hvcixcbiAgICAgIGZvbGxvd2luZyxcbiAgICAgIHRlcm1pbmF0b3IsXG4gICAgICBpc1BhaXIsXG4gICAgICBpc0V4cGxpY2l0UGFpcixcbiAgICAgIGlzTWFwcGluZyxcbiAgICAgIG92ZXJyaWRhYmxlS2V5cyA9IE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgICBrZXlOb2RlLFxuICAgICAga2V5VGFnLFxuICAgICAgdmFsdWVOb2RlLFxuICAgICAgY2g7XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoY2ggPT09IDB4NUIvKiBbICovKSB7XG4gICAgdGVybWluYXRvciA9IDB4NUQ7LyogXSAqL1xuICAgIGlzTWFwcGluZyA9IGZhbHNlO1xuICAgIF9yZXN1bHQgPSBbXTtcbiAgfSBlbHNlIGlmIChjaCA9PT0gMHg3Qi8qIHsgKi8pIHtcbiAgICB0ZXJtaW5hdG9yID0gMHg3RDsvKiB9ICovXG4gICAgaXNNYXBwaW5nID0gdHJ1ZTtcbiAgICBfcmVzdWx0ID0ge307XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHN0YXRlLmFuY2hvciAhPT0gbnVsbCkge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gX3Jlc3VsdDtcbiAgfVxuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICB3aGlsZSAoY2ggIT09IDApIHtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCBub2RlSW5kZW50KTtcblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICBpZiAoY2ggPT09IHRlcm1pbmF0b3IpIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gICAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgICAgc3RhdGUuYW5jaG9yID0gX2FuY2hvcjtcbiAgICAgIHN0YXRlLmtpbmQgPSBpc01hcHBpbmcgPyAnbWFwcGluZycgOiAnc2VxdWVuY2UnO1xuICAgICAgc3RhdGUucmVzdWx0ID0gX3Jlc3VsdDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSBpZiAoIXJlYWROZXh0KSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbWlzc2VkIGNvbW1hIGJldHdlZW4gZmxvdyBjb2xsZWN0aW9uIGVudHJpZXMnKTtcbiAgICB9IGVsc2UgaWYgKGNoID09PSAweDJDLyogLCAqLykge1xuICAgICAgLy8gXCJmbG93IGNvbGxlY3Rpb24gZW50cmllcyBjYW4gbmV2ZXIgYmUgY29tcGxldGVseSBlbXB0eVwiLCBhcyBwZXIgWUFNTCAxLjIsIHNlY3Rpb24gNy40XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCBcImV4cGVjdGVkIHRoZSBub2RlIGNvbnRlbnQsIGJ1dCBmb3VuZCAnLCdcIik7XG4gICAgfVxuXG4gICAga2V5VGFnID0ga2V5Tm9kZSA9IHZhbHVlTm9kZSA9IG51bGw7XG4gICAgaXNQYWlyID0gaXNFeHBsaWNpdFBhaXIgPSBmYWxzZTtcblxuICAgIGlmIChjaCA9PT0gMHgzRi8qID8gKi8pIHtcbiAgICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgICAgaWYgKGlzX1dTX09SX0VPTChmb2xsb3dpbmcpKSB7XG4gICAgICAgIGlzUGFpciA9IGlzRXhwbGljaXRQYWlyID0gdHJ1ZTtcbiAgICAgICAgc3RhdGUucG9zaXRpb24rKztcbiAgICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgX2xpbmUgPSBzdGF0ZS5saW5lOyAvLyBTYXZlIHRoZSBjdXJyZW50IGxpbmUuXG4gICAgX2xpbmVTdGFydCA9IHN0YXRlLmxpbmVTdGFydDtcbiAgICBfcG9zID0gc3RhdGUucG9zaXRpb247XG4gICAgY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfRkxPV19JTiwgZmFsc2UsIHRydWUpO1xuICAgIGtleVRhZyA9IHN0YXRlLnRhZztcbiAgICBrZXlOb2RlID0gc3RhdGUucmVzdWx0O1xuICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIG5vZGVJbmRlbnQpO1xuXG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmICgoaXNFeHBsaWNpdFBhaXIgfHwgc3RhdGUubGluZSA9PT0gX2xpbmUpICYmIGNoID09PSAweDNBLyogOiAqLykge1xuICAgICAgaXNQYWlyID0gdHJ1ZTtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIG5vZGVJbmRlbnQpO1xuICAgICAgY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfRkxPV19JTiwgZmFsc2UsIHRydWUpO1xuICAgICAgdmFsdWVOb2RlID0gc3RhdGUucmVzdWx0O1xuICAgIH1cblxuICAgIGlmIChpc01hcHBpbmcpIHtcbiAgICAgIHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIF9yZXN1bHQsIG92ZXJyaWRhYmxlS2V5cywga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUsIF9saW5lLCBfbGluZVN0YXJ0LCBfcG9zKTtcbiAgICB9IGVsc2UgaWYgKGlzUGFpcikge1xuICAgICAgX3Jlc3VsdC5wdXNoKHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIG51bGwsIG92ZXJyaWRhYmxlS2V5cywga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUsIF9saW5lLCBfbGluZVN0YXJ0LCBfcG9zKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9yZXN1bHQucHVzaChrZXlOb2RlKTtcbiAgICB9XG5cbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCBub2RlSW5kZW50KTtcblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICBpZiAoY2ggPT09IDB4MkMvKiAsICovKSB7XG4gICAgICByZWFkTmV4dCA9IHRydWU7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlYWROZXh0ID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZXhwZWN0ZWQgZW5kIG9mIHRoZSBzdHJlYW0gd2l0aGluIGEgZmxvdyBjb2xsZWN0aW9uJyk7XG59XG5cbmZ1bmN0aW9uIHJlYWRCbG9ja1NjYWxhcihzdGF0ZSwgbm9kZUluZGVudCkge1xuICB2YXIgY2FwdHVyZVN0YXJ0LFxuICAgICAgZm9sZGluZyxcbiAgICAgIGNob21waW5nICAgICAgID0gQ0hPTVBJTkdfQ0xJUCxcbiAgICAgIGRpZFJlYWRDb250ZW50ID0gZmFsc2UsXG4gICAgICBkZXRlY3RlZEluZGVudCA9IGZhbHNlLFxuICAgICAgdGV4dEluZGVudCAgICAgPSBub2RlSW5kZW50LFxuICAgICAgZW1wdHlMaW5lcyAgICAgPSAwLFxuICAgICAgYXRNb3JlSW5kZW50ZWQgPSBmYWxzZSxcbiAgICAgIHRtcCxcbiAgICAgIGNoO1xuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoID09PSAweDdDLyogfCAqLykge1xuICAgIGZvbGRpbmcgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChjaCA9PT0gMHgzRS8qID4gKi8pIHtcbiAgICBmb2xkaW5nID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0ZS5raW5kID0gJ3NjYWxhcic7XG4gIHN0YXRlLnJlc3VsdCA9ICcnO1xuXG4gIHdoaWxlIChjaCAhPT0gMCkge1xuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmIChjaCA9PT0gMHgyQi8qICsgKi8gfHwgY2ggPT09IDB4MkQvKiAtICovKSB7XG4gICAgICBpZiAoQ0hPTVBJTkdfQ0xJUCA9PT0gY2hvbXBpbmcpIHtcbiAgICAgICAgY2hvbXBpbmcgPSAoY2ggPT09IDB4MkIvKiArICovKSA/IENIT01QSU5HX0tFRVAgOiBDSE9NUElOR19TVFJJUDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93RXJyb3Ioc3RhdGUsICdyZXBlYXQgb2YgYSBjaG9tcGluZyBtb2RlIGlkZW50aWZpZXInKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAoKHRtcCA9IGZyb21EZWNpbWFsQ29kZShjaCkpID49IDApIHtcbiAgICAgIGlmICh0bXAgPT09IDApIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2JhZCBleHBsaWNpdCBpbmRlbnRhdGlvbiB3aWR0aCBvZiBhIGJsb2NrIHNjYWxhcjsgaXQgY2Fubm90IGJlIGxlc3MgdGhhbiBvbmUnKTtcbiAgICAgIH0gZWxzZSBpZiAoIWRldGVjdGVkSW5kZW50KSB7XG4gICAgICAgIHRleHRJbmRlbnQgPSBub2RlSW5kZW50ICsgdG1wIC0gMTtcbiAgICAgICAgZGV0ZWN0ZWRJbmRlbnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3JlcGVhdCBvZiBhbiBpbmRlbnRhdGlvbiB3aWR0aCBpZGVudGlmaWVyJyk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKGlzX1dISVRFX1NQQUNFKGNoKSkge1xuICAgIGRvIHsgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pOyB9XG4gICAgd2hpbGUgKGlzX1dISVRFX1NQQUNFKGNoKSk7XG5cbiAgICBpZiAoY2ggPT09IDB4MjMvKiAjICovKSB7XG4gICAgICBkbyB7IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTsgfVxuICAgICAgd2hpbGUgKCFpc19FT0woY2gpICYmIChjaCAhPT0gMCkpO1xuICAgIH1cbiAgfVxuXG4gIHdoaWxlIChjaCAhPT0gMCkge1xuICAgIHJlYWRMaW5lQnJlYWsoc3RhdGUpO1xuICAgIHN0YXRlLmxpbmVJbmRlbnQgPSAwO1xuXG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICAgIHdoaWxlICgoIWRldGVjdGVkSW5kZW50IHx8IHN0YXRlLmxpbmVJbmRlbnQgPCB0ZXh0SW5kZW50KSAmJlxuICAgICAgICAgICAoY2ggPT09IDB4MjAvKiBTcGFjZSAqLykpIHtcbiAgICAgIHN0YXRlLmxpbmVJbmRlbnQrKztcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAoIWRldGVjdGVkSW5kZW50ICYmIHN0YXRlLmxpbmVJbmRlbnQgPiB0ZXh0SW5kZW50KSB7XG4gICAgICB0ZXh0SW5kZW50ID0gc3RhdGUubGluZUluZGVudDtcbiAgICB9XG5cbiAgICBpZiAoaXNfRU9MKGNoKSkge1xuICAgICAgZW1wdHlMaW5lcysrO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gRW5kIG9mIHRoZSBzY2FsYXIuXG4gICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPCB0ZXh0SW5kZW50KSB7XG5cbiAgICAgIC8vIFBlcmZvcm0gdGhlIGNob21waW5nLlxuICAgICAgaWYgKGNob21waW5nID09PSBDSE9NUElOR19LRUVQKSB7XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBkaWRSZWFkQ29udGVudCA/IDEgKyBlbXB0eUxpbmVzIDogZW1wdHlMaW5lcyk7XG4gICAgICB9IGVsc2UgaWYgKGNob21waW5nID09PSBDSE9NUElOR19DTElQKSB7XG4gICAgICAgIGlmIChkaWRSZWFkQ29udGVudCkgeyAvLyBpLmUuIG9ubHkgaWYgdGhlIHNjYWxhciBpcyBub3QgZW1wdHkuXG4gICAgICAgICAgc3RhdGUucmVzdWx0ICs9ICdcXG4nO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEJyZWFrIHRoaXMgYHdoaWxlYCBjeWNsZSBhbmQgZ28gdG8gdGhlIGZ1bmNpdG9uJ3MgZXBpbG9ndWUuXG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBGb2xkZWQgc3R5bGU6IHVzZSBmYW5jeSBydWxlcyB0byBoYW5kbGUgbGluZSBicmVha3MuXG4gICAgaWYgKGZvbGRpbmcpIHtcblxuICAgICAgLy8gTGluZXMgc3RhcnRpbmcgd2l0aCB3aGl0ZSBzcGFjZSBjaGFyYWN0ZXJzIChtb3JlLWluZGVudGVkIGxpbmVzKSBhcmUgbm90IGZvbGRlZC5cbiAgICAgIGlmIChpc19XSElURV9TUEFDRShjaCkpIHtcbiAgICAgICAgYXRNb3JlSW5kZW50ZWQgPSB0cnVlO1xuICAgICAgICAvLyBleGNlcHQgZm9yIHRoZSBmaXJzdCBjb250ZW50IGxpbmUgKGNmLiBFeGFtcGxlIDguMSlcbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJ1xcbicsIGRpZFJlYWRDb250ZW50ID8gMSArIGVtcHR5TGluZXMgOiBlbXB0eUxpbmVzKTtcblxuICAgICAgLy8gRW5kIG9mIG1vcmUtaW5kZW50ZWQgYmxvY2suXG4gICAgICB9IGVsc2UgaWYgKGF0TW9yZUluZGVudGVkKSB7XG4gICAgICAgIGF0TW9yZUluZGVudGVkID0gZmFsc2U7XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KCdcXG4nLCBlbXB0eUxpbmVzICsgMSk7XG5cbiAgICAgIC8vIEp1c3Qgb25lIGxpbmUgYnJlYWsgLSBwZXJjZWl2ZSBhcyB0aGUgc2FtZSBsaW5lLlxuICAgICAgfSBlbHNlIGlmIChlbXB0eUxpbmVzID09PSAwKSB7XG4gICAgICAgIGlmIChkaWRSZWFkQ29udGVudCkgeyAvLyBpLmUuIG9ubHkgaWYgd2UgaGF2ZSBhbHJlYWR5IHJlYWQgc29tZSBzY2FsYXIgY29udGVudC5cbiAgICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gJyAnO1xuICAgICAgICB9XG5cbiAgICAgIC8vIFNldmVyYWwgbGluZSBicmVha3MgLSBwZXJjZWl2ZSBhcyBkaWZmZXJlbnQgbGluZXMuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdCgnXFxuJywgZW1wdHlMaW5lcyk7XG4gICAgICB9XG5cbiAgICAvLyBMaXRlcmFsIHN0eWxlOiBqdXN0IGFkZCBleGFjdCBudW1iZXIgb2YgbGluZSBicmVha3MgYmV0d2VlbiBjb250ZW50IGxpbmVzLlxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBLZWVwIGFsbCBsaW5lIGJyZWFrcyBleGNlcHQgdGhlIGhlYWRlciBsaW5lIGJyZWFrLlxuICAgICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoJ1xcbicsIGRpZFJlYWRDb250ZW50ID8gMSArIGVtcHR5TGluZXMgOiBlbXB0eUxpbmVzKTtcbiAgICB9XG5cbiAgICBkaWRSZWFkQ29udGVudCA9IHRydWU7XG4gICAgZGV0ZWN0ZWRJbmRlbnQgPSB0cnVlO1xuICAgIGVtcHR5TGluZXMgPSAwO1xuICAgIGNhcHR1cmVTdGFydCA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gICAgd2hpbGUgKCFpc19FT0woY2gpICYmIChjaCAhPT0gMCkpIHtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBjYXB0dXJlU2VnbWVudChzdGF0ZSwgY2FwdHVyZVN0YXJ0LCBzdGF0ZS5wb3NpdGlvbiwgZmFsc2UpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlYWRCbG9ja1NlcXVlbmNlKHN0YXRlLCBub2RlSW5kZW50KSB7XG4gIHZhciBfbGluZSxcbiAgICAgIF90YWcgICAgICA9IHN0YXRlLnRhZyxcbiAgICAgIF9hbmNob3IgICA9IHN0YXRlLmFuY2hvcixcbiAgICAgIF9yZXN1bHQgICA9IFtdLFxuICAgICAgZm9sbG93aW5nLFxuICAgICAgZGV0ZWN0ZWQgID0gZmFsc2UsXG4gICAgICBjaDtcblxuICAvLyB0aGVyZSBpcyBhIGxlYWRpbmcgdGFiIGJlZm9yZSB0aGlzIHRva2VuLCBzbyBpdCBjYW4ndCBiZSBhIGJsb2NrIHNlcXVlbmNlL21hcHBpbmc7XG4gIC8vIGl0IGNhbiBzdGlsbCBiZSBmbG93IHNlcXVlbmNlL21hcHBpbmcgb3IgYSBzY2FsYXJcbiAgaWYgKHN0YXRlLmZpcnN0VGFiSW5MaW5lICE9PSAtMSkgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChzdGF0ZS5hbmNob3IgIT09IG51bGwpIHtcbiAgICBzdGF0ZS5hbmNob3JNYXBbc3RhdGUuYW5jaG9yXSA9IF9yZXN1bHQ7XG4gIH1cblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIHdoaWxlIChjaCAhPT0gMCkge1xuICAgIGlmIChzdGF0ZS5maXJzdFRhYkluTGluZSAhPT0gLTEpIHtcbiAgICAgIHN0YXRlLnBvc2l0aW9uID0gc3RhdGUuZmlyc3RUYWJJbkxpbmU7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAndGFiIGNoYXJhY3RlcnMgbXVzdCBub3QgYmUgdXNlZCBpbiBpbmRlbnRhdGlvbicpO1xuICAgIH1cblxuICAgIGlmIChjaCAhPT0gMHgyRC8qIC0gKi8pIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgIGlmICghaXNfV1NfT1JfRU9MKGZvbGxvd2luZykpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGRldGVjdGVkID0gdHJ1ZTtcbiAgICBzdGF0ZS5wb3NpdGlvbisrO1xuXG4gICAgaWYgKHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKSkge1xuICAgICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPD0gbm9kZUluZGVudCkge1xuICAgICAgICBfcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIF9saW5lID0gc3RhdGUubGluZTtcbiAgICBjb21wb3NlTm9kZShzdGF0ZSwgbm9kZUluZGVudCwgQ09OVEVYVF9CTE9DS19JTiwgZmFsc2UsIHRydWUpO1xuICAgIF9yZXN1bHQucHVzaChzdGF0ZS5yZXN1bHQpO1xuICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICBpZiAoKHN0YXRlLmxpbmUgPT09IF9saW5lIHx8IHN0YXRlLmxpbmVJbmRlbnQgPiBub2RlSW5kZW50KSAmJiAoY2ggIT09IDApKSB7XG4gICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnYmFkIGluZGVudGF0aW9uIG9mIGEgc2VxdWVuY2UgZW50cnknKTtcbiAgICB9IGVsc2UgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPCBub2RlSW5kZW50KSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoZGV0ZWN0ZWQpIHtcbiAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgIHN0YXRlLmFuY2hvciA9IF9hbmNob3I7XG4gICAgc3RhdGUua2luZCA9ICdzZXF1ZW5jZSc7XG4gICAgc3RhdGUucmVzdWx0ID0gX3Jlc3VsdDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlYWRCbG9ja01hcHBpbmcoc3RhdGUsIG5vZGVJbmRlbnQsIGZsb3dJbmRlbnQpIHtcbiAgdmFyIGZvbGxvd2luZyxcbiAgICAgIGFsbG93Q29tcGFjdCxcbiAgICAgIF9saW5lLFxuICAgICAgX2tleUxpbmUsXG4gICAgICBfa2V5TGluZVN0YXJ0LFxuICAgICAgX2tleVBvcyxcbiAgICAgIF90YWcgICAgICAgICAgPSBzdGF0ZS50YWcsXG4gICAgICBfYW5jaG9yICAgICAgID0gc3RhdGUuYW5jaG9yLFxuICAgICAgX3Jlc3VsdCAgICAgICA9IHt9LFxuICAgICAgb3ZlcnJpZGFibGVLZXlzID0gT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICAgIGtleVRhZyAgICAgICAgPSBudWxsLFxuICAgICAga2V5Tm9kZSAgICAgICA9IG51bGwsXG4gICAgICB2YWx1ZU5vZGUgICAgID0gbnVsbCxcbiAgICAgIGF0RXhwbGljaXRLZXkgPSBmYWxzZSxcbiAgICAgIGRldGVjdGVkICAgICAgPSBmYWxzZSxcbiAgICAgIGNoO1xuXG4gIC8vIHRoZXJlIGlzIGEgbGVhZGluZyB0YWIgYmVmb3JlIHRoaXMgdG9rZW4sIHNvIGl0IGNhbid0IGJlIGEgYmxvY2sgc2VxdWVuY2UvbWFwcGluZztcbiAgLy8gaXQgY2FuIHN0aWxsIGJlIGZsb3cgc2VxdWVuY2UvbWFwcGluZyBvciBhIHNjYWxhclxuICBpZiAoc3RhdGUuZmlyc3RUYWJJbkxpbmUgIT09IC0xKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHN0YXRlLmFuY2hvciAhPT0gbnVsbCkge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gX3Jlc3VsdDtcbiAgfVxuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgd2hpbGUgKGNoICE9PSAwKSB7XG4gICAgaWYgKCFhdEV4cGxpY2l0S2V5ICYmIHN0YXRlLmZpcnN0VGFiSW5MaW5lICE9PSAtMSkge1xuICAgICAgc3RhdGUucG9zaXRpb24gPSBzdGF0ZS5maXJzdFRhYkluTGluZTtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd0YWIgY2hhcmFjdGVycyBtdXN0IG5vdCBiZSB1c2VkIGluIGluZGVudGF0aW9uJyk7XG4gICAgfVxuXG4gICAgZm9sbG93aW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpO1xuICAgIF9saW5lID0gc3RhdGUubGluZTsgLy8gU2F2ZSB0aGUgY3VycmVudCBsaW5lLlxuXG4gICAgLy9cbiAgICAvLyBFeHBsaWNpdCBub3RhdGlvbiBjYXNlLiBUaGVyZSBhcmUgdHdvIHNlcGFyYXRlIGJsb2NrczpcbiAgICAvLyBmaXJzdCBmb3IgdGhlIGtleSAoZGVub3RlZCBieSBcIj9cIikgYW5kIHNlY29uZCBmb3IgdGhlIHZhbHVlIChkZW5vdGVkIGJ5IFwiOlwiKVxuICAgIC8vXG4gICAgaWYgKChjaCA9PT0gMHgzRi8qID8gKi8gfHwgY2ggPT09IDB4M0EvKiA6ICovKSAmJiBpc19XU19PUl9FT0woZm9sbG93aW5nKSkge1xuXG4gICAgICBpZiAoY2ggPT09IDB4M0YvKiA/ICovKSB7XG4gICAgICAgIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgICAgc3RvcmVNYXBwaW5nUGFpcihzdGF0ZSwgX3Jlc3VsdCwgb3ZlcnJpZGFibGVLZXlzLCBrZXlUYWcsIGtleU5vZGUsIG51bGwsIF9rZXlMaW5lLCBfa2V5TGluZVN0YXJ0LCBfa2V5UG9zKTtcbiAgICAgICAgICBrZXlUYWcgPSBrZXlOb2RlID0gdmFsdWVOb2RlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGRldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgYXRFeHBsaWNpdEtleSA9IHRydWU7XG4gICAgICAgIGFsbG93Q29tcGFjdCA9IHRydWU7XG5cbiAgICAgIH0gZWxzZSBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgICAgICAvLyBpLmUuIDB4M0EvKiA6ICovID09PSBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIGV4cGxpY2l0IGtleS5cbiAgICAgICAgYXRFeHBsaWNpdEtleSA9IGZhbHNlO1xuICAgICAgICBhbGxvd0NvbXBhY3QgPSB0cnVlO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnaW5jb21wbGV0ZSBleHBsaWNpdCBtYXBwaW5nIHBhaXI7IGEga2V5IG5vZGUgaXMgbWlzc2VkOyBvciBmb2xsb3dlZCBieSBhIG5vbi10YWJ1bGF0ZWQgZW1wdHkgbGluZScpO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS5wb3NpdGlvbiArPSAxO1xuICAgICAgY2ggPSBmb2xsb3dpbmc7XG5cbiAgICAvL1xuICAgIC8vIEltcGxpY2l0IG5vdGF0aW9uIGNhc2UuIEZsb3ctc3R5bGUgbm9kZSBhcyB0aGUga2V5IGZpcnN0LCB0aGVuIFwiOlwiLCBhbmQgdGhlIHZhbHVlLlxuICAgIC8vXG4gICAgfSBlbHNlIHtcbiAgICAgIF9rZXlMaW5lID0gc3RhdGUubGluZTtcbiAgICAgIF9rZXlMaW5lU3RhcnQgPSBzdGF0ZS5saW5lU3RhcnQ7XG4gICAgICBfa2V5UG9zID0gc3RhdGUucG9zaXRpb247XG5cbiAgICAgIGlmICghY29tcG9zZU5vZGUoc3RhdGUsIGZsb3dJbmRlbnQsIENPTlRFWFRfRkxPV19PVVQsIGZhbHNlLCB0cnVlKSkge1xuICAgICAgICAvLyBOZWl0aGVyIGltcGxpY2l0IG5vciBleHBsaWNpdCBub3RhdGlvbi5cbiAgICAgICAgLy8gUmVhZGluZyBpcyBkb25lLiBHbyB0byB0aGUgZXBpbG9ndWUuXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3RhdGUubGluZSA9PT0gX2xpbmUpIHtcbiAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgICB3aGlsZSAoaXNfV0hJVEVfU1BBQ0UoY2gpKSB7XG4gICAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoID09PSAweDNBLyogOiAqLykge1xuICAgICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgICAgIGlmICghaXNfV1NfT1JfRU9MKGNoKSkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2Egd2hpdGVzcGFjZSBjaGFyYWN0ZXIgaXMgZXhwZWN0ZWQgYWZ0ZXIgdGhlIGtleS12YWx1ZSBzZXBhcmF0b3Igd2l0aGluIGEgYmxvY2sgbWFwcGluZycpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgICAgICBzdG9yZU1hcHBpbmdQYWlyKHN0YXRlLCBfcmVzdWx0LCBvdmVycmlkYWJsZUtleXMsIGtleVRhZywga2V5Tm9kZSwgbnVsbCwgX2tleUxpbmUsIF9rZXlMaW5lU3RhcnQsIF9rZXlQb3MpO1xuICAgICAgICAgICAga2V5VGFnID0ga2V5Tm9kZSA9IHZhbHVlTm9kZSA9IG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgIGF0RXhwbGljaXRLZXkgPSBmYWxzZTtcbiAgICAgICAgICBhbGxvd0NvbXBhY3QgPSBmYWxzZTtcbiAgICAgICAgICBrZXlUYWcgPSBzdGF0ZS50YWc7XG4gICAgICAgICAga2V5Tm9kZSA9IHN0YXRlLnJlc3VsdDtcblxuICAgICAgICB9IGVsc2UgaWYgKGRldGVjdGVkKSB7XG4gICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2NhbiBub3QgcmVhZCBhbiBpbXBsaWNpdCBtYXBwaW5nIHBhaXI7IGEgY29sb24gaXMgbWlzc2VkJyk7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgICAgICAgIHN0YXRlLmFuY2hvciA9IF9hbmNob3I7XG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIEtlZXAgdGhlIHJlc3VsdCBvZiBgY29tcG9zZU5vZGVgLlxuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSBpZiAoZGV0ZWN0ZWQpIHtcbiAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2NhbiBub3QgcmVhZCBhIGJsb2NrIG1hcHBpbmcgZW50cnk7IGEgbXVsdGlsaW5lIGtleSBtYXkgbm90IGJlIGFuIGltcGxpY2l0IGtleScpO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgICAgICBzdGF0ZS5hbmNob3IgPSBfYW5jaG9yO1xuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gS2VlcCB0aGUgcmVzdWx0IG9mIGBjb21wb3NlTm9kZWAuXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBDb21tb24gcmVhZGluZyBjb2RlIGZvciBib3RoIGV4cGxpY2l0IGFuZCBpbXBsaWNpdCBub3RhdGlvbnMuXG4gICAgLy9cbiAgICBpZiAoc3RhdGUubGluZSA9PT0gX2xpbmUgfHwgc3RhdGUubGluZUluZGVudCA+IG5vZGVJbmRlbnQpIHtcbiAgICAgIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgIF9rZXlMaW5lID0gc3RhdGUubGluZTtcbiAgICAgICAgX2tleUxpbmVTdGFydCA9IHN0YXRlLmxpbmVTdGFydDtcbiAgICAgICAgX2tleVBvcyA9IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfQkxPQ0tfT1VULCB0cnVlLCBhbGxvd0NvbXBhY3QpKSB7XG4gICAgICAgIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgICAga2V5Tm9kZSA9IHN0YXRlLnJlc3VsdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgIHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIF9yZXN1bHQsIG92ZXJyaWRhYmxlS2V5cywga2V5VGFnLCBrZXlOb2RlLCB2YWx1ZU5vZGUsIF9rZXlMaW5lLCBfa2V5TGluZVN0YXJ0LCBfa2V5UG9zKTtcbiAgICAgICAga2V5VGFnID0ga2V5Tm9kZSA9IHZhbHVlTm9kZSA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKChzdGF0ZS5saW5lID09PSBfbGluZSB8fCBzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCkgJiYgKGNoICE9PSAwKSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2JhZCBpbmRlbnRhdGlvbiBvZiBhIG1hcHBpbmcgZW50cnknKTtcbiAgICB9IGVsc2UgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPCBub2RlSW5kZW50KSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvL1xuICAvLyBFcGlsb2d1ZS5cbiAgLy9cblxuICAvLyBTcGVjaWFsIGNhc2U6IGxhc3QgbWFwcGluZydzIG5vZGUgY29udGFpbnMgb25seSB0aGUga2V5IGluIGV4cGxpY2l0IG5vdGF0aW9uLlxuICBpZiAoYXRFeHBsaWNpdEtleSkge1xuICAgIHN0b3JlTWFwcGluZ1BhaXIoc3RhdGUsIF9yZXN1bHQsIG92ZXJyaWRhYmxlS2V5cywga2V5VGFnLCBrZXlOb2RlLCBudWxsLCBfa2V5TGluZSwgX2tleUxpbmVTdGFydCwgX2tleVBvcyk7XG4gIH1cblxuICAvLyBFeHBvc2UgdGhlIHJlc3VsdGluZyBtYXBwaW5nLlxuICBpZiAoZGV0ZWN0ZWQpIHtcbiAgICBzdGF0ZS50YWcgPSBfdGFnO1xuICAgIHN0YXRlLmFuY2hvciA9IF9hbmNob3I7XG4gICAgc3RhdGUua2luZCA9ICdtYXBwaW5nJztcbiAgICBzdGF0ZS5yZXN1bHQgPSBfcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIGRldGVjdGVkO1xufVxuXG5mdW5jdGlvbiByZWFkVGFnUHJvcGVydHkoc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbixcbiAgICAgIGlzVmVyYmF0aW0gPSBmYWxzZSxcbiAgICAgIGlzTmFtZWQgICAgPSBmYWxzZSxcbiAgICAgIHRhZ0hhbmRsZSxcbiAgICAgIHRhZ05hbWUsXG4gICAgICBjaDtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmIChjaCAhPT0gMHgyMS8qICEgKi8pIHJldHVybiBmYWxzZTtcblxuICBpZiAoc3RhdGUudGFnICE9PSBudWxsKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2R1cGxpY2F0aW9uIG9mIGEgdGFnIHByb3BlcnR5Jyk7XG4gIH1cblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoID09PSAweDNDLyogPCAqLykge1xuICAgIGlzVmVyYmF0aW0gPSB0cnVlO1xuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICB9IGVsc2UgaWYgKGNoID09PSAweDIxLyogISAqLykge1xuICAgIGlzTmFtZWQgPSB0cnVlO1xuICAgIHRhZ0hhbmRsZSA9ICchISc7XG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gIH0gZWxzZSB7XG4gICAgdGFnSGFuZGxlID0gJyEnO1xuICB9XG5cbiAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgaWYgKGlzVmVyYmF0aW0pIHtcbiAgICBkbyB7IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTsgfVxuICAgIHdoaWxlIChjaCAhPT0gMCAmJiBjaCAhPT0gMHgzRS8qID4gKi8pO1xuXG4gICAgaWYgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoKSB7XG4gICAgICB0YWdOYW1lID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmV4cGVjdGVkIGVuZCBvZiB0aGUgc3RyZWFtIHdpdGhpbiBhIHZlcmJhdGltIHRhZycpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB3aGlsZSAoY2ggIT09IDAgJiYgIWlzX1dTX09SX0VPTChjaCkpIHtcblxuICAgICAgaWYgKGNoID09PSAweDIxLyogISAqLykge1xuICAgICAgICBpZiAoIWlzTmFtZWQpIHtcbiAgICAgICAgICB0YWdIYW5kbGUgPSBzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24gLSAxLCBzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgICAgICAgaWYgKCFQQVRURVJOX1RBR19IQU5ETEUudGVzdCh0YWdIYW5kbGUpKSB7XG4gICAgICAgICAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbmFtZWQgdGFnIGhhbmRsZSBjYW5ub3QgY29udGFpbiBzdWNoIGNoYXJhY3RlcnMnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpc05hbWVkID0gdHJ1ZTtcbiAgICAgICAgICBfcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbiArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3RhZyBzdWZmaXggY2Fubm90IGNvbnRhaW4gZXhjbGFtYXRpb24gbWFya3MnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgdGFnTmFtZSA9IHN0YXRlLmlucHV0LnNsaWNlKF9wb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pO1xuXG4gICAgaWYgKFBBVFRFUk5fRkxPV19JTkRJQ0FUT1JTLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd0YWcgc3VmZml4IGNhbm5vdCBjb250YWluIGZsb3cgaW5kaWNhdG9yIGNoYXJhY3RlcnMnKTtcbiAgICB9XG4gIH1cblxuICBpZiAodGFnTmFtZSAmJiAhUEFUVEVSTl9UQUdfVVJJLnRlc3QodGFnTmFtZSkpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAndGFnIG5hbWUgY2Fubm90IGNvbnRhaW4gc3VjaCBjaGFyYWN0ZXJzOiAnICsgdGFnTmFtZSk7XG4gIH1cblxuICB0cnkge1xuICAgIHRhZ05hbWUgPSBkZWNvZGVVUklDb21wb25lbnQodGFnTmFtZSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICd0YWcgbmFtZSBpcyBtYWxmb3JtZWQ6ICcgKyB0YWdOYW1lKTtcbiAgfVxuXG4gIGlmIChpc1ZlcmJhdGltKSB7XG4gICAgc3RhdGUudGFnID0gdGFnTmFtZTtcblxuICB9IGVsc2UgaWYgKF9oYXNPd25Qcm9wZXJ0eSQxLmNhbGwoc3RhdGUudGFnTWFwLCB0YWdIYW5kbGUpKSB7XG4gICAgc3RhdGUudGFnID0gc3RhdGUudGFnTWFwW3RhZ0hhbmRsZV0gKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSBpZiAodGFnSGFuZGxlID09PSAnIScpIHtcbiAgICBzdGF0ZS50YWcgPSAnIScgKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSBpZiAodGFnSGFuZGxlID09PSAnISEnKSB7XG4gICAgc3RhdGUudGFnID0gJ3RhZzp5YW1sLm9yZywyMDAyOicgKyB0YWdOYW1lO1xuXG4gIH0gZWxzZSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuZGVjbGFyZWQgdGFnIGhhbmRsZSBcIicgKyB0YWdIYW5kbGUgKyAnXCInKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZWFkQW5jaG9yUHJvcGVydHkoc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbixcbiAgICAgIGNoO1xuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoICE9PSAweDI2LyogJiAqLykgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChzdGF0ZS5hbmNob3IgIT09IG51bGwpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZHVwbGljYXRpb24gb2YgYW4gYW5jaG9yIHByb3BlcnR5Jyk7XG4gIH1cblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChjaCAhPT0gMCAmJiAhaXNfV1NfT1JfRU9MKGNoKSAmJiAhaXNfRkxPV19JTkRJQ0FUT1IoY2gpKSB7XG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBfcG9zaXRpb24pIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbmFtZSBvZiBhbiBhbmNob3Igbm9kZSBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIGNoYXJhY3RlcicpO1xuICB9XG5cbiAgc3RhdGUuYW5jaG9yID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZWFkQWxpYXMoc3RhdGUpIHtcbiAgdmFyIF9wb3NpdGlvbiwgYWxpYXMsXG4gICAgICBjaDtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmIChjaCAhPT0gMHgyQS8qICogKi8pIHJldHVybiBmYWxzZTtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChjaCAhPT0gMCAmJiAhaXNfV1NfT1JfRU9MKGNoKSAmJiAhaXNfRkxPV19JTkRJQ0FUT1IoY2gpKSB7XG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBfcG9zaXRpb24pIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbmFtZSBvZiBhbiBhbGlhcyBub2RlIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgY2hhcmFjdGVyJyk7XG4gIH1cblxuICBhbGlhcyA9IHN0YXRlLmlucHV0LnNsaWNlKF9wb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pO1xuXG4gIGlmICghX2hhc093blByb3BlcnR5JDEuY2FsbChzdGF0ZS5hbmNob3JNYXAsIGFsaWFzKSkge1xuICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmlkZW50aWZpZWQgYWxpYXMgXCInICsgYWxpYXMgKyAnXCInKTtcbiAgfVxuXG4gIHN0YXRlLnJlc3VsdCA9IHN0YXRlLmFuY2hvck1hcFthbGlhc107XG4gIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNvbXBvc2VOb2RlKHN0YXRlLCBwYXJlbnRJbmRlbnQsIG5vZGVDb250ZXh0LCBhbGxvd1RvU2VlaywgYWxsb3dDb21wYWN0KSB7XG4gIHZhciBhbGxvd0Jsb2NrU3R5bGVzLFxuICAgICAgYWxsb3dCbG9ja1NjYWxhcnMsXG4gICAgICBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMsXG4gICAgICBpbmRlbnRTdGF0dXMgPSAxLCAvLyAxOiB0aGlzPnBhcmVudCwgMDogdGhpcz1wYXJlbnQsIC0xOiB0aGlzPHBhcmVudFxuICAgICAgYXROZXdMaW5lICA9IGZhbHNlLFxuICAgICAgaGFzQ29udGVudCA9IGZhbHNlLFxuICAgICAgdHlwZUluZGV4LFxuICAgICAgdHlwZVF1YW50aXR5LFxuICAgICAgdHlwZUxpc3QsXG4gICAgICB0eXBlLFxuICAgICAgZmxvd0luZGVudCxcbiAgICAgIGJsb2NrSW5kZW50O1xuXG4gIGlmIChzdGF0ZS5saXN0ZW5lciAhPT0gbnVsbCkge1xuICAgIHN0YXRlLmxpc3RlbmVyKCdvcGVuJywgc3RhdGUpO1xuICB9XG5cbiAgc3RhdGUudGFnICAgID0gbnVsbDtcbiAgc3RhdGUuYW5jaG9yID0gbnVsbDtcbiAgc3RhdGUua2luZCAgID0gbnVsbDtcbiAgc3RhdGUucmVzdWx0ID0gbnVsbDtcblxuICBhbGxvd0Jsb2NrU3R5bGVzID0gYWxsb3dCbG9ja1NjYWxhcnMgPSBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgPVxuICAgIENPTlRFWFRfQkxPQ0tfT1VUID09PSBub2RlQ29udGV4dCB8fFxuICAgIENPTlRFWFRfQkxPQ0tfSU4gID09PSBub2RlQ29udGV4dDtcblxuICBpZiAoYWxsb3dUb1NlZWspIHtcbiAgICBpZiAoc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpKSB7XG4gICAgICBhdE5ld0xpbmUgPSB0cnVlO1xuXG4gICAgICBpZiAoc3RhdGUubGluZUluZGVudCA+IHBhcmVudEluZGVudCkge1xuICAgICAgICBpbmRlbnRTdGF0dXMgPSAxO1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50ID09PSBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgaW5kZW50U3RhdHVzID0gMDtcbiAgICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA8IHBhcmVudEluZGVudCkge1xuICAgICAgICBpbmRlbnRTdGF0dXMgPSAtMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaW5kZW50U3RhdHVzID09PSAxKSB7XG4gICAgd2hpbGUgKHJlYWRUYWdQcm9wZXJ0eShzdGF0ZSkgfHwgcmVhZEFuY2hvclByb3BlcnR5KHN0YXRlKSkge1xuICAgICAgaWYgKHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKSkge1xuICAgICAgICBhdE5ld0xpbmUgPSB0cnVlO1xuICAgICAgICBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgPSBhbGxvd0Jsb2NrU3R5bGVzO1xuXG4gICAgICAgIGlmIChzdGF0ZS5saW5lSW5kZW50ID4gcGFyZW50SW5kZW50KSB7XG4gICAgICAgICAgaW5kZW50U3RhdHVzID0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50ID09PSBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgICBpbmRlbnRTdGF0dXMgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPCBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgICBpbmRlbnRTdGF0dXMgPSAtMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWxsb3dCbG9ja0NvbGxlY3Rpb25zID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGFsbG93QmxvY2tDb2xsZWN0aW9ucykge1xuICAgIGFsbG93QmxvY2tDb2xsZWN0aW9ucyA9IGF0TmV3TGluZSB8fCBhbGxvd0NvbXBhY3Q7XG4gIH1cblxuICBpZiAoaW5kZW50U3RhdHVzID09PSAxIHx8IENPTlRFWFRfQkxPQ0tfT1VUID09PSBub2RlQ29udGV4dCkge1xuICAgIGlmIChDT05URVhUX0ZMT1dfSU4gPT09IG5vZGVDb250ZXh0IHx8IENPTlRFWFRfRkxPV19PVVQgPT09IG5vZGVDb250ZXh0KSB7XG4gICAgICBmbG93SW5kZW50ID0gcGFyZW50SW5kZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBmbG93SW5kZW50ID0gcGFyZW50SW5kZW50ICsgMTtcbiAgICB9XG5cbiAgICBibG9ja0luZGVudCA9IHN0YXRlLnBvc2l0aW9uIC0gc3RhdGUubGluZVN0YXJ0O1xuXG4gICAgaWYgKGluZGVudFN0YXR1cyA9PT0gMSkge1xuICAgICAgaWYgKGFsbG93QmxvY2tDb2xsZWN0aW9ucyAmJlxuICAgICAgICAgIChyZWFkQmxvY2tTZXF1ZW5jZShzdGF0ZSwgYmxvY2tJbmRlbnQpIHx8XG4gICAgICAgICAgIHJlYWRCbG9ja01hcHBpbmcoc3RhdGUsIGJsb2NrSW5kZW50LCBmbG93SW5kZW50KSkgfHxcbiAgICAgICAgICByZWFkRmxvd0NvbGxlY3Rpb24oc3RhdGUsIGZsb3dJbmRlbnQpKSB7XG4gICAgICAgIGhhc0NvbnRlbnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKChhbGxvd0Jsb2NrU2NhbGFycyAmJiByZWFkQmxvY2tTY2FsYXIoc3RhdGUsIGZsb3dJbmRlbnQpKSB8fFxuICAgICAgICAgICAgcmVhZFNpbmdsZVF1b3RlZFNjYWxhcihzdGF0ZSwgZmxvd0luZGVudCkgfHxcbiAgICAgICAgICAgIHJlYWREb3VibGVRdW90ZWRTY2FsYXIoc3RhdGUsIGZsb3dJbmRlbnQpKSB7XG4gICAgICAgICAgaGFzQ29udGVudCA9IHRydWU7XG5cbiAgICAgICAgfSBlbHNlIGlmIChyZWFkQWxpYXMoc3RhdGUpKSB7XG4gICAgICAgICAgaGFzQ29udGVudCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAoc3RhdGUudGFnICE9PSBudWxsIHx8IHN0YXRlLmFuY2hvciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2FsaWFzIG5vZGUgc2hvdWxkIG5vdCBoYXZlIGFueSBwcm9wZXJ0aWVzJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSBpZiAocmVhZFBsYWluU2NhbGFyKHN0YXRlLCBmbG93SW5kZW50LCBDT05URVhUX0ZMT1dfSU4gPT09IG5vZGVDb250ZXh0KSkge1xuICAgICAgICAgIGhhc0NvbnRlbnQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKHN0YXRlLnRhZyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgc3RhdGUudGFnID0gJz8nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdGF0ZS5hbmNob3IgIT09IG51bGwpIHtcbiAgICAgICAgICBzdGF0ZS5hbmNob3JNYXBbc3RhdGUuYW5jaG9yXSA9IHN0YXRlLnJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5kZW50U3RhdHVzID09PSAwKSB7XG4gICAgICAvLyBTcGVjaWFsIGNhc2U6IGJsb2NrIHNlcXVlbmNlcyBhcmUgYWxsb3dlZCB0byBoYXZlIHNhbWUgaW5kZW50YXRpb24gbGV2ZWwgYXMgdGhlIHBhcmVudC5cbiAgICAgIC8vIGh0dHA6Ly93d3cueWFtbC5vcmcvc3BlYy8xLjIvc3BlYy5odG1sI2lkMjc5OTc4NFxuICAgICAgaGFzQ29udGVudCA9IGFsbG93QmxvY2tDb2xsZWN0aW9ucyAmJiByZWFkQmxvY2tTZXF1ZW5jZShzdGF0ZSwgYmxvY2tJbmRlbnQpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzdGF0ZS50YWcgPT09IG51bGwpIHtcbiAgICBpZiAoc3RhdGUuYW5jaG9yICE9PSBudWxsKSB7XG4gICAgICBzdGF0ZS5hbmNob3JNYXBbc3RhdGUuYW5jaG9yXSA9IHN0YXRlLnJlc3VsdDtcbiAgICB9XG5cbiAgfSBlbHNlIGlmIChzdGF0ZS50YWcgPT09ICc/Jykge1xuICAgIC8vIEltcGxpY2l0IHJlc29sdmluZyBpcyBub3QgYWxsb3dlZCBmb3Igbm9uLXNjYWxhciB0eXBlcywgYW5kICc/J1xuICAgIC8vIG5vbi1zcGVjaWZpYyB0YWcgaXMgb25seSBhdXRvbWF0aWNhbGx5IGFzc2lnbmVkIHRvIHBsYWluIHNjYWxhcnMuXG4gICAgLy9cbiAgICAvLyBXZSBvbmx5IG5lZWQgdG8gY2hlY2sga2luZCBjb25mb3JtaXR5IGluIGNhc2UgdXNlciBleHBsaWNpdGx5IGFzc2lnbnMgJz8nXG4gICAgLy8gdGFnLCBmb3IgZXhhbXBsZSBsaWtlIHRoaXM6IFwiITw/PiBbMF1cIlxuICAgIC8vXG4gICAgaWYgKHN0YXRlLnJlc3VsdCAhPT0gbnVsbCAmJiBzdGF0ZS5raW5kICE9PSAnc2NhbGFyJykge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3VuYWNjZXB0YWJsZSBub2RlIGtpbmQgZm9yICE8Pz4gdGFnOyBpdCBzaG91bGQgYmUgXCJzY2FsYXJcIiwgbm90IFwiJyArIHN0YXRlLmtpbmQgKyAnXCInKTtcbiAgICB9XG5cbiAgICBmb3IgKHR5cGVJbmRleCA9IDAsIHR5cGVRdWFudGl0eSA9IHN0YXRlLmltcGxpY2l0VHlwZXMubGVuZ3RoOyB0eXBlSW5kZXggPCB0eXBlUXVhbnRpdHk7IHR5cGVJbmRleCArPSAxKSB7XG4gICAgICB0eXBlID0gc3RhdGUuaW1wbGljaXRUeXBlc1t0eXBlSW5kZXhdO1xuXG4gICAgICBpZiAodHlwZS5yZXNvbHZlKHN0YXRlLnJlc3VsdCkpIHsgLy8gYHN0YXRlLnJlc3VsdGAgdXBkYXRlZCBpbiByZXNvbHZlciBpZiBtYXRjaGVkXG4gICAgICAgIHN0YXRlLnJlc3VsdCA9IHR5cGUuY29uc3RydWN0KHN0YXRlLnJlc3VsdCk7XG4gICAgICAgIHN0YXRlLnRhZyA9IHR5cGUudGFnO1xuICAgICAgICBpZiAoc3RhdGUuYW5jaG9yICE9PSBudWxsKSB7XG4gICAgICAgICAgc3RhdGUuYW5jaG9yTWFwW3N0YXRlLmFuY2hvcl0gPSBzdGF0ZS5yZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHN0YXRlLnRhZyAhPT0gJyEnKSB7XG4gICAgaWYgKF9oYXNPd25Qcm9wZXJ0eSQxLmNhbGwoc3RhdGUudHlwZU1hcFtzdGF0ZS5raW5kIHx8ICdmYWxsYmFjayddLCBzdGF0ZS50YWcpKSB7XG4gICAgICB0eXBlID0gc3RhdGUudHlwZU1hcFtzdGF0ZS5raW5kIHx8ICdmYWxsYmFjayddW3N0YXRlLnRhZ107XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGxvb2tpbmcgZm9yIG11bHRpIHR5cGVcbiAgICAgIHR5cGUgPSBudWxsO1xuICAgICAgdHlwZUxpc3QgPSBzdGF0ZS50eXBlTWFwLm11bHRpW3N0YXRlLmtpbmQgfHwgJ2ZhbGxiYWNrJ107XG5cbiAgICAgIGZvciAodHlwZUluZGV4ID0gMCwgdHlwZVF1YW50aXR5ID0gdHlwZUxpc3QubGVuZ3RoOyB0eXBlSW5kZXggPCB0eXBlUXVhbnRpdHk7IHR5cGVJbmRleCArPSAxKSB7XG4gICAgICAgIGlmIChzdGF0ZS50YWcuc2xpY2UoMCwgdHlwZUxpc3RbdHlwZUluZGV4XS50YWcubGVuZ3RoKSA9PT0gdHlwZUxpc3RbdHlwZUluZGV4XS50YWcpIHtcbiAgICAgICAgICB0eXBlID0gdHlwZUxpc3RbdHlwZUluZGV4XTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdHlwZSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ3Vua25vd24gdGFnICE8JyArIHN0YXRlLnRhZyArICc+Jyk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnJlc3VsdCAhPT0gbnVsbCAmJiB0eXBlLmtpbmQgIT09IHN0YXRlLmtpbmQpIHtcbiAgICAgIHRocm93RXJyb3Ioc3RhdGUsICd1bmFjY2VwdGFibGUgbm9kZSBraW5kIGZvciAhPCcgKyBzdGF0ZS50YWcgKyAnPiB0YWc7IGl0IHNob3VsZCBiZSBcIicgKyB0eXBlLmtpbmQgKyAnXCIsIG5vdCBcIicgKyBzdGF0ZS5raW5kICsgJ1wiJyk7XG4gICAgfVxuXG4gICAgaWYgKCF0eXBlLnJlc29sdmUoc3RhdGUucmVzdWx0LCBzdGF0ZS50YWcpKSB7IC8vIGBzdGF0ZS5yZXN1bHRgIHVwZGF0ZWQgaW4gcmVzb2x2ZXIgaWYgbWF0Y2hlZFxuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2Nhbm5vdCByZXNvbHZlIGEgbm9kZSB3aXRoICE8JyArIHN0YXRlLnRhZyArICc+IGV4cGxpY2l0IHRhZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5yZXN1bHQgPSB0eXBlLmNvbnN0cnVjdChzdGF0ZS5yZXN1bHQsIHN0YXRlLnRhZyk7XG4gICAgICBpZiAoc3RhdGUuYW5jaG9yICE9PSBudWxsKSB7XG4gICAgICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gc3RhdGUucmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdGF0ZS5saXN0ZW5lciAhPT0gbnVsbCkge1xuICAgIHN0YXRlLmxpc3RlbmVyKCdjbG9zZScsIHN0YXRlKTtcbiAgfVxuICByZXR1cm4gc3RhdGUudGFnICE9PSBudWxsIHx8ICBzdGF0ZS5hbmNob3IgIT09IG51bGwgfHwgaGFzQ29udGVudDtcbn1cblxuZnVuY3Rpb24gcmVhZERvY3VtZW50KHN0YXRlKSB7XG4gIHZhciBkb2N1bWVudFN0YXJ0ID0gc3RhdGUucG9zaXRpb24sXG4gICAgICBfcG9zaXRpb24sXG4gICAgICBkaXJlY3RpdmVOYW1lLFxuICAgICAgZGlyZWN0aXZlQXJncyxcbiAgICAgIGhhc0RpcmVjdGl2ZXMgPSBmYWxzZSxcbiAgICAgIGNoO1xuXG4gIHN0YXRlLnZlcnNpb24gPSBudWxsO1xuICBzdGF0ZS5jaGVja0xpbmVCcmVha3MgPSBzdGF0ZS5sZWdhY3k7XG4gIHN0YXRlLnRhZ01hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHN0YXRlLmFuY2hvck1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgd2hpbGUgKChjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pKSAhPT0gMCkge1xuICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICBpZiAoc3RhdGUubGluZUluZGVudCA+IDAgfHwgY2ggIT09IDB4MjUvKiAlICovKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBoYXNEaXJlY3RpdmVzID0gdHJ1ZTtcbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgICB3aGlsZSAoY2ggIT09IDAgJiYgIWlzX1dTX09SX0VPTChjaCkpIHtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBkaXJlY3RpdmVOYW1lID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gICAgZGlyZWN0aXZlQXJncyA9IFtdO1xuXG4gICAgaWYgKGRpcmVjdGl2ZU5hbWUubGVuZ3RoIDwgMSkge1xuICAgICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2RpcmVjdGl2ZSBuYW1lIG11c3Qgbm90IGJlIGxlc3MgdGhhbiBvbmUgY2hhcmFjdGVyIGluIGxlbmd0aCcpO1xuICAgIH1cblxuICAgIHdoaWxlIChjaCAhPT0gMCkge1xuICAgICAgd2hpbGUgKGlzX1dISVRFX1NQQUNFKGNoKSkge1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaCA9PT0gMHgyMy8qICMgKi8pIHtcbiAgICAgICAgZG8geyBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7IH1cbiAgICAgICAgd2hpbGUgKGNoICE9PSAwICYmICFpc19FT0woY2gpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc19FT0woY2gpKSBicmVhaztcblxuICAgICAgX3Bvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgICAgIHdoaWxlIChjaCAhPT0gMCAmJiAhaXNfV1NfT1JfRU9MKGNoKSkge1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgICB9XG5cbiAgICAgIGRpcmVjdGl2ZUFyZ3MucHVzaChzdGF0ZS5pbnB1dC5zbGljZShfcG9zaXRpb24sIHN0YXRlLnBvc2l0aW9uKSk7XG4gICAgfVxuXG4gICAgaWYgKGNoICE9PSAwKSByZWFkTGluZUJyZWFrKHN0YXRlKTtcblxuICAgIGlmIChfaGFzT3duUHJvcGVydHkkMS5jYWxsKGRpcmVjdGl2ZUhhbmRsZXJzLCBkaXJlY3RpdmVOYW1lKSkge1xuICAgICAgZGlyZWN0aXZlSGFuZGxlcnNbZGlyZWN0aXZlTmFtZV0oc3RhdGUsIGRpcmVjdGl2ZU5hbWUsIGRpcmVjdGl2ZUFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvd1dhcm5pbmcoc3RhdGUsICd1bmtub3duIGRvY3VtZW50IGRpcmVjdGl2ZSBcIicgKyBkaXJlY3RpdmVOYW1lICsgJ1wiJyk7XG4gICAgfVxuICB9XG5cbiAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gIGlmIChzdGF0ZS5saW5lSW5kZW50ID09PSAwICYmXG4gICAgICBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKSAgICAgPT09IDB4MkQvKiAtICovICYmXG4gICAgICBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSkgPT09IDB4MkQvKiAtICovICYmXG4gICAgICBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMikgPT09IDB4MkQvKiAtICovKSB7XG4gICAgc3RhdGUucG9zaXRpb24gKz0gMztcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG5cbiAgfSBlbHNlIGlmIChoYXNEaXJlY3RpdmVzKSB7XG4gICAgdGhyb3dFcnJvcihzdGF0ZSwgJ2RpcmVjdGl2ZXMgZW5kIG1hcmsgaXMgZXhwZWN0ZWQnKTtcbiAgfVxuXG4gIGNvbXBvc2VOb2RlKHN0YXRlLCBzdGF0ZS5saW5lSW5kZW50IC0gMSwgQ09OVEVYVF9CTE9DS19PVVQsIGZhbHNlLCB0cnVlKTtcbiAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gIGlmIChzdGF0ZS5jaGVja0xpbmVCcmVha3MgJiZcbiAgICAgIFBBVFRFUk5fTk9OX0FTQ0lJX0xJTkVfQlJFQUtTLnRlc3Qoc3RhdGUuaW5wdXQuc2xpY2UoZG9jdW1lbnRTdGFydCwgc3RhdGUucG9zaXRpb24pKSkge1xuICAgIHRocm93V2FybmluZyhzdGF0ZSwgJ25vbi1BU0NJSSBsaW5lIGJyZWFrcyBhcmUgaW50ZXJwcmV0ZWQgYXMgY29udGVudCcpO1xuICB9XG5cbiAgc3RhdGUuZG9jdW1lbnRzLnB1c2goc3RhdGUucmVzdWx0KTtcblxuICBpZiAoc3RhdGUucG9zaXRpb24gPT09IHN0YXRlLmxpbmVTdGFydCAmJiB0ZXN0RG9jdW1lbnRTZXBhcmF0b3Ioc3RhdGUpKSB7XG5cbiAgICBpZiAoc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbikgPT09IDB4MkUvKiAuICovKSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbiArPSAzO1xuICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoc3RhdGUucG9zaXRpb24gPCAoc3RhdGUubGVuZ3RoIC0gMSkpIHtcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnZW5kIG9mIHRoZSBzdHJlYW0gb3IgYSBkb2N1bWVudCBzZXBhcmF0b3IgaXMgZXhwZWN0ZWQnKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBsb2FkRG9jdW1lbnRzKGlucHV0LCBvcHRpb25zKSB7XG4gIGlucHV0ID0gU3RyaW5nKGlucHV0KTtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgaWYgKGlucHV0Lmxlbmd0aCAhPT0gMCkge1xuXG4gICAgLy8gQWRkIHRhaWxpbmcgYFxcbmAgaWYgbm90IGV4aXN0c1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KGlucHV0Lmxlbmd0aCAtIDEpICE9PSAweDBBLyogTEYgKi8gJiZcbiAgICAgICAgaW5wdXQuY2hhckNvZGVBdChpbnB1dC5sZW5ndGggLSAxKSAhPT0gMHgwRC8qIENSICovKSB7XG4gICAgICBpbnB1dCArPSAnXFxuJztcbiAgICB9XG5cbiAgICAvLyBTdHJpcCBCT01cbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdCgwKSA9PT0gMHhGRUZGKSB7XG4gICAgICBpbnB1dCA9IGlucHV0LnNsaWNlKDEpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdGF0ZSA9IG5ldyBTdGF0ZSQxKGlucHV0LCBvcHRpb25zKTtcblxuICB2YXIgbnVsbHBvcyA9IGlucHV0LmluZGV4T2YoJ1xcMCcpO1xuXG4gIGlmIChudWxscG9zICE9PSAtMSkge1xuICAgIHN0YXRlLnBvc2l0aW9uID0gbnVsbHBvcztcbiAgICB0aHJvd0Vycm9yKHN0YXRlLCAnbnVsbCBieXRlIGlzIG5vdCBhbGxvd2VkIGluIGlucHV0Jyk7XG4gIH1cblxuICAvLyBVc2UgMCBhcyBzdHJpbmcgdGVybWluYXRvci4gVGhhdCBzaWduaWZpY2FudGx5IHNpbXBsaWZpZXMgYm91bmRzIGNoZWNrLlxuICBzdGF0ZS5pbnB1dCArPSAnXFwwJztcblxuICB3aGlsZSAoc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbikgPT09IDB4MjAvKiBTcGFjZSAqLykge1xuICAgIHN0YXRlLmxpbmVJbmRlbnQgKz0gMTtcbiAgICBzdGF0ZS5wb3NpdGlvbiArPSAxO1xuICB9XG5cbiAgd2hpbGUgKHN0YXRlLnBvc2l0aW9uIDwgKHN0YXRlLmxlbmd0aCAtIDEpKSB7XG4gICAgcmVhZERvY3VtZW50KHN0YXRlKTtcbiAgfVxuXG4gIHJldHVybiBzdGF0ZS5kb2N1bWVudHM7XG59XG5cblxuZnVuY3Rpb24gbG9hZEFsbCQxKGlucHV0LCBpdGVyYXRvciwgb3B0aW9ucykge1xuICBpZiAoaXRlcmF0b3IgIT09IG51bGwgJiYgdHlwZW9mIGl0ZXJhdG9yID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvcHRpb25zID0gaXRlcmF0b3I7XG4gICAgaXRlcmF0b3IgPSBudWxsO1xuICB9XG5cbiAgdmFyIGRvY3VtZW50cyA9IGxvYWREb2N1bWVudHMoaW5wdXQsIG9wdGlvbnMpO1xuXG4gIGlmICh0eXBlb2YgaXRlcmF0b3IgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZG9jdW1lbnRzO1xuICB9XG5cbiAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBkb2N1bWVudHMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGl0ZXJhdG9yKGRvY3VtZW50c1tpbmRleF0pO1xuICB9XG59XG5cblxuZnVuY3Rpb24gbG9hZCQxKGlucHV0LCBvcHRpb25zKSB7XG4gIHZhciBkb2N1bWVudHMgPSBsb2FkRG9jdW1lbnRzKGlucHV0LCBvcHRpb25zKTtcblxuICBpZiAoZG9jdW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIC8qZXNsaW50LWRpc2FibGUgbm8tdW5kZWZpbmVkKi9cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gZG9jdW1lbnRzWzBdO1xuICB9XG4gIHRocm93IG5ldyBleGNlcHRpb24oJ2V4cGVjdGVkIGEgc2luZ2xlIGRvY3VtZW50IGluIHRoZSBzdHJlYW0sIGJ1dCBmb3VuZCBtb3JlJyk7XG59XG5cblxudmFyIGxvYWRBbGxfMSA9IGxvYWRBbGwkMTtcbnZhciBsb2FkXzEgICAgPSBsb2FkJDE7XG5cbnZhciBsb2FkZXIgPSB7XG5cdGxvYWRBbGw6IGxvYWRBbGxfMSxcblx0bG9hZDogbG9hZF8xXG59O1xuXG4vKmVzbGludC1kaXNhYmxlIG5vLXVzZS1iZWZvcmUtZGVmaW5lKi9cblxuXG5cblxuXG52YXIgX3RvU3RyaW5nICAgICAgID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBfaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgQ0hBUl9CT00gICAgICAgICAgICAgICAgICA9IDB4RkVGRjtcbnZhciBDSEFSX1RBQiAgICAgICAgICAgICAgICAgID0gMHgwOTsgLyogVGFiICovXG52YXIgQ0hBUl9MSU5FX0ZFRUQgICAgICAgICAgICA9IDB4MEE7IC8qIExGICovXG52YXIgQ0hBUl9DQVJSSUFHRV9SRVRVUk4gICAgICA9IDB4MEQ7IC8qIENSICovXG52YXIgQ0hBUl9TUEFDRSAgICAgICAgICAgICAgICA9IDB4MjA7IC8qIFNwYWNlICovXG52YXIgQ0hBUl9FWENMQU1BVElPTiAgICAgICAgICA9IDB4MjE7IC8qICEgKi9cbnZhciBDSEFSX0RPVUJMRV9RVU9URSAgICAgICAgID0gMHgyMjsgLyogXCIgKi9cbnZhciBDSEFSX1NIQVJQICAgICAgICAgICAgICAgID0gMHgyMzsgLyogIyAqL1xudmFyIENIQVJfUEVSQ0VOVCAgICAgICAgICAgICAgPSAweDI1OyAvKiAlICovXG52YXIgQ0hBUl9BTVBFUlNBTkQgICAgICAgICAgICA9IDB4MjY7IC8qICYgKi9cbnZhciBDSEFSX1NJTkdMRV9RVU9URSAgICAgICAgID0gMHgyNzsgLyogJyAqL1xudmFyIENIQVJfQVNURVJJU0sgICAgICAgICAgICAgPSAweDJBOyAvKiAqICovXG52YXIgQ0hBUl9DT01NQSAgICAgICAgICAgICAgICA9IDB4MkM7IC8qICwgKi9cbnZhciBDSEFSX01JTlVTICAgICAgICAgICAgICAgID0gMHgyRDsgLyogLSAqL1xudmFyIENIQVJfQ09MT04gICAgICAgICAgICAgICAgPSAweDNBOyAvKiA6ICovXG52YXIgQ0hBUl9FUVVBTFMgICAgICAgICAgICAgICA9IDB4M0Q7IC8qID0gKi9cbnZhciBDSEFSX0dSRUFURVJfVEhBTiAgICAgICAgID0gMHgzRTsgLyogPiAqL1xudmFyIENIQVJfUVVFU1RJT04gICAgICAgICAgICAgPSAweDNGOyAvKiA/ICovXG52YXIgQ0hBUl9DT01NRVJDSUFMX0FUICAgICAgICA9IDB4NDA7IC8qIEAgKi9cbnZhciBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgID0gMHg1QjsgLyogWyAqL1xudmFyIENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVQgPSAweDVEOyAvKiBdICovXG52YXIgQ0hBUl9HUkFWRV9BQ0NFTlQgICAgICAgICA9IDB4NjA7IC8qIGAgKi9cbnZhciBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCAgID0gMHg3QjsgLyogeyAqL1xudmFyIENIQVJfVkVSVElDQUxfTElORSAgICAgICAgPSAweDdDOyAvKiB8ICovXG52YXIgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICA9IDB4N0Q7IC8qIH0gKi9cblxudmFyIEVTQ0FQRV9TRVFVRU5DRVMgPSB7fTtcblxuRVNDQVBFX1NFUVVFTkNFU1sweDAwXSAgID0gJ1xcXFwwJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwN10gICA9ICdcXFxcYSc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MDhdICAgPSAnXFxcXGInO1xuRVNDQVBFX1NFUVVFTkNFU1sweDA5XSAgID0gJ1xcXFx0JztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwQV0gICA9ICdcXFxcbic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MEJdICAgPSAnXFxcXHYnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDBDXSAgID0gJ1xcXFxmJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwRF0gICA9ICdcXFxccic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MUJdICAgPSAnXFxcXGUnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIyXSAgID0gJ1xcXFxcIic7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4NUNdICAgPSAnXFxcXFxcXFwnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDg1XSAgID0gJ1xcXFxOJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHhBMF0gICA9ICdcXFxcXyc7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MjAyOF0gPSAnXFxcXEwnO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIwMjldID0gJ1xcXFxQJztcblxudmFyIERFUFJFQ0FURURfQk9PTEVBTlNfU1lOVEFYID0gW1xuICAneScsICdZJywgJ3llcycsICdZZXMnLCAnWUVTJywgJ29uJywgJ09uJywgJ09OJyxcbiAgJ24nLCAnTicsICdubycsICdObycsICdOTycsICdvZmYnLCAnT2ZmJywgJ09GRidcbl07XG5cbnZhciBERVBSRUNBVEVEX0JBU0U2MF9TWU5UQVggPSAvXlstK10/WzAtOV9dKyg/OjpbMC05X10rKSsoPzpcXC5bMC05X10qKT8kLztcblxuZnVuY3Rpb24gY29tcGlsZVN0eWxlTWFwKHNjaGVtYSwgbWFwKSB7XG4gIHZhciByZXN1bHQsIGtleXMsIGluZGV4LCBsZW5ndGgsIHRhZywgc3R5bGUsIHR5cGU7XG5cbiAgaWYgKG1hcCA9PT0gbnVsbCkgcmV0dXJuIHt9O1xuXG4gIHJlc3VsdCA9IHt9O1xuICBrZXlzID0gT2JqZWN0LmtleXMobWFwKTtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgdGFnID0ga2V5c1tpbmRleF07XG4gICAgc3R5bGUgPSBTdHJpbmcobWFwW3RhZ10pO1xuXG4gICAgaWYgKHRhZy5zbGljZSgwLCAyKSA9PT0gJyEhJykge1xuICAgICAgdGFnID0gJ3RhZzp5YW1sLm9yZywyMDAyOicgKyB0YWcuc2xpY2UoMik7XG4gICAgfVxuICAgIHR5cGUgPSBzY2hlbWEuY29tcGlsZWRUeXBlTWFwWydmYWxsYmFjayddW3RhZ107XG5cbiAgICBpZiAodHlwZSAmJiBfaGFzT3duUHJvcGVydHkuY2FsbCh0eXBlLnN0eWxlQWxpYXNlcywgc3R5bGUpKSB7XG4gICAgICBzdHlsZSA9IHR5cGUuc3R5bGVBbGlhc2VzW3N0eWxlXTtcbiAgICB9XG5cbiAgICByZXN1bHRbdGFnXSA9IHN0eWxlO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gZW5jb2RlSGV4KGNoYXJhY3Rlcikge1xuICB2YXIgc3RyaW5nLCBoYW5kbGUsIGxlbmd0aDtcblxuICBzdHJpbmcgPSBjaGFyYWN0ZXIudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG5cbiAgaWYgKGNoYXJhY3RlciA8PSAweEZGKSB7XG4gICAgaGFuZGxlID0gJ3gnO1xuICAgIGxlbmd0aCA9IDI7XG4gIH0gZWxzZSBpZiAoY2hhcmFjdGVyIDw9IDB4RkZGRikge1xuICAgIGhhbmRsZSA9ICd1JztcbiAgICBsZW5ndGggPSA0O1xuICB9IGVsc2UgaWYgKGNoYXJhY3RlciA8PSAweEZGRkZGRkZGKSB7XG4gICAgaGFuZGxlID0gJ1UnO1xuICAgIGxlbmd0aCA9IDg7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IGV4Y2VwdGlvbignY29kZSBwb2ludCB3aXRoaW4gYSBzdHJpbmcgbWF5IG5vdCBiZSBncmVhdGVyIHRoYW4gMHhGRkZGRkZGRicpO1xuICB9XG5cbiAgcmV0dXJuICdcXFxcJyArIGhhbmRsZSArIGNvbW1vbi5yZXBlYXQoJzAnLCBsZW5ndGggLSBzdHJpbmcubGVuZ3RoKSArIHN0cmluZztcbn1cblxuXG52YXIgUVVPVElOR19UWVBFX1NJTkdMRSA9IDEsXG4gICAgUVVPVElOR19UWVBFX0RPVUJMRSA9IDI7XG5cbmZ1bmN0aW9uIFN0YXRlKG9wdGlvbnMpIHtcbiAgdGhpcy5zY2hlbWEgICAgICAgID0gb3B0aW9uc1snc2NoZW1hJ10gfHwgX2RlZmF1bHQ7XG4gIHRoaXMuaW5kZW50ICAgICAgICA9IE1hdGgubWF4KDEsIChvcHRpb25zWydpbmRlbnQnXSB8fCAyKSk7XG4gIHRoaXMubm9BcnJheUluZGVudCA9IG9wdGlvbnNbJ25vQXJyYXlJbmRlbnQnXSB8fCBmYWxzZTtcbiAgdGhpcy5za2lwSW52YWxpZCAgID0gb3B0aW9uc1snc2tpcEludmFsaWQnXSB8fCBmYWxzZTtcbiAgdGhpcy5mbG93TGV2ZWwgICAgID0gKGNvbW1vbi5pc05vdGhpbmcob3B0aW9uc1snZmxvd0xldmVsJ10pID8gLTEgOiBvcHRpb25zWydmbG93TGV2ZWwnXSk7XG4gIHRoaXMuc3R5bGVNYXAgICAgICA9IGNvbXBpbGVTdHlsZU1hcCh0aGlzLnNjaGVtYSwgb3B0aW9uc1snc3R5bGVzJ10gfHwgbnVsbCk7XG4gIHRoaXMuc29ydEtleXMgICAgICA9IG9wdGlvbnNbJ3NvcnRLZXlzJ10gfHwgZmFsc2U7XG4gIHRoaXMubGluZVdpZHRoICAgICA9IG9wdGlvbnNbJ2xpbmVXaWR0aCddIHx8IDgwO1xuICB0aGlzLm5vUmVmcyAgICAgICAgPSBvcHRpb25zWydub1JlZnMnXSB8fCBmYWxzZTtcbiAgdGhpcy5ub0NvbXBhdE1vZGUgID0gb3B0aW9uc1snbm9Db21wYXRNb2RlJ10gfHwgZmFsc2U7XG4gIHRoaXMuY29uZGVuc2VGbG93ICA9IG9wdGlvbnNbJ2NvbmRlbnNlRmxvdyddIHx8IGZhbHNlO1xuICB0aGlzLnF1b3RpbmdUeXBlICAgPSBvcHRpb25zWydxdW90aW5nVHlwZSddID09PSAnXCInID8gUVVPVElOR19UWVBFX0RPVUJMRSA6IFFVT1RJTkdfVFlQRV9TSU5HTEU7XG4gIHRoaXMuZm9yY2VRdW90ZXMgICA9IG9wdGlvbnNbJ2ZvcmNlUXVvdGVzJ10gfHwgZmFsc2U7XG4gIHRoaXMucmVwbGFjZXIgICAgICA9IHR5cGVvZiBvcHRpb25zWydyZXBsYWNlciddID09PSAnZnVuY3Rpb24nID8gb3B0aW9uc1sncmVwbGFjZXInXSA6IG51bGw7XG5cbiAgdGhpcy5pbXBsaWNpdFR5cGVzID0gdGhpcy5zY2hlbWEuY29tcGlsZWRJbXBsaWNpdDtcbiAgdGhpcy5leHBsaWNpdFR5cGVzID0gdGhpcy5zY2hlbWEuY29tcGlsZWRFeHBsaWNpdDtcblxuICB0aGlzLnRhZyA9IG51bGw7XG4gIHRoaXMucmVzdWx0ID0gJyc7XG5cbiAgdGhpcy5kdXBsaWNhdGVzID0gW107XG4gIHRoaXMudXNlZER1cGxpY2F0ZXMgPSBudWxsO1xufVxuXG4vLyBJbmRlbnRzIGV2ZXJ5IGxpbmUgaW4gYSBzdHJpbmcuIEVtcHR5IGxpbmVzIChcXG4gb25seSkgYXJlIG5vdCBpbmRlbnRlZC5cbmZ1bmN0aW9uIGluZGVudFN0cmluZyhzdHJpbmcsIHNwYWNlcykge1xuICB2YXIgaW5kID0gY29tbW9uLnJlcGVhdCgnICcsIHNwYWNlcyksXG4gICAgICBwb3NpdGlvbiA9IDAsXG4gICAgICBuZXh0ID0gLTEsXG4gICAgICByZXN1bHQgPSAnJyxcbiAgICAgIGxpbmUsXG4gICAgICBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuXG4gIHdoaWxlIChwb3NpdGlvbiA8IGxlbmd0aCkge1xuICAgIG5leHQgPSBzdHJpbmcuaW5kZXhPZignXFxuJywgcG9zaXRpb24pO1xuICAgIGlmIChuZXh0ID09PSAtMSkge1xuICAgICAgbGluZSA9IHN0cmluZy5zbGljZShwb3NpdGlvbik7XG4gICAgICBwb3NpdGlvbiA9IGxlbmd0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGluZSA9IHN0cmluZy5zbGljZShwb3NpdGlvbiwgbmV4dCArIDEpO1xuICAgICAgcG9zaXRpb24gPSBuZXh0ICsgMTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5sZW5ndGggJiYgbGluZSAhPT0gJ1xcbicpIHJlc3VsdCArPSBpbmQ7XG5cbiAgICByZXN1bHQgKz0gbGluZTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlTmV4dExpbmUoc3RhdGUsIGxldmVsKSB7XG4gIHJldHVybiAnXFxuJyArIGNvbW1vbi5yZXBlYXQoJyAnLCBzdGF0ZS5pbmRlbnQgKiBsZXZlbCk7XG59XG5cbmZ1bmN0aW9uIHRlc3RJbXBsaWNpdFJlc29sdmluZyhzdGF0ZSwgc3RyKSB7XG4gIHZhciBpbmRleCwgbGVuZ3RoLCB0eXBlO1xuXG4gIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBzdGF0ZS5pbXBsaWNpdFR5cGVzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICB0eXBlID0gc3RhdGUuaW1wbGljaXRUeXBlc1tpbmRleF07XG5cbiAgICBpZiAodHlwZS5yZXNvbHZlKHN0cikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gWzMzXSBzLXdoaXRlIDo6PSBzLXNwYWNlIHwgcy10YWJcbmZ1bmN0aW9uIGlzV2hpdGVzcGFjZShjKSB7XG4gIHJldHVybiBjID09PSBDSEFSX1NQQUNFIHx8IGMgPT09IENIQVJfVEFCO1xufVxuXG4vLyBSZXR1cm5zIHRydWUgaWYgdGhlIGNoYXJhY3RlciBjYW4gYmUgcHJpbnRlZCB3aXRob3V0IGVzY2FwaW5nLlxuLy8gRnJvbSBZQU1MIDEuMjogXCJhbnkgYWxsb3dlZCBjaGFyYWN0ZXJzIGtub3duIHRvIGJlIG5vbi1wcmludGFibGVcbi8vIHNob3VsZCBhbHNvIGJlIGVzY2FwZWQuIFtIb3dldmVyLF0gVGhpcyBpc27igJl0IG1hbmRhdG9yeVwiXG4vLyBEZXJpdmVkIGZyb20gbmItY2hhciAtIFxcdCAtICN4ODUgLSAjeEEwIC0gI3gyMDI4IC0gI3gyMDI5LlxuZnVuY3Rpb24gaXNQcmludGFibGUoYykge1xuICByZXR1cm4gICgweDAwMDIwIDw9IGMgJiYgYyA8PSAweDAwMDA3RSlcbiAgICAgIHx8ICgoMHgwMDBBMSA8PSBjICYmIGMgPD0gMHgwMEQ3RkYpICYmIGMgIT09IDB4MjAyOCAmJiBjICE9PSAweDIwMjkpXG4gICAgICB8fCAoKDB4MEUwMDAgPD0gYyAmJiBjIDw9IDB4MDBGRkZEKSAmJiBjICE9PSBDSEFSX0JPTSlcbiAgICAgIHx8ICAoMHgxMDAwMCA8PSBjICYmIGMgPD0gMHgxMEZGRkYpO1xufVxuXG4vLyBbMzRdIG5zLWNoYXIgOjo9IG5iLWNoYXIgLSBzLXdoaXRlXG4vLyBbMjddIG5iLWNoYXIgOjo9IGMtcHJpbnRhYmxlIC0gYi1jaGFyIC0gYy1ieXRlLW9yZGVyLW1hcmtcbi8vIFsyNl0gYi1jaGFyICA6Oj0gYi1saW5lLWZlZWQgfCBiLWNhcnJpYWdlLXJldHVyblxuLy8gSW5jbHVkaW5nIHMtd2hpdGUgKGZvciBzb21lIHJlYXNvbiwgZXhhbXBsZXMgZG9lc24ndCBtYXRjaCBzcGVjcyBpbiB0aGlzIGFzcGVjdClcbi8vIG5zLWNoYXIgOjo9IGMtcHJpbnRhYmxlIC0gYi1saW5lLWZlZWQgLSBiLWNhcnJpYWdlLXJldHVybiAtIGMtYnl0ZS1vcmRlci1tYXJrXG5mdW5jdGlvbiBpc05zQ2hhck9yV2hpdGVzcGFjZShjKSB7XG4gIHJldHVybiBpc1ByaW50YWJsZShjKVxuICAgICYmIGMgIT09IENIQVJfQk9NXG4gICAgLy8gLSBiLWNoYXJcbiAgICAmJiBjICE9PSBDSEFSX0NBUlJJQUdFX1JFVFVSTlxuICAgICYmIGMgIT09IENIQVJfTElORV9GRUVEO1xufVxuXG4vLyBbMTI3XSAgbnMtcGxhaW4tc2FmZShjKSA6Oj0gYyA9IGZsb3ctb3V0ICDih5IgbnMtcGxhaW4tc2FmZS1vdXRcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjID0gZmxvdy1pbiAgIOKHkiBucy1wbGFpbi1zYWZlLWluXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYyA9IGJsb2NrLWtleSDih5IgbnMtcGxhaW4tc2FmZS1vdXRcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjID0gZmxvdy1rZXkgIOKHkiBucy1wbGFpbi1zYWZlLWluXG4vLyBbMTI4XSBucy1wbGFpbi1zYWZlLW91dCA6Oj0gbnMtY2hhclxuLy8gWzEyOV0gIG5zLXBsYWluLXNhZmUtaW4gOjo9IG5zLWNoYXIgLSBjLWZsb3ctaW5kaWNhdG9yXG4vLyBbMTMwXSAgbnMtcGxhaW4tY2hhcihjKSA6Oj0gICggbnMtcGxhaW4tc2FmZShjKSAtIOKAnDrigJ0gLSDigJwj4oCdIClcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgKCAvKiBBbiBucy1jaGFyIHByZWNlZGluZyAqLyDigJwj4oCdIClcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgKCDigJw64oCdIC8qIEZvbGxvd2VkIGJ5IGFuIG5zLXBsYWluLXNhZmUoYykgKi8gKVxuZnVuY3Rpb24gaXNQbGFpblNhZmUoYywgcHJldiwgaW5ibG9jaykge1xuICB2YXIgY0lzTnNDaGFyT3JXaGl0ZXNwYWNlID0gaXNOc0NoYXJPcldoaXRlc3BhY2UoYyk7XG4gIHZhciBjSXNOc0NoYXIgPSBjSXNOc0NoYXJPcldoaXRlc3BhY2UgJiYgIWlzV2hpdGVzcGFjZShjKTtcbiAgcmV0dXJuIChcbiAgICAvLyBucy1wbGFpbi1zYWZlXG4gICAgaW5ibG9jayA/IC8vIGMgPSBmbG93LWluXG4gICAgICBjSXNOc0NoYXJPcldoaXRlc3BhY2VcbiAgICAgIDogY0lzTnNDaGFyT3JXaGl0ZXNwYWNlXG4gICAgICAgIC8vIC0gYy1mbG93LWluZGljYXRvclxuICAgICAgICAmJiBjICE9PSBDSEFSX0NPTU1BXG4gICAgICAgICYmIGMgIT09IENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVFxuICAgICAgICAmJiBjICE9PSBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUXG4gICAgICAgICYmIGMgIT09IENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUXG4gICAgICAgICYmIGMgIT09IENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVFxuICApXG4gICAgLy8gbnMtcGxhaW4tY2hhclxuICAgICYmIGMgIT09IENIQVJfU0hBUlAgLy8gZmFsc2Ugb24gJyMnXG4gICAgJiYgIShwcmV2ID09PSBDSEFSX0NPTE9OICYmICFjSXNOc0NoYXIpIC8vIGZhbHNlIG9uICc6ICdcbiAgICB8fCAoaXNOc0NoYXJPcldoaXRlc3BhY2UocHJldikgJiYgIWlzV2hpdGVzcGFjZShwcmV2KSAmJiBjID09PSBDSEFSX1NIQVJQKSAvLyBjaGFuZ2UgdG8gdHJ1ZSBvbiAnW14gXSMnXG4gICAgfHwgKHByZXYgPT09IENIQVJfQ09MT04gJiYgY0lzTnNDaGFyKTsgLy8gY2hhbmdlIHRvIHRydWUgb24gJzpbXiBdJ1xufVxuXG4vLyBTaW1wbGlmaWVkIHRlc3QgZm9yIHZhbHVlcyBhbGxvd2VkIGFzIHRoZSBmaXJzdCBjaGFyYWN0ZXIgaW4gcGxhaW4gc3R5bGUuXG5mdW5jdGlvbiBpc1BsYWluU2FmZUZpcnN0KGMpIHtcbiAgLy8gVXNlcyBhIHN1YnNldCBvZiBucy1jaGFyIC0gYy1pbmRpY2F0b3JcbiAgLy8gd2hlcmUgbnMtY2hhciA9IG5iLWNoYXIgLSBzLXdoaXRlLlxuICAvLyBObyBzdXBwb3J0IG9mICggKCDigJw/4oCdIHwg4oCcOuKAnSB8IOKAnC3igJ0gKSAvKiBGb2xsb3dlZCBieSBhbiBucy1wbGFpbi1zYWZlKGMpKSAqLyApIHBhcnRcbiAgcmV0dXJuIGlzUHJpbnRhYmxlKGMpICYmIGMgIT09IENIQVJfQk9NXG4gICAgJiYgIWlzV2hpdGVzcGFjZShjKSAvLyAtIHMtd2hpdGVcbiAgICAvLyAtIChjLWluZGljYXRvciA6Oj1cbiAgICAvLyDigJwt4oCdIHwg4oCcP+KAnSB8IOKAnDrigJ0gfCDigJws4oCdIHwg4oCcW+KAnSB8IOKAnF3igJ0gfCDigJx74oCdIHwg4oCcfeKAnVxuICAgICYmIGMgIT09IENIQVJfTUlOVVNcbiAgICAmJiBjICE9PSBDSEFSX1FVRVNUSU9OXG4gICAgJiYgYyAhPT0gQ0hBUl9DT0xPTlxuICAgICYmIGMgIT09IENIQVJfQ09NTUFcbiAgICAmJiBjICE9PSBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVRcbiAgICAmJiBjICE9PSBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUXG4gICAgJiYgYyAhPT0gQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVRcbiAgICAmJiBjICE9PSBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVRcbiAgICAvLyB8IOKAnCPigJ0gfCDigJwm4oCdIHwg4oCcKuKAnSB8IOKAnCHigJ0gfCDigJx84oCdIHwg4oCcPeKAnSB8IOKAnD7igJ0gfCDigJwn4oCdIHwg4oCcXCLigJ1cbiAgICAmJiBjICE9PSBDSEFSX1NIQVJQXG4gICAgJiYgYyAhPT0gQ0hBUl9BTVBFUlNBTkRcbiAgICAmJiBjICE9PSBDSEFSX0FTVEVSSVNLXG4gICAgJiYgYyAhPT0gQ0hBUl9FWENMQU1BVElPTlxuICAgICYmIGMgIT09IENIQVJfVkVSVElDQUxfTElORVxuICAgICYmIGMgIT09IENIQVJfRVFVQUxTXG4gICAgJiYgYyAhPT0gQ0hBUl9HUkVBVEVSX1RIQU5cbiAgICAmJiBjICE9PSBDSEFSX1NJTkdMRV9RVU9URVxuICAgICYmIGMgIT09IENIQVJfRE9VQkxFX1FVT1RFXG4gICAgLy8gfCDigJwl4oCdIHwg4oCcQOKAnSB8IOKAnGDigJ0pXG4gICAgJiYgYyAhPT0gQ0hBUl9QRVJDRU5UXG4gICAgJiYgYyAhPT0gQ0hBUl9DT01NRVJDSUFMX0FUXG4gICAgJiYgYyAhPT0gQ0hBUl9HUkFWRV9BQ0NFTlQ7XG59XG5cbi8vIFNpbXBsaWZpZWQgdGVzdCBmb3IgdmFsdWVzIGFsbG93ZWQgYXMgdGhlIGxhc3QgY2hhcmFjdGVyIGluIHBsYWluIHN0eWxlLlxuZnVuY3Rpb24gaXNQbGFpblNhZmVMYXN0KGMpIHtcbiAgLy8ganVzdCBub3Qgd2hpdGVzcGFjZSBvciBjb2xvbiwgaXQgd2lsbCBiZSBjaGVja2VkIHRvIGJlIHBsYWluIGNoYXJhY3RlciBsYXRlclxuICByZXR1cm4gIWlzV2hpdGVzcGFjZShjKSAmJiBjICE9PSBDSEFSX0NPTE9OO1xufVxuXG4vLyBTYW1lIGFzICdzdHJpbmcnLmNvZGVQb2ludEF0KHBvcyksIGJ1dCB3b3JrcyBpbiBvbGRlciBicm93c2Vycy5cbmZ1bmN0aW9uIGNvZGVQb2ludEF0KHN0cmluZywgcG9zKSB7XG4gIHZhciBmaXJzdCA9IHN0cmluZy5jaGFyQ29kZUF0KHBvcyksIHNlY29uZDtcbiAgaWYgKGZpcnN0ID49IDB4RDgwMCAmJiBmaXJzdCA8PSAweERCRkYgJiYgcG9zICsgMSA8IHN0cmluZy5sZW5ndGgpIHtcbiAgICBzZWNvbmQgPSBzdHJpbmcuY2hhckNvZGVBdChwb3MgKyAxKTtcbiAgICBpZiAoc2Vjb25kID49IDB4REMwMCAmJiBzZWNvbmQgPD0gMHhERkZGKSB7XG4gICAgICAvLyBodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZyNzdXJyb2dhdGUtZm9ybXVsYWVcbiAgICAgIHJldHVybiAoZmlyc3QgLSAweEQ4MDApICogMHg0MDAgKyBzZWNvbmQgLSAweERDMDAgKyAweDEwMDAwO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmlyc3Q7XG59XG5cbi8vIERldGVybWluZXMgd2hldGhlciBibG9jayBpbmRlbnRhdGlvbiBpbmRpY2F0b3IgaXMgcmVxdWlyZWQuXG5mdW5jdGlvbiBuZWVkSW5kZW50SW5kaWNhdG9yKHN0cmluZykge1xuICB2YXIgbGVhZGluZ1NwYWNlUmUgPSAvXlxcbiogLztcbiAgcmV0dXJuIGxlYWRpbmdTcGFjZVJlLnRlc3Qoc3RyaW5nKTtcbn1cblxudmFyIFNUWUxFX1BMQUlOICAgPSAxLFxuICAgIFNUWUxFX1NJTkdMRSAgPSAyLFxuICAgIFNUWUxFX0xJVEVSQUwgPSAzLFxuICAgIFNUWUxFX0ZPTERFRCAgPSA0LFxuICAgIFNUWUxFX0RPVUJMRSAgPSA1O1xuXG4vLyBEZXRlcm1pbmVzIHdoaWNoIHNjYWxhciBzdHlsZXMgYXJlIHBvc3NpYmxlIGFuZCByZXR1cm5zIHRoZSBwcmVmZXJyZWQgc3R5bGUuXG4vLyBsaW5lV2lkdGggPSAtMSA9PiBubyBsaW1pdC5cbi8vIFByZS1jb25kaXRpb25zOiBzdHIubGVuZ3RoID4gMC5cbi8vIFBvc3QtY29uZGl0aW9uczpcbi8vICAgIFNUWUxFX1BMQUlOIG9yIFNUWUxFX1NJTkdMRSA9PiBubyBcXG4gYXJlIGluIHRoZSBzdHJpbmcuXG4vLyAgICBTVFlMRV9MSVRFUkFMID0+IG5vIGxpbmVzIGFyZSBzdWl0YWJsZSBmb3IgZm9sZGluZyAob3IgbGluZVdpZHRoIGlzIC0xKS5cbi8vICAgIFNUWUxFX0ZPTERFRCA9PiBhIGxpbmUgPiBsaW5lV2lkdGggYW5kIGNhbiBiZSBmb2xkZWQgKGFuZCBsaW5lV2lkdGggIT0gLTEpLlxuZnVuY3Rpb24gY2hvb3NlU2NhbGFyU3R5bGUoc3RyaW5nLCBzaW5nbGVMaW5lT25seSwgaW5kZW50UGVyTGV2ZWwsIGxpbmVXaWR0aCxcbiAgdGVzdEFtYmlndW91c1R5cGUsIHF1b3RpbmdUeXBlLCBmb3JjZVF1b3RlcywgaW5ibG9jaykge1xuXG4gIHZhciBpO1xuICB2YXIgY2hhciA9IDA7XG4gIHZhciBwcmV2Q2hhciA9IG51bGw7XG4gIHZhciBoYXNMaW5lQnJlYWsgPSBmYWxzZTtcbiAgdmFyIGhhc0ZvbGRhYmxlTGluZSA9IGZhbHNlOyAvLyBvbmx5IGNoZWNrZWQgaWYgc2hvdWxkVHJhY2tXaWR0aFxuICB2YXIgc2hvdWxkVHJhY2tXaWR0aCA9IGxpbmVXaWR0aCAhPT0gLTE7XG4gIHZhciBwcmV2aW91c0xpbmVCcmVhayA9IC0xOyAvLyBjb3VudCB0aGUgZmlyc3QgbGluZSBjb3JyZWN0bHlcbiAgdmFyIHBsYWluID0gaXNQbGFpblNhZmVGaXJzdChjb2RlUG9pbnRBdChzdHJpbmcsIDApKVxuICAgICAgICAgICYmIGlzUGxhaW5TYWZlTGFzdChjb2RlUG9pbnRBdChzdHJpbmcsIHN0cmluZy5sZW5ndGggLSAxKSk7XG5cbiAgaWYgKHNpbmdsZUxpbmVPbmx5IHx8IGZvcmNlUXVvdGVzKSB7XG4gICAgLy8gQ2FzZTogbm8gYmxvY2sgc3R5bGVzLlxuICAgIC8vIENoZWNrIGZvciBkaXNhbGxvd2VkIGNoYXJhY3RlcnMgdG8gcnVsZSBvdXQgcGxhaW4gYW5kIHNpbmdsZS5cbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgY2hhciA+PSAweDEwMDAwID8gaSArPSAyIDogaSsrKSB7XG4gICAgICBjaGFyID0gY29kZVBvaW50QXQoc3RyaW5nLCBpKTtcbiAgICAgIGlmICghaXNQcmludGFibGUoY2hhcikpIHtcbiAgICAgICAgcmV0dXJuIFNUWUxFX0RPVUJMRTtcbiAgICAgIH1cbiAgICAgIHBsYWluID0gcGxhaW4gJiYgaXNQbGFpblNhZmUoY2hhciwgcHJldkNoYXIsIGluYmxvY2spO1xuICAgICAgcHJldkNoYXIgPSBjaGFyO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBDYXNlOiBibG9jayBzdHlsZXMgcGVybWl0dGVkLlxuICAgIGZvciAoaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyBjaGFyID49IDB4MTAwMDAgPyBpICs9IDIgOiBpKyspIHtcbiAgICAgIGNoYXIgPSBjb2RlUG9pbnRBdChzdHJpbmcsIGkpO1xuICAgICAgaWYgKGNoYXIgPT09IENIQVJfTElORV9GRUVEKSB7XG4gICAgICAgIGhhc0xpbmVCcmVhayA9IHRydWU7XG4gICAgICAgIC8vIENoZWNrIGlmIGFueSBsaW5lIGNhbiBiZSBmb2xkZWQuXG4gICAgICAgIGlmIChzaG91bGRUcmFja1dpZHRoKSB7XG4gICAgICAgICAgaGFzRm9sZGFibGVMaW5lID0gaGFzRm9sZGFibGVMaW5lIHx8XG4gICAgICAgICAgICAvLyBGb2xkYWJsZSBsaW5lID0gdG9vIGxvbmcsIGFuZCBub3QgbW9yZS1pbmRlbnRlZC5cbiAgICAgICAgICAgIChpIC0gcHJldmlvdXNMaW5lQnJlYWsgLSAxID4gbGluZVdpZHRoICYmXG4gICAgICAgICAgICAgc3RyaW5nW3ByZXZpb3VzTGluZUJyZWFrICsgMV0gIT09ICcgJyk7XG4gICAgICAgICAgcHJldmlvdXNMaW5lQnJlYWsgPSBpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCFpc1ByaW50YWJsZShjaGFyKSkge1xuICAgICAgICByZXR1cm4gU1RZTEVfRE9VQkxFO1xuICAgICAgfVxuICAgICAgcGxhaW4gPSBwbGFpbiAmJiBpc1BsYWluU2FmZShjaGFyLCBwcmV2Q2hhciwgaW5ibG9jayk7XG4gICAgICBwcmV2Q2hhciA9IGNoYXI7XG4gICAgfVxuICAgIC8vIGluIGNhc2UgdGhlIGVuZCBpcyBtaXNzaW5nIGEgXFxuXG4gICAgaGFzRm9sZGFibGVMaW5lID0gaGFzRm9sZGFibGVMaW5lIHx8IChzaG91bGRUcmFja1dpZHRoICYmXG4gICAgICAoaSAtIHByZXZpb3VzTGluZUJyZWFrIC0gMSA+IGxpbmVXaWR0aCAmJlxuICAgICAgIHN0cmluZ1twcmV2aW91c0xpbmVCcmVhayArIDFdICE9PSAnICcpKTtcbiAgfVxuICAvLyBBbHRob3VnaCBldmVyeSBzdHlsZSBjYW4gcmVwcmVzZW50IFxcbiB3aXRob3V0IGVzY2FwaW5nLCBwcmVmZXIgYmxvY2sgc3R5bGVzXG4gIC8vIGZvciBtdWx0aWxpbmUsIHNpbmNlIHRoZXkncmUgbW9yZSByZWFkYWJsZSBhbmQgdGhleSBkb24ndCBhZGQgZW1wdHkgbGluZXMuXG4gIC8vIEFsc28gcHJlZmVyIGZvbGRpbmcgYSBzdXBlci1sb25nIGxpbmUuXG4gIGlmICghaGFzTGluZUJyZWFrICYmICFoYXNGb2xkYWJsZUxpbmUpIHtcbiAgICAvLyBTdHJpbmdzIGludGVycHJldGFibGUgYXMgYW5vdGhlciB0eXBlIGhhdmUgdG8gYmUgcXVvdGVkO1xuICAgIC8vIGUuZy4gdGhlIHN0cmluZyAndHJ1ZScgdnMuIHRoZSBib29sZWFuIHRydWUuXG4gICAgaWYgKHBsYWluICYmICFmb3JjZVF1b3RlcyAmJiAhdGVzdEFtYmlndW91c1R5cGUoc3RyaW5nKSkge1xuICAgICAgcmV0dXJuIFNUWUxFX1BMQUlOO1xuICAgIH1cbiAgICByZXR1cm4gcXVvdGluZ1R5cGUgPT09IFFVT1RJTkdfVFlQRV9ET1VCTEUgPyBTVFlMRV9ET1VCTEUgOiBTVFlMRV9TSU5HTEU7XG4gIH1cbiAgLy8gRWRnZSBjYXNlOiBibG9jayBpbmRlbnRhdGlvbiBpbmRpY2F0b3IgY2FuIG9ubHkgaGF2ZSBvbmUgZGlnaXQuXG4gIGlmIChpbmRlbnRQZXJMZXZlbCA+IDkgJiYgbmVlZEluZGVudEluZGljYXRvcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIFNUWUxFX0RPVUJMRTtcbiAgfVxuICAvLyBBdCB0aGlzIHBvaW50IHdlIGtub3cgYmxvY2sgc3R5bGVzIGFyZSB2YWxpZC5cbiAgLy8gUHJlZmVyIGxpdGVyYWwgc3R5bGUgdW5sZXNzIHdlIHdhbnQgdG8gZm9sZC5cbiAgaWYgKCFmb3JjZVF1b3Rlcykge1xuICAgIHJldHVybiBoYXNGb2xkYWJsZUxpbmUgPyBTVFlMRV9GT0xERUQgOiBTVFlMRV9MSVRFUkFMO1xuICB9XG4gIHJldHVybiBxdW90aW5nVHlwZSA9PT0gUVVPVElOR19UWVBFX0RPVUJMRSA/IFNUWUxFX0RPVUJMRSA6IFNUWUxFX1NJTkdMRTtcbn1cblxuLy8gTm90ZTogbGluZSBicmVha2luZy9mb2xkaW5nIGlzIGltcGxlbWVudGVkIGZvciBvbmx5IHRoZSBmb2xkZWQgc3R5bGUuXG4vLyBOQi4gV2UgZHJvcCB0aGUgbGFzdCB0cmFpbGluZyBuZXdsaW5lIChpZiBhbnkpIG9mIGEgcmV0dXJuZWQgYmxvY2sgc2NhbGFyXG4vLyAgc2luY2UgdGhlIGR1bXBlciBhZGRzIGl0cyBvd24gbmV3bGluZS4gVGhpcyBhbHdheXMgd29ya3M6XG4vLyAgICDigKIgTm8gZW5kaW5nIG5ld2xpbmUgPT4gdW5hZmZlY3RlZDsgYWxyZWFkeSB1c2luZyBzdHJpcCBcIi1cIiBjaG9tcGluZy5cbi8vICAgIOKAoiBFbmRpbmcgbmV3bGluZSAgICA9PiByZW1vdmVkIHRoZW4gcmVzdG9yZWQuXG4vLyAgSW1wb3J0YW50bHksIHRoaXMga2VlcHMgdGhlIFwiK1wiIGNob21wIGluZGljYXRvciBmcm9tIGdhaW5pbmcgYW4gZXh0cmEgbGluZS5cbmZ1bmN0aW9uIHdyaXRlU2NhbGFyKHN0YXRlLCBzdHJpbmcsIGxldmVsLCBpc2tleSwgaW5ibG9jaykge1xuICBzdGF0ZS5kdW1wID0gKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc3RyaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHN0YXRlLnF1b3RpbmdUeXBlID09PSBRVU9USU5HX1RZUEVfRE9VQkxFID8gJ1wiXCInIDogXCInJ1wiO1xuICAgIH1cbiAgICBpZiAoIXN0YXRlLm5vQ29tcGF0TW9kZSkge1xuICAgICAgaWYgKERFUFJFQ0FURURfQk9PTEVBTlNfU1lOVEFYLmluZGV4T2Yoc3RyaW5nKSAhPT0gLTEgfHwgREVQUkVDQVRFRF9CQVNFNjBfU1lOVEFYLnRlc3Qoc3RyaW5nKSkge1xuICAgICAgICByZXR1cm4gc3RhdGUucXVvdGluZ1R5cGUgPT09IFFVT1RJTkdfVFlQRV9ET1VCTEUgPyAoJ1wiJyArIHN0cmluZyArICdcIicpIDogKFwiJ1wiICsgc3RyaW5nICsgXCInXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBpbmRlbnQgPSBzdGF0ZS5pbmRlbnQgKiBNYXRoLm1heCgxLCBsZXZlbCk7IC8vIG5vIDAtaW5kZW50IHNjYWxhcnNcbiAgICAvLyBBcyBpbmRlbnRhdGlvbiBnZXRzIGRlZXBlciwgbGV0IHRoZSB3aWR0aCBkZWNyZWFzZSBtb25vdG9uaWNhbGx5XG4gICAgLy8gdG8gdGhlIGxvd2VyIGJvdW5kIG1pbihzdGF0ZS5saW5lV2lkdGgsIDQwKS5cbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBpbXBsaWVzXG4gICAgLy8gIHN0YXRlLmxpbmVXaWR0aCDiiaQgNDAgKyBzdGF0ZS5pbmRlbnQ6IHdpZHRoIGlzIGZpeGVkIGF0IHRoZSBsb3dlciBib3VuZC5cbiAgICAvLyAgc3RhdGUubGluZVdpZHRoID4gNDAgKyBzdGF0ZS5pbmRlbnQ6IHdpZHRoIGRlY3JlYXNlcyB1bnRpbCB0aGUgbG93ZXIgYm91bmQuXG4gICAgLy8gVGhpcyBiZWhhdmVzIGJldHRlciB0aGFuIGEgY29uc3RhbnQgbWluaW11bSB3aWR0aCB3aGljaCBkaXNhbGxvd3MgbmFycm93ZXIgb3B0aW9ucyxcbiAgICAvLyBvciBhbiBpbmRlbnQgdGhyZXNob2xkIHdoaWNoIGNhdXNlcyB0aGUgd2lkdGggdG8gc3VkZGVubHkgaW5jcmVhc2UuXG4gICAgdmFyIGxpbmVXaWR0aCA9IHN0YXRlLmxpbmVXaWR0aCA9PT0gLTFcbiAgICAgID8gLTEgOiBNYXRoLm1heChNYXRoLm1pbihzdGF0ZS5saW5lV2lkdGgsIDQwKSwgc3RhdGUubGluZVdpZHRoIC0gaW5kZW50KTtcblxuICAgIC8vIFdpdGhvdXQga25vd2luZyBpZiBrZXlzIGFyZSBpbXBsaWNpdC9leHBsaWNpdCwgYXNzdW1lIGltcGxpY2l0IGZvciBzYWZldHkuXG4gICAgdmFyIHNpbmdsZUxpbmVPbmx5ID0gaXNrZXlcbiAgICAgIC8vIE5vIGJsb2NrIHN0eWxlcyBpbiBmbG93IG1vZGUuXG4gICAgICB8fCAoc3RhdGUuZmxvd0xldmVsID4gLTEgJiYgbGV2ZWwgPj0gc3RhdGUuZmxvd0xldmVsKTtcbiAgICBmdW5jdGlvbiB0ZXN0QW1iaWd1aXR5KHN0cmluZykge1xuICAgICAgcmV0dXJuIHRlc3RJbXBsaWNpdFJlc29sdmluZyhzdGF0ZSwgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKGNob29zZVNjYWxhclN0eWxlKHN0cmluZywgc2luZ2xlTGluZU9ubHksIHN0YXRlLmluZGVudCwgbGluZVdpZHRoLFxuICAgICAgdGVzdEFtYmlndWl0eSwgc3RhdGUucXVvdGluZ1R5cGUsIHN0YXRlLmZvcmNlUXVvdGVzICYmICFpc2tleSwgaW5ibG9jaykpIHtcblxuICAgICAgY2FzZSBTVFlMRV9QTEFJTjpcbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICAgIGNhc2UgU1RZTEVfU0lOR0xFOlxuICAgICAgICByZXR1cm4gXCInXCIgKyBzdHJpbmcucmVwbGFjZSgvJy9nLCBcIicnXCIpICsgXCInXCI7XG4gICAgICBjYXNlIFNUWUxFX0xJVEVSQUw6XG4gICAgICAgIHJldHVybiAnfCcgKyBibG9ja0hlYWRlcihzdHJpbmcsIHN0YXRlLmluZGVudClcbiAgICAgICAgICArIGRyb3BFbmRpbmdOZXdsaW5lKGluZGVudFN0cmluZyhzdHJpbmcsIGluZGVudCkpO1xuICAgICAgY2FzZSBTVFlMRV9GT0xERUQ6XG4gICAgICAgIHJldHVybiAnPicgKyBibG9ja0hlYWRlcihzdHJpbmcsIHN0YXRlLmluZGVudClcbiAgICAgICAgICArIGRyb3BFbmRpbmdOZXdsaW5lKGluZGVudFN0cmluZyhmb2xkU3RyaW5nKHN0cmluZywgbGluZVdpZHRoKSwgaW5kZW50KSk7XG4gICAgICBjYXNlIFNUWUxFX0RPVUJMRTpcbiAgICAgICAgcmV0dXJuICdcIicgKyBlc2NhcGVTdHJpbmcoc3RyaW5nKSArICdcIic7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgZXhjZXB0aW9uKCdpbXBvc3NpYmxlIGVycm9yOiBpbnZhbGlkIHNjYWxhciBzdHlsZScpO1xuICAgIH1cbiAgfSgpKTtcbn1cblxuLy8gUHJlLWNvbmRpdGlvbnM6IHN0cmluZyBpcyB2YWxpZCBmb3IgYSBibG9jayBzY2FsYXIsIDEgPD0gaW5kZW50UGVyTGV2ZWwgPD0gOS5cbmZ1bmN0aW9uIGJsb2NrSGVhZGVyKHN0cmluZywgaW5kZW50UGVyTGV2ZWwpIHtcbiAgdmFyIGluZGVudEluZGljYXRvciA9IG5lZWRJbmRlbnRJbmRpY2F0b3Ioc3RyaW5nKSA/IFN0cmluZyhpbmRlbnRQZXJMZXZlbCkgOiAnJztcblxuICAvLyBub3RlIHRoZSBzcGVjaWFsIGNhc2U6IHRoZSBzdHJpbmcgJ1xcbicgY291bnRzIGFzIGEgXCJ0cmFpbGluZ1wiIGVtcHR5IGxpbmUuXG4gIHZhciBjbGlwID0gICAgICAgICAgc3RyaW5nW3N0cmluZy5sZW5ndGggLSAxXSA9PT0gJ1xcbic7XG4gIHZhciBrZWVwID0gY2xpcCAmJiAoc3RyaW5nW3N0cmluZy5sZW5ndGggLSAyXSA9PT0gJ1xcbicgfHwgc3RyaW5nID09PSAnXFxuJyk7XG4gIHZhciBjaG9tcCA9IGtlZXAgPyAnKycgOiAoY2xpcCA/ICcnIDogJy0nKTtcblxuICByZXR1cm4gaW5kZW50SW5kaWNhdG9yICsgY2hvbXAgKyAnXFxuJztcbn1cblxuLy8gKFNlZSB0aGUgbm90ZSBmb3Igd3JpdGVTY2FsYXIuKVxuZnVuY3Rpb24gZHJvcEVuZGluZ05ld2xpbmUoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmdbc3RyaW5nLmxlbmd0aCAtIDFdID09PSAnXFxuJyA/IHN0cmluZy5zbGljZSgwLCAtMSkgOiBzdHJpbmc7XG59XG5cbi8vIE5vdGU6IGEgbG9uZyBsaW5lIHdpdGhvdXQgYSBzdWl0YWJsZSBicmVhayBwb2ludCB3aWxsIGV4Y2VlZCB0aGUgd2lkdGggbGltaXQuXG4vLyBQcmUtY29uZGl0aW9uczogZXZlcnkgY2hhciBpbiBzdHIgaXNQcmludGFibGUsIHN0ci5sZW5ndGggPiAwLCB3aWR0aCA+IDAuXG5mdW5jdGlvbiBmb2xkU3RyaW5nKHN0cmluZywgd2lkdGgpIHtcbiAgLy8gSW4gZm9sZGVkIHN0eWxlLCAkayQgY29uc2VjdXRpdmUgbmV3bGluZXMgb3V0cHV0IGFzICRrKzEkIG5ld2xpbmVz4oCUXG4gIC8vIHVubGVzcyB0aGV5J3JlIGJlZm9yZSBvciBhZnRlciBhIG1vcmUtaW5kZW50ZWQgbGluZSwgb3IgYXQgdGhlIHZlcnlcbiAgLy8gYmVnaW5uaW5nIG9yIGVuZCwgaW4gd2hpY2ggY2FzZSAkayQgbWFwcyB0byAkayQuXG4gIC8vIFRoZXJlZm9yZSwgcGFyc2UgZWFjaCBjaHVuayBhcyBuZXdsaW5lKHMpIGZvbGxvd2VkIGJ5IGEgY29udGVudCBsaW5lLlxuICB2YXIgbGluZVJlID0gLyhcXG4rKShbXlxcbl0qKS9nO1xuXG4gIC8vIGZpcnN0IGxpbmUgKHBvc3NpYmx5IGFuIGVtcHR5IGxpbmUpXG4gIHZhciByZXN1bHQgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBuZXh0TEYgPSBzdHJpbmcuaW5kZXhPZignXFxuJyk7XG4gICAgbmV4dExGID0gbmV4dExGICE9PSAtMSA/IG5leHRMRiA6IHN0cmluZy5sZW5ndGg7XG4gICAgbGluZVJlLmxhc3RJbmRleCA9IG5leHRMRjtcbiAgICByZXR1cm4gZm9sZExpbmUoc3RyaW5nLnNsaWNlKDAsIG5leHRMRiksIHdpZHRoKTtcbiAgfSgpKTtcbiAgLy8gSWYgd2UgaGF2ZW4ndCByZWFjaGVkIHRoZSBmaXJzdCBjb250ZW50IGxpbmUgeWV0LCBkb24ndCBhZGQgYW4gZXh0cmEgXFxuLlxuICB2YXIgcHJldk1vcmVJbmRlbnRlZCA9IHN0cmluZ1swXSA9PT0gJ1xcbicgfHwgc3RyaW5nWzBdID09PSAnICc7XG4gIHZhciBtb3JlSW5kZW50ZWQ7XG5cbiAgLy8gcmVzdCBvZiB0aGUgbGluZXNcbiAgdmFyIG1hdGNoO1xuICB3aGlsZSAoKG1hdGNoID0gbGluZVJlLmV4ZWMoc3RyaW5nKSkpIHtcbiAgICB2YXIgcHJlZml4ID0gbWF0Y2hbMV0sIGxpbmUgPSBtYXRjaFsyXTtcbiAgICBtb3JlSW5kZW50ZWQgPSAobGluZVswXSA9PT0gJyAnKTtcbiAgICByZXN1bHQgKz0gcHJlZml4XG4gICAgICArICghcHJldk1vcmVJbmRlbnRlZCAmJiAhbW9yZUluZGVudGVkICYmIGxpbmUgIT09ICcnXG4gICAgICAgID8gJ1xcbicgOiAnJylcbiAgICAgICsgZm9sZExpbmUobGluZSwgd2lkdGgpO1xuICAgIHByZXZNb3JlSW5kZW50ZWQgPSBtb3JlSW5kZW50ZWQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBHcmVlZHkgbGluZSBicmVha2luZy5cbi8vIFBpY2tzIHRoZSBsb25nZXN0IGxpbmUgdW5kZXIgdGhlIGxpbWl0IGVhY2ggdGltZSxcbi8vIG90aGVyd2lzZSBzZXR0bGVzIGZvciB0aGUgc2hvcnRlc3QgbGluZSBvdmVyIHRoZSBsaW1pdC5cbi8vIE5CLiBNb3JlLWluZGVudGVkIGxpbmVzICpjYW5ub3QqIGJlIGZvbGRlZCwgYXMgdGhhdCB3b3VsZCBhZGQgYW4gZXh0cmEgXFxuLlxuZnVuY3Rpb24gZm9sZExpbmUobGluZSwgd2lkdGgpIHtcbiAgaWYgKGxpbmUgPT09ICcnIHx8IGxpbmVbMF0gPT09ICcgJykgcmV0dXJuIGxpbmU7XG5cbiAgLy8gU2luY2UgYSBtb3JlLWluZGVudGVkIGxpbmUgYWRkcyBhIFxcbiwgYnJlYWtzIGNhbid0IGJlIGZvbGxvd2VkIGJ5IGEgc3BhY2UuXG4gIHZhciBicmVha1JlID0gLyBbXiBdL2c7IC8vIG5vdGU6IHRoZSBtYXRjaCBpbmRleCB3aWxsIGFsd2F5cyBiZSA8PSBsZW5ndGgtMi5cbiAgdmFyIG1hdGNoO1xuICAvLyBzdGFydCBpcyBhbiBpbmNsdXNpdmUgaW5kZXguIGVuZCwgY3VyciwgYW5kIG5leHQgYXJlIGV4Y2x1c2l2ZS5cbiAgdmFyIHN0YXJ0ID0gMCwgZW5kLCBjdXJyID0gMCwgbmV4dCA9IDA7XG4gIHZhciByZXN1bHQgPSAnJztcblxuICAvLyBJbnZhcmlhbnRzOiAwIDw9IHN0YXJ0IDw9IGxlbmd0aC0xLlxuICAvLyAgIDAgPD0gY3VyciA8PSBuZXh0IDw9IG1heCgwLCBsZW5ndGgtMikuIGN1cnIgLSBzdGFydCA8PSB3aWR0aC5cbiAgLy8gSW5zaWRlIHRoZSBsb29wOlxuICAvLyAgIEEgbWF0Y2ggaW1wbGllcyBsZW5ndGggPj0gMiwgc28gY3VyciBhbmQgbmV4dCBhcmUgPD0gbGVuZ3RoLTIuXG4gIHdoaWxlICgobWF0Y2ggPSBicmVha1JlLmV4ZWMobGluZSkpKSB7XG4gICAgbmV4dCA9IG1hdGNoLmluZGV4O1xuICAgIC8vIG1haW50YWluIGludmFyaWFudDogY3VyciAtIHN0YXJ0IDw9IHdpZHRoXG4gICAgaWYgKG5leHQgLSBzdGFydCA+IHdpZHRoKSB7XG4gICAgICBlbmQgPSAoY3VyciA+IHN0YXJ0KSA/IGN1cnIgOiBuZXh0OyAvLyBkZXJpdmUgZW5kIDw9IGxlbmd0aC0yXG4gICAgICByZXN1bHQgKz0gJ1xcbicgKyBsaW5lLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgICAgLy8gc2tpcCB0aGUgc3BhY2UgdGhhdCB3YXMgb3V0cHV0IGFzIFxcblxuICAgICAgc3RhcnQgPSBlbmQgKyAxOyAgICAgICAgICAgICAgICAgICAgLy8gZGVyaXZlIHN0YXJ0IDw9IGxlbmd0aC0xXG4gICAgfVxuICAgIGN1cnIgPSBuZXh0O1xuICB9XG5cbiAgLy8gQnkgdGhlIGludmFyaWFudHMsIHN0YXJ0IDw9IGxlbmd0aC0xLCBzbyB0aGVyZSBpcyBzb21ldGhpbmcgbGVmdCBvdmVyLlxuICAvLyBJdCBpcyBlaXRoZXIgdGhlIHdob2xlIHN0cmluZyBvciBhIHBhcnQgc3RhcnRpbmcgZnJvbSBub24td2hpdGVzcGFjZS5cbiAgcmVzdWx0ICs9ICdcXG4nO1xuICAvLyBJbnNlcnQgYSBicmVhayBpZiB0aGUgcmVtYWluZGVyIGlzIHRvbyBsb25nIGFuZCB0aGVyZSBpcyBhIGJyZWFrIGF2YWlsYWJsZS5cbiAgaWYgKGxpbmUubGVuZ3RoIC0gc3RhcnQgPiB3aWR0aCAmJiBjdXJyID4gc3RhcnQpIHtcbiAgICByZXN1bHQgKz0gbGluZS5zbGljZShzdGFydCwgY3VycikgKyAnXFxuJyArIGxpbmUuc2xpY2UoY3VyciArIDEpO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdCArPSBsaW5lLnNsaWNlKHN0YXJ0KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQuc2xpY2UoMSk7IC8vIGRyb3AgZXh0cmEgXFxuIGpvaW5lclxufVxuXG4vLyBFc2NhcGVzIGEgZG91YmxlLXF1b3RlZCBzdHJpbmcuXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcoc3RyaW5nKSB7XG4gIHZhciByZXN1bHQgPSAnJztcbiAgdmFyIGNoYXIgPSAwO1xuICB2YXIgZXNjYXBlU2VxO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgY2hhciA+PSAweDEwMDAwID8gaSArPSAyIDogaSsrKSB7XG4gICAgY2hhciA9IGNvZGVQb2ludEF0KHN0cmluZywgaSk7XG4gICAgZXNjYXBlU2VxID0gRVNDQVBFX1NFUVVFTkNFU1tjaGFyXTtcblxuICAgIGlmICghZXNjYXBlU2VxICYmIGlzUHJpbnRhYmxlKGNoYXIpKSB7XG4gICAgICByZXN1bHQgKz0gc3RyaW5nW2ldO1xuICAgICAgaWYgKGNoYXIgPj0gMHgxMDAwMCkgcmVzdWx0ICs9IHN0cmluZ1tpICsgMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSBlc2NhcGVTZXEgfHwgZW5jb2RlSGV4KGNoYXIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvd1NlcXVlbmNlKHN0YXRlLCBsZXZlbCwgb2JqZWN0KSB7XG4gIHZhciBfcmVzdWx0ID0gJycsXG4gICAgICBfdGFnICAgID0gc3RhdGUudGFnLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGgsXG4gICAgICB2YWx1ZTtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICB2YWx1ZSA9IG9iamVjdFtpbmRleF07XG5cbiAgICBpZiAoc3RhdGUucmVwbGFjZXIpIHtcbiAgICAgIHZhbHVlID0gc3RhdGUucmVwbGFjZXIuY2FsbChvYmplY3QsIFN0cmluZyhpbmRleCksIHZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyBXcml0ZSBvbmx5IHZhbGlkIGVsZW1lbnRzLCBwdXQgbnVsbCBpbnN0ZWFkIG9mIGludmFsaWQgZWxlbWVudHMuXG4gICAgaWYgKHdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIHZhbHVlLCBmYWxzZSwgZmFsc2UpIHx8XG4gICAgICAgICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICB3cml0ZU5vZGUoc3RhdGUsIGxldmVsLCBudWxsLCBmYWxzZSwgZmFsc2UpKSkge1xuXG4gICAgICBpZiAoX3Jlc3VsdCAhPT0gJycpIF9yZXN1bHQgKz0gJywnICsgKCFzdGF0ZS5jb25kZW5zZUZsb3cgPyAnICcgOiAnJyk7XG4gICAgICBfcmVzdWx0ICs9IHN0YXRlLmR1bXA7XG4gICAgfVxuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9ICdbJyArIF9yZXN1bHQgKyAnXSc7XG59XG5cbmZ1bmN0aW9uIHdyaXRlQmxvY2tTZXF1ZW5jZShzdGF0ZSwgbGV2ZWwsIG9iamVjdCwgY29tcGFjdCkge1xuICB2YXIgX3Jlc3VsdCA9ICcnLFxuICAgICAgX3RhZyAgICA9IHN0YXRlLnRhZyxcbiAgICAgIGluZGV4LFxuICAgICAgbGVuZ3RoLFxuICAgICAgdmFsdWU7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgdmFsdWUgPSBvYmplY3RbaW5kZXhdO1xuXG4gICAgaWYgKHN0YXRlLnJlcGxhY2VyKSB7XG4gICAgICB2YWx1ZSA9IHN0YXRlLnJlcGxhY2VyLmNhbGwob2JqZWN0LCBTdHJpbmcoaW5kZXgpLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgLy8gV3JpdGUgb25seSB2YWxpZCBlbGVtZW50cywgcHV0IG51bGwgaW5zdGVhZCBvZiBpbnZhbGlkIGVsZW1lbnRzLlxuICAgIGlmICh3cml0ZU5vZGUoc3RhdGUsIGxldmVsICsgMSwgdmFsdWUsIHRydWUsIHRydWUsIGZhbHNlLCB0cnVlKSB8fFxuICAgICAgICAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgd3JpdGVOb2RlKHN0YXRlLCBsZXZlbCArIDEsIG51bGwsIHRydWUsIHRydWUsIGZhbHNlLCB0cnVlKSkpIHtcblxuICAgICAgaWYgKCFjb21wYWN0IHx8IF9yZXN1bHQgIT09ICcnKSB7XG4gICAgICAgIF9yZXN1bHQgKz0gZ2VuZXJhdGVOZXh0TGluZShzdGF0ZSwgbGV2ZWwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3RhdGUuZHVtcCAmJiBDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuZHVtcC5jaGFyQ29kZUF0KDApKSB7XG4gICAgICAgIF9yZXN1bHQgKz0gJy0nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3Jlc3VsdCArPSAnLSAnO1xuICAgICAgfVxuXG4gICAgICBfcmVzdWx0ICs9IHN0YXRlLmR1bXA7XG4gICAgfVxuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9IF9yZXN1bHQgfHwgJ1tdJzsgLy8gRW1wdHkgc2VxdWVuY2UgaWYgbm8gdmFsaWQgdmFsdWVzLlxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb3dNYXBwaW5nKHN0YXRlLCBsZXZlbCwgb2JqZWN0KSB7XG4gIHZhciBfcmVzdWx0ICAgICAgID0gJycsXG4gICAgICBfdGFnICAgICAgICAgID0gc3RhdGUudGFnLFxuICAgICAgb2JqZWN0S2V5TGlzdCA9IE9iamVjdC5rZXlzKG9iamVjdCksXG4gICAgICBpbmRleCxcbiAgICAgIGxlbmd0aCxcbiAgICAgIG9iamVjdEtleSxcbiAgICAgIG9iamVjdFZhbHVlLFxuICAgICAgcGFpckJ1ZmZlcjtcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0S2V5TGlzdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG5cbiAgICBwYWlyQnVmZmVyID0gJyc7XG4gICAgaWYgKF9yZXN1bHQgIT09ICcnKSBwYWlyQnVmZmVyICs9ICcsICc7XG5cbiAgICBpZiAoc3RhdGUuY29uZGVuc2VGbG93KSBwYWlyQnVmZmVyICs9ICdcIic7XG5cbiAgICBvYmplY3RLZXkgPSBvYmplY3RLZXlMaXN0W2luZGV4XTtcbiAgICBvYmplY3RWYWx1ZSA9IG9iamVjdFtvYmplY3RLZXldO1xuXG4gICAgaWYgKHN0YXRlLnJlcGxhY2VyKSB7XG4gICAgICBvYmplY3RWYWx1ZSA9IHN0YXRlLnJlcGxhY2VyLmNhbGwob2JqZWN0LCBvYmplY3RLZXksIG9iamVjdFZhbHVlKTtcbiAgICB9XG5cbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdEtleSwgZmFsc2UsIGZhbHNlKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCBrZXk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmR1bXAubGVuZ3RoID4gMTAyNCkgcGFpckJ1ZmZlciArPSAnPyAnO1xuXG4gICAgcGFpckJ1ZmZlciArPSBzdGF0ZS5kdW1wICsgKHN0YXRlLmNvbmRlbnNlRmxvdyA/ICdcIicgOiAnJykgKyAnOicgKyAoc3RhdGUuY29uZGVuc2VGbG93ID8gJycgOiAnICcpO1xuXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsLCBvYmplY3RWYWx1ZSwgZmFsc2UsIGZhbHNlKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCB2YWx1ZS5cbiAgICB9XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXA7XG5cbiAgICAvLyBCb3RoIGtleSBhbmQgdmFsdWUgYXJlIHZhbGlkLlxuICAgIF9yZXN1bHQgKz0gcGFpckJ1ZmZlcjtcbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSAneycgKyBfcmVzdWx0ICsgJ30nO1xufVxuXG5mdW5jdGlvbiB3cml0ZUJsb2NrTWFwcGluZyhzdGF0ZSwgbGV2ZWwsIG9iamVjdCwgY29tcGFjdCkge1xuICB2YXIgX3Jlc3VsdCAgICAgICA9ICcnLFxuICAgICAgX3RhZyAgICAgICAgICA9IHN0YXRlLnRhZyxcbiAgICAgIG9iamVjdEtleUxpc3QgPSBPYmplY3Qua2V5cyhvYmplY3QpLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGgsXG4gICAgICBvYmplY3RLZXksXG4gICAgICBvYmplY3RWYWx1ZSxcbiAgICAgIGV4cGxpY2l0UGFpcixcbiAgICAgIHBhaXJCdWZmZXI7XG5cbiAgLy8gQWxsb3cgc29ydGluZyBrZXlzIHNvIHRoYXQgdGhlIG91dHB1dCBmaWxlIGlzIGRldGVybWluaXN0aWNcbiAgaWYgKHN0YXRlLnNvcnRLZXlzID09PSB0cnVlKSB7XG4gICAgLy8gRGVmYXVsdCBzb3J0aW5nXG4gICAgb2JqZWN0S2V5TGlzdC5zb3J0KCk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHN0YXRlLnNvcnRLZXlzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gQ3VzdG9tIHNvcnQgZnVuY3Rpb25cbiAgICBvYmplY3RLZXlMaXN0LnNvcnQoc3RhdGUuc29ydEtleXMpO1xuICB9IGVsc2UgaWYgKHN0YXRlLnNvcnRLZXlzKSB7XG4gICAgLy8gU29tZXRoaW5nIGlzIHdyb25nXG4gICAgdGhyb3cgbmV3IGV4Y2VwdGlvbignc29ydEtleXMgbXVzdCBiZSBhIGJvb2xlYW4gb3IgYSBmdW5jdGlvbicpO1xuICB9XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdEtleUxpc3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHBhaXJCdWZmZXIgPSAnJztcblxuICAgIGlmICghY29tcGFjdCB8fCBfcmVzdWx0ICE9PSAnJykge1xuICAgICAgcGFpckJ1ZmZlciArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgfVxuXG4gICAgb2JqZWN0S2V5ID0gb2JqZWN0S2V5TGlzdFtpbmRleF07XG4gICAgb2JqZWN0VmFsdWUgPSBvYmplY3Rbb2JqZWN0S2V5XTtcblxuICAgIGlmIChzdGF0ZS5yZXBsYWNlcikge1xuICAgICAgb2JqZWN0VmFsdWUgPSBzdGF0ZS5yZXBsYWNlci5jYWxsKG9iamVjdCwgb2JqZWN0S2V5LCBvYmplY3RWYWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsICsgMSwgb2JqZWN0S2V5LCB0cnVlLCB0cnVlLCB0cnVlKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCBrZXkuXG4gICAgfVxuXG4gICAgZXhwbGljaXRQYWlyID0gKHN0YXRlLnRhZyAhPT0gbnVsbCAmJiBzdGF0ZS50YWcgIT09ICc/JykgfHxcbiAgICAgICAgICAgICAgICAgICAoc3RhdGUuZHVtcCAmJiBzdGF0ZS5kdW1wLmxlbmd0aCA+IDEwMjQpO1xuXG4gICAgaWYgKGV4cGxpY2l0UGFpcikge1xuICAgICAgaWYgKHN0YXRlLmR1bXAgJiYgQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmR1bXAuY2hhckNvZGVBdCgwKSkge1xuICAgICAgICBwYWlyQnVmZmVyICs9ICc/JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhaXJCdWZmZXIgKz0gJz8gJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXA7XG5cbiAgICBpZiAoZXhwbGljaXRQYWlyKSB7XG4gICAgICBwYWlyQnVmZmVyICs9IGdlbmVyYXRlTmV4dExpbmUoc3RhdGUsIGxldmVsKTtcbiAgICB9XG5cbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwgKyAxLCBvYmplY3RWYWx1ZSwgdHJ1ZSwgZXhwbGljaXRQYWlyKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCB2YWx1ZS5cbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuZHVtcCAmJiBDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuZHVtcC5jaGFyQ29kZUF0KDApKSB7XG4gICAgICBwYWlyQnVmZmVyICs9ICc6JztcbiAgICB9IGVsc2Uge1xuICAgICAgcGFpckJ1ZmZlciArPSAnOiAnO1xuICAgIH1cblxuICAgIHBhaXJCdWZmZXIgKz0gc3RhdGUuZHVtcDtcblxuICAgIC8vIEJvdGgga2V5IGFuZCB2YWx1ZSBhcmUgdmFsaWQuXG4gICAgX3Jlc3VsdCArPSBwYWlyQnVmZmVyO1xuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9IF9yZXN1bHQgfHwgJ3t9JzsgLy8gRW1wdHkgbWFwcGluZyBpZiBubyB2YWxpZCBwYWlycy5cbn1cblxuZnVuY3Rpb24gZGV0ZWN0VHlwZShzdGF0ZSwgb2JqZWN0LCBleHBsaWNpdCkge1xuICB2YXIgX3Jlc3VsdCwgdHlwZUxpc3QsIGluZGV4LCBsZW5ndGgsIHR5cGUsIHN0eWxlO1xuXG4gIHR5cGVMaXN0ID0gZXhwbGljaXQgPyBzdGF0ZS5leHBsaWNpdFR5cGVzIDogc3RhdGUuaW1wbGljaXRUeXBlcztcblxuICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gdHlwZUxpc3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHR5cGUgPSB0eXBlTGlzdFtpbmRleF07XG5cbiAgICBpZiAoKHR5cGUuaW5zdGFuY2VPZiAgfHwgdHlwZS5wcmVkaWNhdGUpICYmXG4gICAgICAgICghdHlwZS5pbnN0YW5jZU9mIHx8ICgodHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcpICYmIChvYmplY3QgaW5zdGFuY2VvZiB0eXBlLmluc3RhbmNlT2YpKSkgJiZcbiAgICAgICAgKCF0eXBlLnByZWRpY2F0ZSAgfHwgdHlwZS5wcmVkaWNhdGUob2JqZWN0KSkpIHtcblxuICAgICAgaWYgKGV4cGxpY2l0KSB7XG4gICAgICAgIGlmICh0eXBlLm11bHRpICYmIHR5cGUucmVwcmVzZW50TmFtZSkge1xuICAgICAgICAgIHN0YXRlLnRhZyA9IHR5cGUucmVwcmVzZW50TmFtZShvYmplY3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlLnRhZyA9IHR5cGUudGFnO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS50YWcgPSAnPyc7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlLnJlcHJlc2VudCkge1xuICAgICAgICBzdHlsZSA9IHN0YXRlLnN0eWxlTWFwW3R5cGUudGFnXSB8fCB0eXBlLmRlZmF1bHRTdHlsZTtcblxuICAgICAgICBpZiAoX3RvU3RyaW5nLmNhbGwodHlwZS5yZXByZXNlbnQpID09PSAnW29iamVjdCBGdW5jdGlvbl0nKSB7XG4gICAgICAgICAgX3Jlc3VsdCA9IHR5cGUucmVwcmVzZW50KG9iamVjdCwgc3R5bGUpO1xuICAgICAgICB9IGVsc2UgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHR5cGUucmVwcmVzZW50LCBzdHlsZSkpIHtcbiAgICAgICAgICBfcmVzdWx0ID0gdHlwZS5yZXByZXNlbnRbc3R5bGVdKG9iamVjdCwgc3R5bGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBleGNlcHRpb24oJyE8JyArIHR5cGUudGFnICsgJz4gdGFnIHJlc29sdmVyIGFjY2VwdHMgbm90IFwiJyArIHN0eWxlICsgJ1wiIHN0eWxlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZS5kdW1wID0gX3Jlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBTZXJpYWxpemVzIGBvYmplY3RgIGFuZCB3cml0ZXMgaXQgdG8gZ2xvYmFsIGByZXN1bHRgLlxuLy8gUmV0dXJucyB0cnVlIG9uIHN1Y2Nlc3MsIG9yIGZhbHNlIG9uIGludmFsaWQgb2JqZWN0LlxuLy9cbmZ1bmN0aW9uIHdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdCwgYmxvY2ssIGNvbXBhY3QsIGlza2V5LCBpc2Jsb2Nrc2VxKSB7XG4gIHN0YXRlLnRhZyA9IG51bGw7XG4gIHN0YXRlLmR1bXAgPSBvYmplY3Q7XG5cbiAgaWYgKCFkZXRlY3RUeXBlKHN0YXRlLCBvYmplY3QsIGZhbHNlKSkge1xuICAgIGRldGVjdFR5cGUoc3RhdGUsIG9iamVjdCwgdHJ1ZSk7XG4gIH1cblxuICB2YXIgdHlwZSA9IF90b1N0cmluZy5jYWxsKHN0YXRlLmR1bXApO1xuICB2YXIgaW5ibG9jayA9IGJsb2NrO1xuICB2YXIgdGFnU3RyO1xuXG4gIGlmIChibG9jaykge1xuICAgIGJsb2NrID0gKHN0YXRlLmZsb3dMZXZlbCA8IDAgfHwgc3RhdGUuZmxvd0xldmVsID4gbGV2ZWwpO1xuICB9XG5cbiAgdmFyIG9iamVjdE9yQXJyYXkgPSB0eXBlID09PSAnW29iamVjdCBPYmplY3RdJyB8fCB0eXBlID09PSAnW29iamVjdCBBcnJheV0nLFxuICAgICAgZHVwbGljYXRlSW5kZXgsXG4gICAgICBkdXBsaWNhdGU7XG5cbiAgaWYgKG9iamVjdE9yQXJyYXkpIHtcbiAgICBkdXBsaWNhdGVJbmRleCA9IHN0YXRlLmR1cGxpY2F0ZXMuaW5kZXhPZihvYmplY3QpO1xuICAgIGR1cGxpY2F0ZSA9IGR1cGxpY2F0ZUluZGV4ICE9PSAtMTtcbiAgfVxuXG4gIGlmICgoc3RhdGUudGFnICE9PSBudWxsICYmIHN0YXRlLnRhZyAhPT0gJz8nKSB8fCBkdXBsaWNhdGUgfHwgKHN0YXRlLmluZGVudCAhPT0gMiAmJiBsZXZlbCA+IDApKSB7XG4gICAgY29tcGFjdCA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKGR1cGxpY2F0ZSAmJiBzdGF0ZS51c2VkRHVwbGljYXRlc1tkdXBsaWNhdGVJbmRleF0pIHtcbiAgICBzdGF0ZS5kdW1wID0gJypyZWZfJyArIGR1cGxpY2F0ZUluZGV4O1xuICB9IGVsc2Uge1xuICAgIGlmIChvYmplY3RPckFycmF5ICYmIGR1cGxpY2F0ZSAmJiAhc3RhdGUudXNlZER1cGxpY2F0ZXNbZHVwbGljYXRlSW5kZXhdKSB7XG4gICAgICBzdGF0ZS51c2VkRHVwbGljYXRlc1tkdXBsaWNhdGVJbmRleF0gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgIGlmIChibG9jayAmJiAoT2JqZWN0LmtleXMoc3RhdGUuZHVtcCkubGVuZ3RoICE9PSAwKSkge1xuICAgICAgICB3cml0ZUJsb2NrTWFwcGluZyhzdGF0ZSwgbGV2ZWwsIHN0YXRlLmR1bXAsIGNvbXBhY3QpO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgc3RhdGUuZHVtcCA9ICcmcmVmXycgKyBkdXBsaWNhdGVJbmRleCArIHN0YXRlLmR1bXA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdyaXRlRmxvd01hcHBpbmcoc3RhdGUsIGxldmVsLCBzdGF0ZS5kdW1wKTtcbiAgICAgICAgaWYgKGR1cGxpY2F0ZSkge1xuICAgICAgICAgIHN0YXRlLmR1bXAgPSAnJnJlZl8nICsgZHVwbGljYXRlSW5kZXggKyAnICcgKyBzdGF0ZS5kdW1wO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICBpZiAoYmxvY2sgJiYgKHN0YXRlLmR1bXAubGVuZ3RoICE9PSAwKSkge1xuICAgICAgICBpZiAoc3RhdGUubm9BcnJheUluZGVudCAmJiAhaXNibG9ja3NlcSAmJiBsZXZlbCA+IDApIHtcbiAgICAgICAgICB3cml0ZUJsb2NrU2VxdWVuY2Uoc3RhdGUsIGxldmVsIC0gMSwgc3RhdGUuZHVtcCwgY29tcGFjdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgd3JpdGVCbG9ja1NlcXVlbmNlKHN0YXRlLCBsZXZlbCwgc3RhdGUuZHVtcCwgY29tcGFjdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGR1cGxpY2F0ZSkge1xuICAgICAgICAgIHN0YXRlLmR1bXAgPSAnJnJlZl8nICsgZHVwbGljYXRlSW5kZXggKyBzdGF0ZS5kdW1wO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3cml0ZUZsb3dTZXF1ZW5jZShzdGF0ZSwgbGV2ZWwsIHN0YXRlLmR1bXApO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgc3RhdGUuZHVtcCA9ICcmcmVmXycgKyBkdXBsaWNhdGVJbmRleCArICcgJyArIHN0YXRlLmR1bXA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdbb2JqZWN0IFN0cmluZ10nKSB7XG4gICAgICBpZiAoc3RhdGUudGFnICE9PSAnPycpIHtcbiAgICAgICAgd3JpdGVTY2FsYXIoc3RhdGUsIHN0YXRlLmR1bXAsIGxldmVsLCBpc2tleSwgaW5ibG9jayk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnW29iamVjdCBVbmRlZmluZWRdJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3RhdGUuc2tpcEludmFsaWQpIHJldHVybiBmYWxzZTtcbiAgICAgIHRocm93IG5ldyBleGNlcHRpb24oJ3VuYWNjZXB0YWJsZSBraW5kIG9mIGFuIG9iamVjdCB0byBkdW1wICcgKyB0eXBlKTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUudGFnICE9PSBudWxsICYmIHN0YXRlLnRhZyAhPT0gJz8nKSB7XG4gICAgICAvLyBOZWVkIHRvIGVuY29kZSBhbGwgY2hhcmFjdGVycyBleGNlcHQgdGhvc2UgYWxsb3dlZCBieSB0aGUgc3BlYzpcbiAgICAgIC8vXG4gICAgICAvLyBbMzVdIG5zLWRlYy1kaWdpdCAgICA6Oj0gIFsjeDMwLSN4MzldIC8qIDAtOSAqL1xuICAgICAgLy8gWzM2XSBucy1oZXgtZGlnaXQgICAgOjo9ICBucy1kZWMtZGlnaXRcbiAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHwgWyN4NDEtI3g0Nl0gLyogQS1GICovIHwgWyN4NjEtI3g2Nl0gLyogYS1mICovXG4gICAgICAvLyBbMzddIG5zLWFzY2lpLWxldHRlciA6Oj0gIFsjeDQxLSN4NUFdIC8qIEEtWiAqLyB8IFsjeDYxLSN4N0FdIC8qIGEteiAqL1xuICAgICAgLy8gWzM4XSBucy13b3JkLWNoYXIgICAgOjo9ICBucy1kZWMtZGlnaXQgfCBucy1hc2NpaS1sZXR0ZXIgfCDigJwt4oCdXG4gICAgICAvLyBbMzldIG5zLXVyaS1jaGFyICAgICA6Oj0gIOKAnCXigJ0gbnMtaGV4LWRpZ2l0IG5zLWhleC1kaWdpdCB8IG5zLXdvcmQtY2hhciB8IOKAnCPigJ1cbiAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHwg4oCcO+KAnSB8IOKAnC/igJ0gfCDigJw/4oCdIHwg4oCcOuKAnSB8IOKAnEDigJ0gfCDigJwm4oCdIHwg4oCcPeKAnSB8IOKAnCvigJ0gfCDigJwk4oCdIHwg4oCcLOKAnVxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgfCDigJxf4oCdIHwg4oCcLuKAnSB8IOKAnCHigJ0gfCDigJx+4oCdIHwg4oCcKuKAnSB8IOKAnCfigJ0gfCDigJwo4oCdIHwg4oCcKeKAnSB8IOKAnFvigJ0gfCDigJxd4oCdXG4gICAgICAvL1xuICAgICAgLy8gQWxzbyBuZWVkIHRvIGVuY29kZSAnIScgYmVjYXVzZSBpdCBoYXMgc3BlY2lhbCBtZWFuaW5nIChlbmQgb2YgdGFnIHByZWZpeCkuXG4gICAgICAvL1xuICAgICAgdGFnU3RyID0gZW5jb2RlVVJJKFxuICAgICAgICBzdGF0ZS50YWdbMF0gPT09ICchJyA/IHN0YXRlLnRhZy5zbGljZSgxKSA6IHN0YXRlLnRhZ1xuICAgICAgKS5yZXBsYWNlKC8hL2csICclMjEnKTtcblxuICAgICAgaWYgKHN0YXRlLnRhZ1swXSA9PT0gJyEnKSB7XG4gICAgICAgIHRhZ1N0ciA9ICchJyArIHRhZ1N0cjtcbiAgICAgIH0gZWxzZSBpZiAodGFnU3RyLnNsaWNlKDAsIDE4KSA9PT0gJ3RhZzp5YW1sLm9yZywyMDAyOicpIHtcbiAgICAgICAgdGFnU3RyID0gJyEhJyArIHRhZ1N0ci5zbGljZSgxOCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YWdTdHIgPSAnITwnICsgdGFnU3RyICsgJz4nO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS5kdW1wID0gdGFnU3RyICsgJyAnICsgc3RhdGUuZHVtcDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0RHVwbGljYXRlUmVmZXJlbmNlcyhvYmplY3QsIHN0YXRlKSB7XG4gIHZhciBvYmplY3RzID0gW10sXG4gICAgICBkdXBsaWNhdGVzSW5kZXhlcyA9IFtdLFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGg7XG5cbiAgaW5zcGVjdE5vZGUob2JqZWN0LCBvYmplY3RzLCBkdXBsaWNhdGVzSW5kZXhlcyk7XG5cbiAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IGR1cGxpY2F0ZXNJbmRleGVzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBzdGF0ZS5kdXBsaWNhdGVzLnB1c2gob2JqZWN0c1tkdXBsaWNhdGVzSW5kZXhlc1tpbmRleF1dKTtcbiAgfVxuICBzdGF0ZS51c2VkRHVwbGljYXRlcyA9IG5ldyBBcnJheShsZW5ndGgpO1xufVxuXG5mdW5jdGlvbiBpbnNwZWN0Tm9kZShvYmplY3QsIG9iamVjdHMsIGR1cGxpY2F0ZXNJbmRleGVzKSB7XG4gIHZhciBvYmplY3RLZXlMaXN0LFxuICAgICAgaW5kZXgsXG4gICAgICBsZW5ndGg7XG5cbiAgaWYgKG9iamVjdCAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0Jykge1xuICAgIGluZGV4ID0gb2JqZWN0cy5pbmRleE9mKG9iamVjdCk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgaWYgKGR1cGxpY2F0ZXNJbmRleGVzLmluZGV4T2YoaW5kZXgpID09PSAtMSkge1xuICAgICAgICBkdXBsaWNhdGVzSW5kZXhlcy5wdXNoKGluZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0cy5wdXNoKG9iamVjdCk7XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAgICAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgICAgICAgaW5zcGVjdE5vZGUob2JqZWN0W2luZGV4XSwgb2JqZWN0cywgZHVwbGljYXRlc0luZGV4ZXMpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmplY3RLZXlMaXN0ID0gT2JqZWN0LmtleXMob2JqZWN0KTtcblxuICAgICAgICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0S2V5TGlzdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgICAgICAgaW5zcGVjdE5vZGUob2JqZWN0W29iamVjdEtleUxpc3RbaW5kZXhdXSwgb2JqZWN0cywgZHVwbGljYXRlc0luZGV4ZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGR1bXAkMShpbnB1dCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgc3RhdGUgPSBuZXcgU3RhdGUob3B0aW9ucyk7XG5cbiAgaWYgKCFzdGF0ZS5ub1JlZnMpIGdldER1cGxpY2F0ZVJlZmVyZW5jZXMoaW5wdXQsIHN0YXRlKTtcblxuICB2YXIgdmFsdWUgPSBpbnB1dDtcblxuICBpZiAoc3RhdGUucmVwbGFjZXIpIHtcbiAgICB2YWx1ZSA9IHN0YXRlLnJlcGxhY2VyLmNhbGwoeyAnJzogdmFsdWUgfSwgJycsIHZhbHVlKTtcbiAgfVxuXG4gIGlmICh3cml0ZU5vZGUoc3RhdGUsIDAsIHZhbHVlLCB0cnVlLCB0cnVlKSkgcmV0dXJuIHN0YXRlLmR1bXAgKyAnXFxuJztcblxuICByZXR1cm4gJyc7XG59XG5cbnZhciBkdW1wXzEgPSBkdW1wJDE7XG5cbnZhciBkdW1wZXIgPSB7XG5cdGR1bXA6IGR1bXBfMVxufTtcblxuZnVuY3Rpb24gcmVuYW1lZChmcm9tLCB0bykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignRnVuY3Rpb24geWFtbC4nICsgZnJvbSArICcgaXMgcmVtb3ZlZCBpbiBqcy15YW1sIDQuICcgK1xuICAgICAgJ1VzZSB5YW1sLicgKyB0byArICcgaW5zdGVhZCwgd2hpY2ggaXMgbm93IHNhZmUgYnkgZGVmYXVsdC4nKTtcbiAgfTtcbn1cblxuXG52YXIgVHlwZSAgICAgICAgICAgICAgICA9IHR5cGU7XG52YXIgU2NoZW1hICAgICAgICAgICAgICA9IHNjaGVtYTtcbnZhciBGQUlMU0FGRV9TQ0hFTUEgICAgID0gZmFpbHNhZmU7XG52YXIgSlNPTl9TQ0hFTUEgICAgICAgICA9IGpzb247XG52YXIgQ09SRV9TQ0hFTUEgICAgICAgICA9IGNvcmU7XG52YXIgREVGQVVMVF9TQ0hFTUEgICAgICA9IF9kZWZhdWx0O1xudmFyIGxvYWQgICAgICAgICAgICAgICAgPSBsb2FkZXIubG9hZDtcbnZhciBsb2FkQWxsICAgICAgICAgICAgID0gbG9hZGVyLmxvYWRBbGw7XG52YXIgZHVtcCAgICAgICAgICAgICAgICA9IGR1bXBlci5kdW1wO1xudmFyIFlBTUxFeGNlcHRpb24gICAgICAgPSBleGNlcHRpb247XG5cbi8vIFJlLWV4cG9ydCBhbGwgdHlwZXMgaW4gY2FzZSB1c2VyIHdhbnRzIHRvIGNyZWF0ZSBjdXN0b20gc2NoZW1hXG52YXIgdHlwZXMgPSB7XG4gIGJpbmFyeTogICAgYmluYXJ5LFxuICBmbG9hdDogICAgIGZsb2F0LFxuICBtYXA6ICAgICAgIG1hcCxcbiAgbnVsbDogICAgICBfbnVsbCxcbiAgcGFpcnM6ICAgICBwYWlycyxcbiAgc2V0OiAgICAgICBzZXQsXG4gIHRpbWVzdGFtcDogdGltZXN0YW1wLFxuICBib29sOiAgICAgIGJvb2wsXG4gIGludDogICAgICAgaW50LFxuICBtZXJnZTogICAgIG1lcmdlLFxuICBvbWFwOiAgICAgIG9tYXAsXG4gIHNlcTogICAgICAgc2VxLFxuICBzdHI6ICAgICAgIHN0clxufTtcblxuLy8gUmVtb3ZlZCBmdW5jdGlvbnMgZnJvbSBKUy1ZQU1MIDMuMC54XG52YXIgc2FmZUxvYWQgICAgICAgICAgICA9IHJlbmFtZWQoJ3NhZmVMb2FkJywgJ2xvYWQnKTtcbnZhciBzYWZlTG9hZEFsbCAgICAgICAgID0gcmVuYW1lZCgnc2FmZUxvYWRBbGwnLCAnbG9hZEFsbCcpO1xudmFyIHNhZmVEdW1wICAgICAgICAgICAgPSByZW5hbWVkKCdzYWZlRHVtcCcsICdkdW1wJyk7XG5cbnZhciBqc1lhbWwgPSB7XG5cdFR5cGU6IFR5cGUsXG5cdFNjaGVtYTogU2NoZW1hLFxuXHRGQUlMU0FGRV9TQ0hFTUE6IEZBSUxTQUZFX1NDSEVNQSxcblx0SlNPTl9TQ0hFTUE6IEpTT05fU0NIRU1BLFxuXHRDT1JFX1NDSEVNQTogQ09SRV9TQ0hFTUEsXG5cdERFRkFVTFRfU0NIRU1BOiBERUZBVUxUX1NDSEVNQSxcblx0bG9hZDogbG9hZCxcblx0bG9hZEFsbDogbG9hZEFsbCxcblx0ZHVtcDogZHVtcCxcblx0WUFNTEV4Y2VwdGlvbjogWUFNTEV4Y2VwdGlvbixcblx0dHlwZXM6IHR5cGVzLFxuXHRzYWZlTG9hZDogc2FmZUxvYWQsXG5cdHNhZmVMb2FkQWxsOiBzYWZlTG9hZEFsbCxcblx0c2FmZUR1bXA6IHNhZmVEdW1wXG59O1xuXG5leHBvcnQgeyBDT1JFX1NDSEVNQSwgREVGQVVMVF9TQ0hFTUEsIEZBSUxTQUZFX1NDSEVNQSwgSlNPTl9TQ0hFTUEsIFNjaGVtYSwgVHlwZSwgWUFNTEV4Y2VwdGlvbiwganNZYW1sIGFzIGRlZmF1bHQsIGR1bXAsIGxvYWQsIGxvYWRBbGwsIHNhZmVEdW1wLCBzYWZlTG9hZCwgc2FmZUxvYWRBbGwsIHR5cGVzIH07XG4iLCJpbXBvcnQgKiBhcyB2c2NvZGUgZnJvbSAndnNjb2RlJztcbmltcG9ydCAqIGFzIHlhbWwgZnJvbSAnanMteWFtbCc7XG5pbXBvcnQgeyBZYW1sSGVscGVyIH0gZnJvbSAnLi4vdXRpbHMveWFtbEhlbHBlcic7XG5cbi8vIFNjaGVtYSBjb25zdGFudHMgKG1hdGNoaW5nIGNvcmUvc3JjL3BhcnNlci9zY2hlbWEudHMpXG5jb25zdCBWQUxJRF9DQVRFR09SSUVTID0gWydmdW5jdGlvbmFsJywgJ2ludGVncmF0aW9uJywgJ3BlcmZvcm1hbmNlJywgJ3NlY3VyaXR5J107XG5jb25zdCBWQUxJRF9SSVNLX0xFVkVMUyA9IFsnbG93JywgJ21lZGl1bScsICdoaWdoJywgJ2NyaXRpY2FsJ107XG5jb25zdCBWQUxJRF9QUklPUklUSUVTID0gWydsb3cnLCAnbWVkaXVtJywgJ2hpZ2gnXTtcbmNvbnN0IFBST1RPQ09MX0JMT0NLUyA9IFsnaHR0cCcsICdncnBjJywgJ2dyYXBocWwnLCAnd2Vic29ja2V0J107XG5jb25zdCBWQUxJRF9IVFRQX01FVEhPRFMgPSBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdERUxFVEUnLCAnUEFUQ0gnLCAnSEVBRCcsICdPUFRJT05TJ107XG5jb25zdCBWQUxJRF9BU1NFUlRJT05fVFlQRVMgPSBbJ3N0YXR1c19jb2RlJywgJ2dycGNfY29kZScsICdyZXNwb25zZV90aW1lJywgJ2pzb25fcGF0aCcsICdoZWFkZXInLCAncHJvdG9fZmllbGQnLCAnamF2YXNjcmlwdCcsICdpbmNsdWRlJ107XG5jb25zdCBWQUxJRF9PUEVSQVRPUlMgPSBbJ2VxdWFscycsICdlcScsICdub3RfZXF1YWxzJywgJ25lcScsICdleGlzdHMnLCAnbm90X2V4aXN0cycsICdub3RfZW1wdHknLCAnY29udGFpbnMnLCAnbm90X2NvbnRhaW5zJywgJ21hdGNoZXMnLCAnZ3QnLCAnZ3RlJywgJ2x0JywgJ2x0ZScsICd0eXBlJywgJ2xlbmd0aCddO1xuY29uc3QgVkFMSURfREFUQV9GT1JNQVRTID0gWydjc3YnLCAnanNvbicsICd5YW1sJywgJ3ltbCddO1xuXG5pbnRlcmZhY2UgVFNwZWNEb2N1bWVudCB7XG4gIHZlcnNpb24/OiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBtZXRhZGF0YT86IHtcbiAgICBhaV9wcm9tcHQ/OiBzdHJpbmc7XG4gICAgcmVsYXRlZF9jb2RlPzogc3RyaW5nW107XG4gICAgdGVzdF9jYXRlZ29yeT86IHN0cmluZztcbiAgICByaXNrX2xldmVsPzogc3RyaW5nO1xuICAgIHRhZ3M/OiBzdHJpbmdbXTtcbiAgICBwcmlvcml0eT86IHN0cmluZztcbiAgICB0aW1lb3V0Pzogc3RyaW5nO1xuICAgIFtrZXk6IHN0cmluZ106IHVua25vd247XG4gIH07XG4gIGh0dHA/OiB7XG4gICAgbWV0aG9kPzogc3RyaW5nO1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgW2tleTogc3RyaW5nXTogdW5rbm93bjtcbiAgfTtcbiAgZ3JwYz86IHtcbiAgICBzZXJ2aWNlPzogc3RyaW5nO1xuICAgIG1ldGhvZD86IHN0cmluZztcbiAgICBba2V5OiBzdHJpbmddOiB1bmtub3duO1xuICB9O1xuICBncmFwaHFsPzoge1xuICAgIHF1ZXJ5Pzogc3RyaW5nO1xuICAgIFtrZXk6IHN0cmluZ106IHVua25vd247XG4gIH07XG4gIHdlYnNvY2tldD86IHtcbiAgICB1cmw/OiBzdHJpbmc7XG4gICAgW2tleTogc3RyaW5nXTogdW5rbm93bjtcbiAgfTtcbiAgYXNzZXJ0aW9ucz86IEFycmF5PHtcbiAgICB0eXBlPzogc3RyaW5nO1xuICAgIGluY2x1ZGU/OiBzdHJpbmc7XG4gICAgb3BlcmF0b3I/OiBzdHJpbmc7XG4gICAgW2tleTogc3RyaW5nXTogdW5rbm93bjtcbiAgfT47XG4gIGRhdGE/OiB7XG4gICAgZm9ybWF0Pzogc3RyaW5nO1xuICAgIFtrZXk6IHN0cmluZ106IHVua25vd247XG4gIH07XG4gIFtrZXk6IHN0cmluZ106IHVua25vd247XG59XG5cbmV4cG9ydCBjbGFzcyBUU3BlY0RpYWdub3N0aWNQcm92aWRlciB7XG4gIHByaXZhdGUgZGlhZ25vc3RpY0NvbGxlY3Rpb246IHZzY29kZS5EaWFnbm9zdGljQ29sbGVjdGlvbjtcbiAgcHJpdmF0ZSBkZWJvdW5jZVRpbWVyOiBOb2RlSlMuVGltZW91dCB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmRpYWdub3N0aWNDb2xsZWN0aW9uID0gdnNjb2RlLmxhbmd1YWdlcy5jcmVhdGVEaWFnbm9zdGljQ29sbGVjdGlvbigndHNwZWMnKTtcbiAgfVxuXG4gIHB1YmxpYyBkaXNwb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuZGlhZ25vc3RpY0NvbGxlY3Rpb24uZGlzcG9zZSgpO1xuICAgIGlmICh0aGlzLmRlYm91bmNlVGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLmRlYm91bmNlVGltZXIpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyB2YWxpZGF0ZURvY3VtZW50RGVib3VuY2VkKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZGVib3VuY2VUaW1lcikge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVib3VuY2VUaW1lcik7XG4gICAgfVxuICAgIFxuICAgIHRoaXMuZGVib3VuY2VUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy52YWxpZGF0ZURvY3VtZW50KGRvY3VtZW50KTtcbiAgICB9LCAzMDApO1xuICB9XG5cbiAgcHVibGljIHZhbGlkYXRlRG9jdW1lbnQoZG9jdW1lbnQ6IHZzY29kZS5UZXh0RG9jdW1lbnQpOiB2b2lkIHtcbiAgICBpZiAoZG9jdW1lbnQubGFuZ3VhZ2VJZCAhPT0gJ3RzcGVjJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZyA9IHZzY29kZS53b3Jrc3BhY2UuZ2V0Q29uZmlndXJhdGlvbigndHNwZWMnKTtcbiAgICBpZiAoIWNvbmZpZy5nZXQoJ3ZhbGlkYXRpb24uZW5hYmxlZCcsIHRydWUpKSB7XG4gICAgICB0aGlzLmRpYWdub3N0aWNDb2xsZWN0aW9uLnNldChkb2N1bWVudC51cmksIFtdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkaWFnbm9zdGljczogdnNjb2RlLkRpYWdub3N0aWNbXSA9IFtdO1xuICAgIGNvbnN0IHRleHQgPSBkb2N1bWVudC5nZXRUZXh0KCk7XG5cbiAgICAvLyBTa2lwIGVtcHR5IGRvY3VtZW50c1xuICAgIGlmICghdGV4dC50cmltKCkpIHtcbiAgICAgIHRoaXMuZGlhZ25vc3RpY0NvbGxlY3Rpb24uc2V0KGRvY3VtZW50LnVyaSwgW10pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAvLyBQYXJzZSBZQU1MXG4gICAgICBjb25zdCBzcGVjID0geWFtbC5sb2FkKHRleHQpIGFzIFRTcGVjRG9jdW1lbnQ7XG4gICAgICBcbiAgICAgIGlmIChzcGVjICYmIHR5cGVvZiBzcGVjID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgcGFyc2VkIGRvY3VtZW50XG4gICAgICAgIHRoaXMudmFsaWRhdGVTcGVjKGRvY3VtZW50LCBzcGVjLCBkaWFnbm9zdGljcyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIFlBTUwgc3ludGF4IGVycm9yXG4gICAgICBjb25zdCB5YW1sRXJyb3IgPSBlcnJvciBhcyB5YW1sLllBTUxFeGNlcHRpb247XG4gICAgICBjb25zdCBkaWFnbm9zdGljID0gdGhpcy5jcmVhdGVZYW1sRXJyb3JEaWFnbm9zdGljKGRvY3VtZW50LCB5YW1sRXJyb3IpO1xuICAgICAgZGlhZ25vc3RpY3MucHVzaChkaWFnbm9zdGljKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpYWdub3N0aWNDb2xsZWN0aW9uLnNldChkb2N1bWVudC51cmksIGRpYWdub3N0aWNzKTtcbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVTcGVjKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50LCBzcGVjOiBUU3BlY0RvY3VtZW50LCBkaWFnbm9zdGljczogdnNjb2RlLkRpYWdub3N0aWNbXSk6IHZvaWQge1xuICAgIGNvbnN0IHN0cmljdCA9IHZzY29kZS53b3Jrc3BhY2UuZ2V0Q29uZmlndXJhdGlvbigndHNwZWMnKS5nZXQoJ3ZhbGlkYXRpb24uc3RyaWN0TW9kZScsIGZhbHNlKTtcblxuICAgIC8vIFJlcXVpcmVkIHRvcC1sZXZlbCBmaWVsZHNcbiAgICB0aGlzLnZhbGlkYXRlUmVxdWlyZWRGaWVsZChkb2N1bWVudCwgc3BlYywgJ3ZlcnNpb24nLCBkaWFnbm9zdGljcyk7XG4gICAgdGhpcy52YWxpZGF0ZVJlcXVpcmVkRmllbGQoZG9jdW1lbnQsIHNwZWMsICdkZXNjcmlwdGlvbicsIGRpYWdub3N0aWNzKTtcbiAgICB0aGlzLnZhbGlkYXRlUmVxdWlyZWRGaWVsZChkb2N1bWVudCwgc3BlYywgJ21ldGFkYXRhJywgZGlhZ25vc3RpY3MpO1xuICAgIHRoaXMudmFsaWRhdGVSZXF1aXJlZEZpZWxkKGRvY3VtZW50LCBzcGVjLCAnYXNzZXJ0aW9ucycsIGRpYWdub3N0aWNzKTtcblxuICAgIC8vIFZlcnNpb24gdmFsaWRhdGlvblxuICAgIGlmIChzcGVjLnZlcnNpb24gJiYgc3BlYy52ZXJzaW9uICE9PSAnMS4wJykge1xuICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAndmVyc2lvbicsIGBJbnZhbGlkIHZlcnNpb246IFwiJHtzcGVjLnZlcnNpb259XCIuIEN1cnJlbnRseSBvbmx5IFwiMS4wXCIgaXMgc3VwcG9ydGVkLmAsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsIGRpYWdub3N0aWNzKTtcbiAgICB9XG5cbiAgICAvLyBQcm90b2NvbCBibG9jayB2YWxpZGF0aW9uXG4gICAgY29uc3QgaGFzUHJvdG9jb2wgPSBQUk9UT0NPTF9CTE9DS1Muc29tZShwID0+IHAgaW4gc3BlYyk7XG4gICAgaWYgKCFoYXNQcm90b2NvbCkge1xuICAgICAgY29uc3QgZGlhZ25vc3RpYyA9IG5ldyB2c2NvZGUuRGlhZ25vc3RpYyhcbiAgICAgICAgbmV3IHZzY29kZS5SYW5nZSgwLCAwLCAwLCAwKSxcbiAgICAgICAgJ01pc3NpbmcgcHJvdG9jb2wgYmxvY2sgKGh0dHAsIGdycGMsIGdyYXBocWwsIG9yIHdlYnNvY2tldCknLFxuICAgICAgICB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yXG4gICAgICApO1xuICAgICAgZGlhZ25vc3RpYy5zb3VyY2UgPSAndHNwZWMnO1xuICAgICAgZGlhZ25vc3RpY3MucHVzaChkaWFnbm9zdGljKTtcbiAgICB9XG5cbiAgICAvLyBNZXRhZGF0YSB2YWxpZGF0aW9uXG4gICAgaWYgKHNwZWMubWV0YWRhdGEpIHtcbiAgICAgIHRoaXMudmFsaWRhdGVNZXRhZGF0YShkb2N1bWVudCwgc3BlYy5tZXRhZGF0YSwgZGlhZ25vc3RpY3MpO1xuICAgIH1cblxuICAgIC8vIEhUVFAgdmFsaWRhdGlvblxuICAgIGlmIChzcGVjLmh0dHApIHtcbiAgICAgIHRoaXMudmFsaWRhdGVIdHRwKGRvY3VtZW50LCBzcGVjLmh0dHAsIGRpYWdub3N0aWNzKTtcbiAgICB9XG5cbiAgICAvLyBnUlBDIHZhbGlkYXRpb25cbiAgICBpZiAoc3BlYy5ncnBjKSB7XG4gICAgICB0aGlzLnZhbGlkYXRlR3JwYyhkb2N1bWVudCwgc3BlYy5ncnBjLCBkaWFnbm9zdGljcyk7XG4gICAgfVxuXG4gICAgLy8gR3JhcGhRTCB2YWxpZGF0aW9uXG4gICAgaWYgKHNwZWMuZ3JhcGhxbCkge1xuICAgICAgdGhpcy52YWxpZGF0ZUdyYXBocWwoZG9jdW1lbnQsIHNwZWMuZ3JhcGhxbCwgZGlhZ25vc3RpY3MpO1xuICAgIH1cblxuICAgIC8vIFdlYlNvY2tldCB2YWxpZGF0aW9uXG4gICAgaWYgKHNwZWMud2Vic29ja2V0KSB7XG4gICAgICB0aGlzLnZhbGlkYXRlV2Vic29ja2V0KGRvY3VtZW50LCBzcGVjLndlYnNvY2tldCwgZGlhZ25vc3RpY3MpO1xuICAgIH1cblxuICAgIC8vIEFzc2VydGlvbnMgdmFsaWRhdGlvblxuICAgIGlmIChzcGVjLmFzc2VydGlvbnMpIHtcbiAgICAgIHRoaXMudmFsaWRhdGVBc3NlcnRpb25zKGRvY3VtZW50LCBzcGVjLmFzc2VydGlvbnMsIGRpYWdub3N0aWNzLCBzdHJpY3QpO1xuICAgIH1cblxuICAgIC8vIERhdGEgdmFsaWRhdGlvblxuICAgIGlmIChzcGVjLmRhdGEpIHtcbiAgICAgIHRoaXMudmFsaWRhdGVEYXRhKGRvY3VtZW50LCBzcGVjLmRhdGEsIGRpYWdub3N0aWNzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlTWV0YWRhdGEoZG9jdW1lbnQ6IHZzY29kZS5UZXh0RG9jdW1lbnQsIG1ldGFkYXRhOiBUU3BlY0RvY3VtZW50WydtZXRhZGF0YSddLCBkaWFnbm9zdGljczogdnNjb2RlLkRpYWdub3N0aWNbXSk6IHZvaWQge1xuICAgIGlmICghbWV0YWRhdGEpIHJldHVybjtcblxuICAgIGNvbnN0IHJlcXVpcmVkRmllbGRzID0gWydhaV9wcm9tcHQnLCAncmVsYXRlZF9jb2RlJywgJ3Rlc3RfY2F0ZWdvcnknLCAncmlza19sZXZlbCcsICd0YWdzJywgJ3ByaW9yaXR5JywgJ3RpbWVvdXQnXTtcbiAgICBmb3IgKGNvbnN0IGZpZWxkIG9mIHJlcXVpcmVkRmllbGRzKSB7XG4gICAgICBpZiAoIShmaWVsZCBpbiBtZXRhZGF0YSkpIHtcbiAgICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAnbWV0YWRhdGEnLCBgTWlzc2luZyByZXF1aXJlZCBtZXRhZGF0YSBmaWVsZDogJHtmaWVsZH1gLCB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLCBkaWFnbm9zdGljcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgZW51bSB2YWx1ZXNcbiAgICBpZiAobWV0YWRhdGEudGVzdF9jYXRlZ29yeSAmJiAhVkFMSURfQ0FURUdPUklFUy5pbmNsdWRlcyhtZXRhZGF0YS50ZXN0X2NhdGVnb3J5KSkge1xuICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAndGVzdF9jYXRlZ29yeScsIGBJbnZhbGlkIHRlc3RfY2F0ZWdvcnk6IFwiJHttZXRhZGF0YS50ZXN0X2NhdGVnb3J5fVwiLiBNdXN0IGJlIG9uZSBvZjogJHtWQUxJRF9DQVRFR09SSUVTLmpvaW4oJywgJyl9YCwgdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvciwgZGlhZ25vc3RpY3MpO1xuICAgIH1cblxuICAgIGlmIChtZXRhZGF0YS5yaXNrX2xldmVsICYmICFWQUxJRF9SSVNLX0xFVkVMUy5pbmNsdWRlcyhtZXRhZGF0YS5yaXNrX2xldmVsKSkge1xuICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAncmlza19sZXZlbCcsIGBJbnZhbGlkIHJpc2tfbGV2ZWw6IFwiJHttZXRhZGF0YS5yaXNrX2xldmVsfVwiLiBNdXN0IGJlIG9uZSBvZjogJHtWQUxJRF9SSVNLX0xFVkVMUy5qb2luKCcsICcpfWAsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsIGRpYWdub3N0aWNzKTtcbiAgICB9XG5cbiAgICBpZiAobWV0YWRhdGEucHJpb3JpdHkgJiYgIVZBTElEX1BSSU9SSVRJRVMuaW5jbHVkZXMobWV0YWRhdGEucHJpb3JpdHkpKSB7XG4gICAgICB0aGlzLmFkZERpYWdub3N0aWMoZG9jdW1lbnQsICdwcmlvcml0eScsIGBJbnZhbGlkIHByaW9yaXR5OiBcIiR7bWV0YWRhdGEucHJpb3JpdHl9XCIuIE11c3QgYmUgb25lIG9mOiAke1ZBTElEX1BSSU9SSVRJRVMuam9pbignLCAnKX1gLCB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLCBkaWFnbm9zdGljcyk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgYXJyYXkgdHlwZXNcbiAgICBpZiAobWV0YWRhdGEucmVsYXRlZF9jb2RlICYmICFBcnJheS5pc0FycmF5KG1ldGFkYXRhLnJlbGF0ZWRfY29kZSkpIHtcbiAgICAgIHRoaXMuYWRkRGlhZ25vc3RpYyhkb2N1bWVudCwgJ3JlbGF0ZWRfY29kZScsICdyZWxhdGVkX2NvZGUgbXVzdCBiZSBhbiBhcnJheScsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsIGRpYWdub3N0aWNzKTtcbiAgICB9XG5cbiAgICBpZiAobWV0YWRhdGEudGFncyAmJiAhQXJyYXkuaXNBcnJheShtZXRhZGF0YS50YWdzKSkge1xuICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAndGFncycsICd0YWdzIG11c3QgYmUgYW4gYXJyYXknLCB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLCBkaWFnbm9zdGljcyk7XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgdGltZW91dCBmb3JtYXRcbiAgICBpZiAobWV0YWRhdGEudGltZW91dCAmJiB0eXBlb2YgbWV0YWRhdGEudGltZW91dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmICghL15cXGQrKD86bXN8c3xtfGgpJC8udGVzdChtZXRhZGF0YS50aW1lb3V0KSkge1xuICAgICAgICB0aGlzLmFkZERpYWdub3N0aWMoZG9jdW1lbnQsICd0aW1lb3V0JywgYEludmFsaWQgdGltZW91dCBmb3JtYXQ6IFwiJHttZXRhZGF0YS50aW1lb3V0fVwiLiBVc2UgZm9ybWF0IGxpa2UgXCIxMHNcIiwgXCI1MDBtc1wiLCBcIjFtXCJgLCB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5Lldhcm5pbmcsIGRpYWdub3N0aWNzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlSHR0cChkb2N1bWVudDogdnNjb2RlLlRleHREb2N1bWVudCwgaHR0cDogVFNwZWNEb2N1bWVudFsnaHR0cCddLCBkaWFnbm9zdGljczogdnNjb2RlLkRpYWdub3N0aWNbXSk6IHZvaWQge1xuICAgIGlmICghaHR0cCkgcmV0dXJuO1xuXG4gICAgaWYgKCFodHRwLm1ldGhvZCkge1xuICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAnaHR0cCcsICdodHRwLm1ldGhvZCBpcyByZXF1aXJlZCcsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsIGRpYWdub3N0aWNzKTtcbiAgICB9IGVsc2UgaWYgKCFWQUxJRF9IVFRQX01FVEhPRFMuaW5jbHVkZXMoaHR0cC5tZXRob2QudG9VcHBlckNhc2UoKSkpIHtcbiAgICAgIHRoaXMuYWRkRGlhZ25vc3RpYyhkb2N1bWVudCwgJ21ldGhvZCcsIGBJbnZhbGlkIEhUVFAgbWV0aG9kOiBcIiR7aHR0cC5tZXRob2R9XCIuIE11c3QgYmUgb25lIG9mOiAke1ZBTElEX0hUVFBfTUVUSE9EUy5qb2luKCcsICcpfWAsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsIGRpYWdub3N0aWNzKTtcbiAgICB9XG5cbiAgICBpZiAoIWh0dHAucGF0aCkge1xuICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAnaHR0cCcsICdodHRwLnBhdGggaXMgcmVxdWlyZWQnLCB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLCBkaWFnbm9zdGljcyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZUdycGMoZG9jdW1lbnQ6IHZzY29kZS5UZXh0RG9jdW1lbnQsIGdycGM6IFRTcGVjRG9jdW1lbnRbJ2dycGMnXSwgZGlhZ25vc3RpY3M6IHZzY29kZS5EaWFnbm9zdGljW10pOiB2b2lkIHtcbiAgICBpZiAoIWdycGMpIHJldHVybjtcblxuICAgIGlmICghZ3JwYy5zZXJ2aWNlKSB7XG4gICAgICB0aGlzLmFkZERpYWdub3N0aWMoZG9jdW1lbnQsICdncnBjJywgJ2dycGMuc2VydmljZSBpcyByZXF1aXJlZCcsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsIGRpYWdub3N0aWNzKTtcbiAgICB9XG5cbiAgICBpZiAoIWdycGMubWV0aG9kKSB7XG4gICAgICB0aGlzLmFkZERpYWdub3N0aWMoZG9jdW1lbnQsICdncnBjJywgJ2dycGMubWV0aG9kIGlzIHJlcXVpcmVkJywgdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvciwgZGlhZ25vc3RpY3MpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVHcmFwaHFsKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50LCBncmFwaHFsOiBUU3BlY0RvY3VtZW50WydncmFwaHFsJ10sIGRpYWdub3N0aWNzOiB2c2NvZGUuRGlhZ25vc3RpY1tdKTogdm9pZCB7XG4gICAgaWYgKCFncmFwaHFsKSByZXR1cm47XG5cbiAgICBpZiAoIWdyYXBocWwucXVlcnkpIHtcbiAgICAgIHRoaXMuYWRkRGlhZ25vc3RpYyhkb2N1bWVudCwgJ2dyYXBocWwnLCAnZ3JhcGhxbC5xdWVyeSBpcyByZXF1aXJlZCcsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsIGRpYWdub3N0aWNzKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZhbGlkYXRlV2Vic29ja2V0KGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50LCB3ZWJzb2NrZXQ6IFRTcGVjRG9jdW1lbnRbJ3dlYnNvY2tldCddLCBkaWFnbm9zdGljczogdnNjb2RlLkRpYWdub3N0aWNbXSk6IHZvaWQge1xuICAgIGlmICghd2Vic29ja2V0KSByZXR1cm47XG5cbiAgICBpZiAoIXdlYnNvY2tldC51cmwpIHtcbiAgICAgIHRoaXMuYWRkRGlhZ25vc3RpYyhkb2N1bWVudCwgJ3dlYnNvY2tldCcsICd3ZWJzb2NrZXQudXJsIGlzIHJlcXVpcmVkJywgdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvciwgZGlhZ25vc3RpY3MpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVBc3NlcnRpb25zKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50LCBhc3NlcnRpb25zOiBUU3BlY0RvY3VtZW50Wydhc3NlcnRpb25zJ10sIGRpYWdub3N0aWNzOiB2c2NvZGUuRGlhZ25vc3RpY1tdLCBzdHJpY3Q6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoIWFzc2VydGlvbnMpIHJldHVybjtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShhc3NlcnRpb25zKSkge1xuICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAnYXNzZXJ0aW9ucycsICdhc3NlcnRpb25zIG11c3QgYmUgYW4gYXJyYXknLCB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLCBkaWFnbm9zdGljcyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGFzc2VydGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmFkZERpYWdub3N0aWMoZG9jdW1lbnQsICdhc3NlcnRpb25zJywgJ05vIGFzc2VydGlvbnMgZGVmaW5lZCAtIHRlc3Qgd2lsbCBhbHdheXMgcGFzcycsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuV2FybmluZywgZGlhZ25vc3RpY3MpO1xuICAgIH1cblxuICAgIGFzc2VydGlvbnMuZm9yRWFjaCgoYXNzZXJ0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKCFhc3NlcnRpb24udHlwZSAmJiAhYXNzZXJ0aW9uLmluY2x1ZGUpIHtcbiAgICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAnYXNzZXJ0aW9ucycsIGBhc3NlcnRpb25zWyR7aW5kZXh9XTogbXVzdCBoYXZlIGVpdGhlciAndHlwZScgb3IgJ2luY2x1ZGUnYCwgdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvciwgZGlhZ25vc3RpY3MpO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXNzZXJ0aW9uLnR5cGUgJiYgIVZBTElEX0FTU0VSVElPTl9UWVBFUy5pbmNsdWRlcyhhc3NlcnRpb24udHlwZSkpIHtcbiAgICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAndHlwZScsIGBJbnZhbGlkIGFzc2VydGlvbiB0eXBlOiBcIiR7YXNzZXJ0aW9uLnR5cGV9XCIuIE11c3QgYmUgb25lIG9mOiAke1ZBTElEX0FTU0VSVElPTl9UWVBFUy5qb2luKCcsICcpfWAsIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3IsIGRpYWdub3N0aWNzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFzc2VydGlvbi5vcGVyYXRvciAmJiAhVkFMSURfT1BFUkFUT1JTLmluY2x1ZGVzKGFzc2VydGlvbi5vcGVyYXRvcikpIHtcbiAgICAgICAgdGhpcy5hZGREaWFnbm9zdGljKGRvY3VtZW50LCAnb3BlcmF0b3InLCBgSW52YWxpZCBvcGVyYXRvcjogXCIke2Fzc2VydGlvbi5vcGVyYXRvcn1cIi4gTXVzdCBiZSBvbmUgb2Y6ICR7VkFMSURfT1BFUkFUT1JTLmpvaW4oJywgJyl9YCwgdnNjb2RlLkRpYWdub3N0aWNTZXZlcml0eS5FcnJvciwgZGlhZ25vc3RpY3MpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZURhdGEoZG9jdW1lbnQ6IHZzY29kZS5UZXh0RG9jdW1lbnQsIGRhdGE6IFRTcGVjRG9jdW1lbnRbJ2RhdGEnXSwgZGlhZ25vc3RpY3M6IHZzY29kZS5EaWFnbm9zdGljW10pOiB2b2lkIHtcbiAgICBpZiAoIWRhdGEpIHJldHVybjtcblxuICAgIGlmIChkYXRhLmZvcm1hdCAmJiAhVkFMSURfREFUQV9GT1JNQVRTLmluY2x1ZGVzKGRhdGEuZm9ybWF0LnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICB0aGlzLmFkZERpYWdub3N0aWMoZG9jdW1lbnQsICdmb3JtYXQnLCBgSW52YWxpZCBkYXRhIGZvcm1hdDogXCIke2RhdGEuZm9ybWF0fVwiLiBNdXN0IGJlIG9uZSBvZjogJHtWQUxJRF9EQVRBX0ZPUk1BVFMuam9pbignLCAnKX1gLCB2c2NvZGUuRGlhZ25vc3RpY1NldmVyaXR5LkVycm9yLCBkaWFnbm9zdGljcyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZVJlcXVpcmVkRmllbGQoZG9jdW1lbnQ6IHZzY29kZS5UZXh0RG9jdW1lbnQsIHNwZWM6IFRTcGVjRG9jdW1lbnQsIGZpZWxkOiBzdHJpbmcsIGRpYWdub3N0aWNzOiB2c2NvZGUuRGlhZ25vc3RpY1tdKTogdm9pZCB7XG4gICAgaWYgKCEoZmllbGQgaW4gc3BlYykpIHtcbiAgICAgIGNvbnN0IGRpYWdub3N0aWMgPSBuZXcgdnNjb2RlLkRpYWdub3N0aWMoXG4gICAgICAgIG5ldyB2c2NvZGUuUmFuZ2UoMCwgMCwgMCwgMCksXG4gICAgICAgIGBNaXNzaW5nIHJlcXVpcmVkIGZpZWxkOiAke2ZpZWxkfWAsXG4gICAgICAgIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3JcbiAgICAgICk7XG4gICAgICBkaWFnbm9zdGljLnNvdXJjZSA9ICd0c3BlYyc7XG4gICAgICBkaWFnbm9zdGljcy5wdXNoKGRpYWdub3N0aWMpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkRGlhZ25vc3RpYyhkb2N1bWVudDogdnNjb2RlLlRleHREb2N1bWVudCwga2V5OiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgc2V2ZXJpdHk6IHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHksIGRpYWdub3N0aWNzOiB2c2NvZGUuRGlhZ25vc3RpY1tdKTogdm9pZCB7XG4gICAgY29uc3QgcG9zaXRpb24gPSBZYW1sSGVscGVyLmZpbmRLZXlQb3NpdGlvbihkb2N1bWVudCwga2V5KTtcbiAgICBjb25zdCByYW5nZSA9IHBvc2l0aW9uIFxuICAgICAgPyBuZXcgdnNjb2RlLlJhbmdlKHBvc2l0aW9uLCBwb3NpdGlvbi50cmFuc2xhdGUoMCwga2V5Lmxlbmd0aCkpXG4gICAgICA6IG5ldyB2c2NvZGUuUmFuZ2UoMCwgMCwgMCwgMCk7XG4gICAgXG4gICAgY29uc3QgZGlhZ25vc3RpYyA9IG5ldyB2c2NvZGUuRGlhZ25vc3RpYyhyYW5nZSwgbWVzc2FnZSwgc2V2ZXJpdHkpO1xuICAgIGRpYWdub3N0aWMuc291cmNlID0gJ3RzcGVjJztcbiAgICBkaWFnbm9zdGljcy5wdXNoKGRpYWdub3N0aWMpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVZYW1sRXJyb3JEaWFnbm9zdGljKGRvY3VtZW50OiB2c2NvZGUuVGV4dERvY3VtZW50LCBlcnJvcjogeWFtbC5ZQU1MRXhjZXB0aW9uKTogdnNjb2RlLkRpYWdub3N0aWMge1xuICAgIGxldCByYW5nZTogdnNjb2RlLlJhbmdlO1xuICAgIFxuICAgIGlmIChlcnJvci5tYXJrKSB7XG4gICAgICBjb25zdCBsaW5lID0gZXJyb3IubWFyay5saW5lIHx8IDA7XG4gICAgICBjb25zdCBjb2x1bW4gPSBlcnJvci5tYXJrLmNvbHVtbiB8fCAwO1xuICAgICAgcmFuZ2UgPSBuZXcgdnNjb2RlLlJhbmdlKGxpbmUsIGNvbHVtbiwgbGluZSwgY29sdW1uICsgMSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmdlID0gbmV3IHZzY29kZS5SYW5nZSgwLCAwLCAwLCAwKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgZGlhZ25vc3RpYyA9IG5ldyB2c2NvZGUuRGlhZ25vc3RpYyhcbiAgICAgIHJhbmdlLFxuICAgICAgYFlBTUwgc3ludGF4IGVycm9yOiAke2Vycm9yLm1lc3NhZ2V9YCxcbiAgICAgIHZzY29kZS5EaWFnbm9zdGljU2V2ZXJpdHkuRXJyb3JcbiAgICApO1xuICAgIGRpYWdub3N0aWMuc291cmNlID0gJ3RzcGVjJztcbiAgICByZXR1cm4gZGlhZ25vc3RpYztcbiAgfVxufVxuIiwiaW1wb3J0ICogYXMgdnNjb2RlIGZyb20gJ3ZzY29kZSc7XG5pbXBvcnQgeyBUU3BlY0NvbXBsZXRpb25Qcm92aWRlciB9IGZyb20gJy4vcHJvdmlkZXJzL2NvbXBsZXRpb25Qcm92aWRlcic7XG5pbXBvcnQgeyBUU3BlY0RpYWdub3N0aWNQcm92aWRlciB9IGZyb20gJy4vcHJvdmlkZXJzL2RpYWdub3N0aWNQcm92aWRlcic7XG5cbmxldCBkaWFnbm9zdGljUHJvdmlkZXI6IFRTcGVjRGlhZ25vc3RpY1Byb3ZpZGVyO1xuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUoY29udGV4dDogdnNjb2RlLkV4dGVuc2lvbkNvbnRleHQpOiB2b2lkIHtcbiAgY29uc29sZS5sb2coJ1RTcGVjIGV4dGVuc2lvbiBpcyBub3cgYWN0aXZlJyk7XG5cbiAgLy8gRGVmaW5lIGRvY3VtZW50IHNlbGVjdG9yIGZvciBUU3BlYyBmaWxlc1xuICBjb25zdCB0c3BlY1NlbGVjdG9yOiB2c2NvZGUuRG9jdW1lbnRTZWxlY3RvciA9IHsgXG4gICAgbGFuZ3VhZ2U6ICd0c3BlYycsIFxuICAgIHNjaGVtZTogJ2ZpbGUnIFxuICB9O1xuXG4gIC8vIEluaXRpYWxpemUgZGlhZ25vc3RpYyBwcm92aWRlclxuICBkaWFnbm9zdGljUHJvdmlkZXIgPSBuZXcgVFNwZWNEaWFnbm9zdGljUHJvdmlkZXIoKTtcbiAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goZGlhZ25vc3RpY1Byb3ZpZGVyKTtcblxuICAvLyBSZWdpc3RlciBjb21wbGV0aW9uIHByb3ZpZGVyXG4gIGNvbnN0IGNvbXBsZXRpb25Qcm92aWRlciA9IG5ldyBUU3BlY0NvbXBsZXRpb25Qcm92aWRlcigpO1xuICBjb250ZXh0LnN1YnNjcmlwdGlvbnMucHVzaChcbiAgICB2c2NvZGUubGFuZ3VhZ2VzLnJlZ2lzdGVyQ29tcGxldGlvbkl0ZW1Qcm92aWRlcihcbiAgICAgIHRzcGVjU2VsZWN0b3IsXG4gICAgICBjb21wbGV0aW9uUHJvdmlkZXIsXG4gICAgICAnOicsICckJywgJ3snLCAnLicgIC8vIFRyaWdnZXIgY2hhcmFjdGVyc1xuICAgIClcbiAgKTtcblxuICAvLyBWYWxpZGF0ZSBhbGwgb3BlbiBUU3BlYyBkb2N1bWVudHNcbiAgdnNjb2RlLndvcmtzcGFjZS50ZXh0RG9jdW1lbnRzLmZvckVhY2goZG9jdW1lbnQgPT4ge1xuICAgIGlmIChkb2N1bWVudC5sYW5ndWFnZUlkID09PSAndHNwZWMnKSB7XG4gICAgICBkaWFnbm9zdGljUHJvdmlkZXIudmFsaWRhdGVEb2N1bWVudChkb2N1bWVudCk7XG4gICAgfVxuICB9KTtcblxuICAvLyBWYWxpZGF0ZSBvbiBkb2N1bWVudCBvcGVuXG4gIGNvbnRleHQuc3Vic2NyaXB0aW9ucy5wdXNoKFxuICAgIHZzY29kZS53b3Jrc3BhY2Uub25EaWRPcGVuVGV4dERvY3VtZW50KGRvY3VtZW50ID0+IHtcbiAgICAgIGlmIChkb2N1bWVudC5sYW5ndWFnZUlkID09PSAndHNwZWMnKSB7XG4gICAgICAgIGRpYWdub3N0aWNQcm92aWRlci52YWxpZGF0ZURvY3VtZW50KGRvY3VtZW50KTtcbiAgICAgIH1cbiAgICB9KVxuICApO1xuXG4gIC8vIFZhbGlkYXRlIG9uIGRvY3VtZW50IGNoYW5nZSAoZGVib3VuY2VkKVxuICBjb250ZXh0LnN1YnNjcmlwdGlvbnMucHVzaChcbiAgICB2c2NvZGUud29ya3NwYWNlLm9uRGlkQ2hhbmdlVGV4dERvY3VtZW50KGV2ZW50ID0+IHtcbiAgICAgIGlmIChldmVudC5kb2N1bWVudC5sYW5ndWFnZUlkID09PSAndHNwZWMnKSB7XG4gICAgICAgIGRpYWdub3N0aWNQcm92aWRlci52YWxpZGF0ZURvY3VtZW50RGVib3VuY2VkKGV2ZW50LmRvY3VtZW50KTtcbiAgICAgIH1cbiAgICB9KVxuICApO1xuXG4gIC8vIFZhbGlkYXRlIG9uIGRvY3VtZW50IHNhdmVcbiAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goXG4gICAgdnNjb2RlLndvcmtzcGFjZS5vbkRpZFNhdmVUZXh0RG9jdW1lbnQoZG9jdW1lbnQgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50Lmxhbmd1YWdlSWQgPT09ICd0c3BlYycpIHtcbiAgICAgICAgZGlhZ25vc3RpY1Byb3ZpZGVyLnZhbGlkYXRlRG9jdW1lbnQoZG9jdW1lbnQpO1xuICAgICAgfVxuICAgIH0pXG4gICk7XG5cbiAgLy8gQ2xlYXIgZGlhZ25vc3RpY3Mgd2hlbiBkb2N1bWVudCBpcyBjbG9zZWRcbiAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goXG4gICAgdnNjb2RlLndvcmtzcGFjZS5vbkRpZENsb3NlVGV4dERvY3VtZW50KGRvY3VtZW50ID0+IHtcbiAgICAgIGlmIChkb2N1bWVudC5sYW5ndWFnZUlkID09PSAndHNwZWMnKSB7XG4gICAgICAgIC8vIERpYWdub3N0aWNzIGFyZSBhdXRvbWF0aWNhbGx5IGNsZWFyZWQgd2hlbiBkb2N1bWVudCBpcyBjbG9zZWRcbiAgICAgIH1cbiAgICB9KVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpOiB2b2lkIHtcbiAgY29uc29sZS5sb2coJ1RTcGVjIGV4dGVuc2lvbiBpcyBub3cgZGVhY3RpdmF0ZWQnKTtcbn1cbiJdLCJuYW1lcyI6WyJ0eXBlIiwidnNjb2RlIiwiZXhjZXB0aW9uIiwibWFwIiwic2NoZW1hIiwiZXh0ZW5kIiwieWFtbC5sb2FkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVPLE1BQU0sV0FBVztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSXRCLE9BQU8sV0FBVyxVQUErQixVQUF3QztBQUN2RixVQUFNLFdBQVcsU0FBUyxPQUFPLFNBQVMsSUFBSSxFQUFFO0FBQ2hELFVBQU0sYUFBYSxTQUFTLFVBQVUsR0FBRyxTQUFTLFNBQVM7QUFHM0QsVUFBTSxhQUFhLEtBQUssaUJBQWlCLFVBQVU7QUFHbkQsVUFBTSxrQkFBa0IsV0FBVyxTQUFTLEdBQUc7QUFHL0MsUUFBSTtBQUNKLFVBQU0sV0FBVyxTQUFTLE1BQU0sWUFBWTtBQUM1QyxRQUFJ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
