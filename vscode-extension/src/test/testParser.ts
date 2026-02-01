import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { TSpecTestMetadata, TSpecAssertion } from './types';

/**
 * Parser for extracting test metadata from .tcase files
 */
export class TestParser {
  /**
   * Parse a .tcase file and extract test metadata
   */
  async parseFile(uri: vscode.Uri): Promise<TSpecTestMetadata | null> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const text = Buffer.from(content).toString('utf-8');
      return this.parseContent(text, uri);
    } catch (error) {
      console.error(`Failed to parse ${uri.fsPath}:`, error);
      return null;
    }
  }

  /**
   * Parse .tcase content and extract metadata
   */
  parseContent(content: string, uri: vscode.Uri): TSpecTestMetadata | null {
    try {
      const doc = yaml.load(content) as Record<string, unknown>;
      
      if (!doc || typeof doc !== 'object') {
        return null;
      }

      const testCaseId = this.generateTestId(uri.fsPath);
      const description = (doc.description as string) || path.basename(uri.fsPath, '.tcase');
      
      // Extract metadata section
      const metadata = doc.metadata as Record<string, unknown> | undefined;
      const category = metadata?.test_category as string | undefined;
      const priority = metadata?.priority as string | undefined;
      const tags = metadata?.tags as string[] | undefined;
      const timeout = metadata?.timeout as string | undefined;

      // Extract assertions
      const assertions = this.parseAssertions(doc.assertions);

      return {
        testCaseId,
        description,
        category,
        priority,
        tags,
        timeout,
        assertions,
      };
    } catch (error) {
      console.error(`YAML parse error for ${uri.fsPath}:`, error);
      return null;
    }
  }

  /**
   * Parse assertions array from document
   */
  private parseAssertions(assertionsRaw: unknown): TSpecAssertion[] {
    if (!Array.isArray(assertionsRaw)) {
      return [];
    }

    return assertionsRaw.map((assertion, index) => {
      if (typeof assertion !== 'object' || assertion === null) {
        return {
          type: 'unknown',
          message: `Assertion ${index + 1}`,
        };
      }

      const a = assertion as Record<string, unknown>;
      return {
        type: (a.type as string) || 'unknown',
        expression: a.expression as string | undefined,
        operator: a.operator as string | undefined,
        expected: a.expected,
        message: this.buildAssertionLabel(a),
      };
    });
  }

  /**
   * Build a human-readable label for an assertion
   */
  private buildAssertionLabel(assertion: Record<string, unknown>): string {
    const type = assertion.type as string;
    
    switch (type) {
      case 'status_code':
        return `Status code is ${assertion.expected || '?'}`;
      
      case 'json_path': {
        const expr = assertion.expression || '?';
        const op = assertion.operator || 'exists';
        const expected = assertion.expected;
        if (op === 'exists') {
          return `${expr} exists`;
        }
        return `${expr} ${op} ${expected !== undefined ? JSON.stringify(expected) : ''}`.trim();
      }
      
      case 'header': {
        const headerName = assertion.name || assertion.expression || '?';
        const op = assertion.operator || 'exists';
        const expected = assertion.expected;
        if (op === 'exists') {
          return `Header ${headerName} exists`;
        }
        return `Header ${headerName} ${op} ${expected !== undefined ? JSON.stringify(expected) : ''}`.trim();
      }
      
      case 'response_time':
        return `Response time < ${assertion.expected || '?'}ms`;
      
      case 'javascript':
        return 'Custom JavaScript validation';
      
      default:
        return `${type} assertion`;
    }
  }

  /**
   * Generate a unique test ID from file path
   */
  generateTestId(filePath: string): string {
    // Use relative path from workspace as ID
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      for (const folder of workspaceFolders) {
        if (filePath.startsWith(folder.uri.fsPath)) {
          const relativePath = path.relative(folder.uri.fsPath, filePath);
          // Remove extension and normalize path separators
          return relativePath
            .replace(/\.(http|grpc|graphql|ws)?\.tcase$/, '')
            .replace(/\\/g, '/');
        }
      }
    }
    
    // Fallback to filename without extension
    return path.basename(filePath, '.tcase').replace(/\.(http|grpc|graphql|ws)$/, '');
  }

  /**
   * Get all .tcase files in workspace
   */
  async findAllTestFiles(): Promise<vscode.Uri[]> {
    return vscode.workspace.findFiles('**/*.tcase', '**/node_modules/**');
  }
}
