import * as vscode from 'vscode';

export interface YamlContext {
  type: 'top-level' | 'metadata' | 'http' | 'grpc' | 'graphql' | 'websocket' | 'environment' | 'assertions' | 'assertion-item' | 'data' | 'lifecycle' | 'output' | 'extract' | 'variables' | 'body' | 'unknown';
  keyPath: string[];
  isValuePosition: boolean;
  currentKey?: string;
  inVariable: boolean;
}

export class YamlHelper {
  /**
   * Get the YAML context at the current cursor position
   */
  static getContext(document: vscode.TextDocument, position: vscode.Position): YamlContext {
    const lineText = document.lineAt(position.line).text;
    const linePrefix = lineText.substring(0, position.character);
    
    // Check if inside variable interpolation
    const inVariable = this.isInsideVariable(linePrefix);
    
    // Check if in value position (after colon)
    const isValuePosition = linePrefix.includes(':');
    
    // Get current key if in value position
    let currentKey: string | undefined;
    const keyMatch = lineText.match(/^\s*(\w+):/);
    if (keyMatch) {
      currentKey = keyMatch[1];
    }
    
    // Build key path
    const keyPath = this.getKeyPath(document, position);
    
    // Determine context type
    const type = this.determineContextType(keyPath, position, document);
    
    return {
      type,
      keyPath,
      isValuePosition,
      currentKey,
      inVariable,
    };
  }

  /**
   * Check if cursor is inside a variable interpolation ${...}
   */
  static isInsideVariable(linePrefix: string): boolean {
    const lastOpen = linePrefix.lastIndexOf('${');
    if (lastOpen === -1) return false;
    const lastClose = linePrefix.lastIndexOf('}', linePrefix.length);
    return lastClose < lastOpen;
  }

  /**
   * Get the key path from root to current position
   */
  static getKeyPath(document: vscode.TextDocument, position: vscode.Position): string[] {
    const path: string[] = [];
    const currentIndent = this.getIndentLevel(document.lineAt(position.line).text);
    
    // Walk backwards through lines
    for (let i = position.line; i >= 0; i--) {
      const line = document.lineAt(i).text;
      const indent = this.getIndentLevel(line);
      
      // Skip empty lines and comments
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      
      // Check for key at this or lower indent level
      const keyMatch = line.match(/^(\s*)(\w+):/);
      if (keyMatch) {
        const keyIndent = keyMatch[1].length;
        
        // If this key is at a lower indent level than our current context
        if (keyIndent < currentIndent || (i === position.line && keyIndent <= currentIndent)) {
          // Only add if it's a parent (lower indent) or same line
          if (path.length === 0 || keyIndent < this.getIndentLevel(document.lineAt(path.length > 0 ? position.line : i).text)) {
            path.unshift(keyMatch[2]);
          }
        }
        
        // If we've reached root level, stop
        if (keyIndent === 0) break;
      }
    }
    
    return path;
  }

  /**
   * Get indentation level of a line
   */
  static getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  /**
   * Determine the context type based on key path
   */
  static determineContextType(keyPath: string[], position: vscode.Position, document: vscode.TextDocument): YamlContext['type'] {
    if (keyPath.length === 0) return 'top-level';
    
    const root = keyPath[0];
    
    switch (root) {
      case 'metadata': return 'metadata';
      case 'http': return keyPath.includes('body') ? 'body' : 'http';
      case 'grpc': return 'grpc';
      case 'graphql': return 'graphql';
      case 'websocket': return 'websocket';
      case 'environment': return 'environment';
      case 'assertions': return keyPath.length > 1 ? 'assertion-item' : 'assertions';
      case 'data': return 'data';
      case 'lifecycle': return 'lifecycle';
      case 'output': return 'output';
      case 'extract': return 'extract';
      case 'variables': return 'variables';
      default: return 'unknown';
    }
  }

  /**
   * Find the position of a key in the document
   */
  static findKeyPosition(document: vscode.TextDocument, key: string): vscode.Position | null {
    const text = document.getText();
    const regex = new RegExp(`^\\s*${key}:`, 'm');
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
  static getDefinedVariables(document: vscode.TextDocument): string[] {
    const text = document.getText();
    const variables: string[] = [];
    
    // Find variables section
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
  static getExtractedVariables(document: vscode.TextDocument): string[] {
    const text = document.getText();
    const variables: string[] = [];
    
    // Find extract section
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
