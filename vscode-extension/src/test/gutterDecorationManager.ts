import * as vscode from 'vscode';
import { TestResultStore } from './testResultStore';
import { TestItemManager } from './testItemManager';

/**
 * Manages gutter decorations for test status indicators
 */
export class GutterDecorationManager implements vscode.Disposable {
  private resultStore: TestResultStore;
  private testItemManager: TestItemManager;
  private disposables: vscode.Disposable[] = [];
  
  private passDecoration: vscode.TextEditorDecorationType;
  private failDecoration: vscode.TextEditorDecorationType;
  private unknownDecoration: vscode.TextEditorDecorationType;
  
  private updateDebounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private static readonly DEBOUNCE_MS = 500;

  constructor(
    resultStore: TestResultStore,
    testItemManager: TestItemManager,
    context: vscode.ExtensionContext
  ) {
    this.resultStore = resultStore;
    this.testItemManager = testItemManager;
    
    // Create decoration types with gutter icons
    this.passDecoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: context.asAbsolutePath('resources/pass.svg'),
      gutterIconSize: 'contain',
    });
    
    this.failDecoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: context.asAbsolutePath('resources/fail.svg'),
      gutterIconSize: 'contain',
    });
    
    this.unknownDecoration = vscode.window.createTextEditorDecorationType({
      gutterIconPath: context.asAbsolutePath('resources/unknown.svg'),
      gutterIconSize: 'contain',
    });
    
    // Listen to result changes
    this.disposables.push(
      this.resultStore.onResultChanged((filePath) => {
        this.updateDecorationsForFile(filePath);
      })
    );
    
    // Listen to visible editors changes
    this.disposables.push(
      vscode.window.onDidChangeVisibleTextEditors(() => {
        this.updateAllVisibleDecorations();
      })
    );
    
    // Listen to active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.isTspecFile(editor.document)) {
          this.updateDecorationForEditor(editor);
        }
      })
    );
    
    // Listen to document changes (debounced)
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (this.isTspecFile(event.document)) {
          this.debouncedUpdateForDocument(event.document);
        }
      })
    );
    
    // Listen to document open
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        if (this.isTspecFile(document)) {
          const editor = vscode.window.visibleTextEditors.find(
            (e) => e.document === document
          );
          if (editor) {
            this.updateDecorationForEditor(editor);
          }
        }
      })
    );
    
    // Initial update for all visible editors
    this.updateAllVisibleDecorations();
  }

  /**
   * Check if a document is a .tspec file
   */
  private isTspecFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'tspec' || document.fileName.endsWith('.tspec');
  }

  /**
   * Update decorations for all visible .tspec editors
   */
  updateAllVisibleDecorations(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      if (this.isTspecFile(editor.document)) {
        this.updateDecorationForEditor(editor);
      }
    }
  }

  /**
   * Update decorations for a specific file path
   */
  private updateDecorationsForFile(filePath: string): void {
    console.log('[TSpec] updateDecorationsForFile:', filePath);
    const editor = vscode.window.visibleTextEditors.find(
      (e) => e.document.uri.fsPath === filePath
    );
    if (editor) {
      this.updateDecorationForEditor(editor);
    } else {
      console.log('[TSpec] No visible editor for file:', filePath);
    }
  }

  /**
   * Debounced update for document changes
   */
  private debouncedUpdateForDocument(document: vscode.TextDocument): void {
    const filePath = document.uri.fsPath;
    
    // Clear existing timer
    const existingTimer = this.updateDebounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Clear decorations immediately during typing
    const editor = vscode.window.visibleTextEditors.find(
      (e) => e.document.uri.fsPath === filePath
    );
    if (editor) {
      this.clearDecorations(editor);
    }
    
    // Set new debounced update - re-find editor in callback
    const timer = setTimeout(() => {
      this.updateDebounceTimers.delete(filePath);
      const currentEditor = vscode.window.visibleTextEditors.find(
        (e) => e.document.uri.fsPath === filePath
      );
      if (currentEditor) {
        this.updateDecorationForEditor(currentEditor);
      }
    }, GutterDecorationManager.DEBOUNCE_MS);
    
    this.updateDebounceTimers.set(filePath, timer);
  }

  /**
   * Update decoration for a specific editor
   */
  private updateDecorationForEditor(editor: vscode.TextEditor): void {
    const config = vscode.workspace.getConfiguration('tspec.testing');
    if (!config.get('showGutterIcons', true)) {
      this.clearDecorations(editor);
      return;
    }
    
    const filePath = editor.document.uri.fsPath;
    const result = this.resultStore.getResult(filePath);
    const lineNumber = this.findFirstLine(editor.document);
    const range = new vscode.Range(lineNumber, 0, lineNumber, 0);
    
    console.log('[TSpec] updateDecorationForEditor:', { filePath, hasResult: !!result, passed: result?.passed, line: lineNumber });
    
    // Clear all decorations first
    this.clearDecorations(editor);
    
    // Apply appropriate decoration
    if (result) {
      if (result.passed) {
        console.log('[TSpec] Applying PASS decoration');
        editor.setDecorations(this.passDecoration, [range]);
      } else {
        console.log('[TSpec] Applying FAIL decoration');
        editor.setDecorations(this.failDecoration, [range]);
      }
    } else {
      // Check if this file has a test item (discovered test)
      const testItem = this.testItemManager.getByFilePath(filePath);
      if (testItem) {
        console.log('[TSpec] Applying UNKNOWN decoration (no result found)');
        editor.setDecorations(this.unknownDecoration, [range]);
      }
    }
  }

  /**
   * Clear all decorations from an editor
   */
  private clearDecorations(editor: vscode.TextEditor): void {
    editor.setDecorations(this.passDecoration, []);
    editor.setDecorations(this.failDecoration, []);
    editor.setDecorations(this.unknownDecoration, []);
  }

  /**
   * Find the first line of the test (version: line)
   */
  private findFirstLine(document: vscode.TextDocument): number {
    const text = document.getText();
    const versionMatch = text.match(/^version:\s*/m);
    
    if (versionMatch && versionMatch.index !== undefined) {
      return document.positionAt(versionMatch.index).line;
    }
    
    // Fallback to first line
    return 0;
  }

  dispose(): void {
    // Clear all debounce timers
    for (const timer of this.updateDebounceTimers.values()) {
      clearTimeout(timer);
    }
    this.updateDebounceTimers.clear();
    
    // Dispose decoration types
    this.passDecoration.dispose();
    this.failDecoration.dispose();
    this.unknownDecoration.dispose();
    
    // Dispose other disposables
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
