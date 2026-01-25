import * as vscode from 'vscode';
import { StoredTestResult } from './types';

const STORAGE_KEY = 'tspec.testResults.v1';
const MAX_RESULTS = 1000;

/**
 * Stores and persists test results for gutter decorations
 */
export class TestResultStore implements vscode.Disposable {
  private results: Map<string, StoredTestResult> = new Map();
  private context: vscode.ExtensionContext;
  private _onResultChanged = new vscode.EventEmitter<string>();
  public readonly onResultChanged = this._onResultChanged.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadFromStorage();
  }

  /**
   * Get result for a file path
   */
  getResult(filePath: string): StoredTestResult | undefined {
    const result = this.results.get(filePath);
    console.log('[TSpec] getResult:', { filePath, found: !!result, allKeys: [...this.results.keys()] });
    return result;
  }

  /**
   * Set result for a file path
   */
  setResult(filePath: string, result: Omit<StoredTestResult, 'filePath'>): void {
    const stored: StoredTestResult = {
      ...result,
      filePath,
    };
    console.log('[TSpec] setResult:', { filePath, passed: result.passed });
    this.results.set(filePath, stored);
    this.saveToStorage();
    this._onResultChanged.fire(filePath);
  }

  /**
   * Check if a result exists for a file path
   */
  hasResult(filePath: string): boolean {
    return this.results.has(filePath);
  }

  /**
   * Clear result for a file path
   */
  clearResult(filePath: string): void {
    if (this.results.delete(filePath)) {
      this.saveToStorage();
      this._onResultChanged.fire(filePath);
    }
  }

  /**
   * Clear all results
   */
  clearAll(): void {
    const filePaths = [...this.results.keys()];
    this.results.clear();
    this.saveToStorage();
    for (const filePath of filePaths) {
      this._onResultChanged.fire(filePath);
    }
  }

  /**
   * Get all stored results
   */
  getAllResults(): StoredTestResult[] {
    return [...this.results.values()];
  }

  /**
   * Load results from workspace state
   */
  private loadFromStorage(): void {
    const stored = this.context.workspaceState.get<StoredTestResult[]>(STORAGE_KEY, []);
    this.results.clear();
    for (const result of stored) {
      this.results.set(result.filePath, result);
    }
  }

  /**
   * Save results to workspace state
   */
  private saveToStorage(): void {
    let results = [...this.results.values()];
    
    // Prune old results if exceeding max
    if (results.length > MAX_RESULTS) {
      results.sort((a, b) => b.timestamp - a.timestamp);
      results = results.slice(0, MAX_RESULTS);
      
      // Update in-memory map
      this.results.clear();
      for (const result of results) {
        this.results.set(result.filePath, result);
      }
    }
    
    this.context.workspaceState.update(STORAGE_KEY, results);
  }

  dispose(): void {
    this._onResultChanged.dispose();
  }
}
