import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { TSpecTestMetadata, TSpecAssertion, SuiteTestReference } from './types';

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
   * Parse .tcase or .tsuite content and extract metadata
   */
  parseContent(content: string, uri: vscode.Uri): TSpecTestMetadata | null {
    try {
      const doc = yaml.load(content) as Record<string, unknown>;
      
      if (!doc || typeof doc !== 'object') {
        return null;
      }

      const isSuiteFile = uri.fsPath.endsWith('.tsuite');
      
      // Handle .tsuite file format (has 'suite' root key)
      if (isSuiteFile || doc.suite) {
        return this.parseSuiteContent(doc, uri);
      }

      // Handle .tcase file format
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
   * Parse .tsuite file content
   */
  private parseSuiteContent(doc: Record<string, unknown>, uri: vscode.Uri): TSpecTestMetadata | null {
    const suite = (doc.suite as Record<string, unknown>) || doc;
    
    const testCaseId = this.generateTestId(uri.fsPath);
    const description = (suite.description as string) || (suite.name as string) || path.basename(uri.fsPath, '.tsuite');
    
    // Extract metadata section
    const metadata = suite.metadata as Record<string, unknown> | undefined;
    const category = metadata?.test_category as string | undefined;
    const priority = metadata?.priority as string | undefined;
    const tags = metadata?.tags as string[] | undefined;
    const timeout = (suite.execution as Record<string, unknown>)?.timeout as string | undefined;

    // Extract test references
    const suiteTestRefs = this.extractSuiteTestRefs(suite);

    return {
      testCaseId,
      description,
      category,
      priority,
      tags,
      timeout,
      assertions: [], // Suites don't have direct assertions
      suiteTestRefs,
    };
  }

  /**
   * Extract test references from suite.tests array
   */
  private extractSuiteTestRefs(suite: Record<string, unknown>): SuiteTestReference[] {
    const tests = suite.tests as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(tests)) {
      return [];
    }

    return tests
      .map(t => ({
        file: t.file as string | undefined,
        files: t.files as string | undefined,
        skip: t.skip as boolean | undefined,
      }))
      .filter(t => t.file || t.files);
  }

  /**
   * Resolve suite test references to absolute file URIs
   */
  async resolveSuiteTestFiles(
    suiteUri: vscode.Uri,
    refs: SuiteTestReference[]
  ): Promise<vscode.Uri[]> {
    const baseDir = path.dirname(suiteUri.fsPath);
    const resolved: vscode.Uri[] = [];

    for (const ref of refs) {
      if (ref.skip) continue;

      if (ref.file) {
        // Single file - resolve relative to suite directory
        const filePath = path.resolve(baseDir, ref.file);
        resolved.push(vscode.Uri.file(filePath));
      } else if (ref.files) {
        // Glob pattern - find matching files
        const pattern = new vscode.RelativePattern(baseDir, ref.files);
        const matches = await vscode.workspace.findFiles(pattern);
        resolved.push(...matches);
      }
    }

    // Deduplicate by file path
    const uniqueMap = new Map<string, vscode.Uri>();
    for (const uri of resolved) {
      uniqueMap.set(uri.fsPath, uri);
    }
    return Array.from(uniqueMap.values());
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
            .replace(/\.(http|grpc|graphql|ws)?\.(tcase|tsuite)$/, '')
            .replace(/\\/g, '/');
        }
      }
    }
    
    // Fallback to filename without extension
    return path.basename(filePath)
      .replace(/\.(http|grpc|graphql|ws)?\.(tcase|tsuite)$/, '');
  }

  /**
   * Get all .tcase and .tsuite files in workspace
   */
  async findAllTestFiles(): Promise<vscode.Uri[]> {
    const tcaseFiles = await vscode.workspace.findFiles('**/*.tcase', '**/node_modules/**');
    const tsuiteFiles = await vscode.workspace.findFiles('**/*.tsuite', '**/node_modules/**');
    return [...tcaseFiles, ...tsuiteFiles];
  }
}
