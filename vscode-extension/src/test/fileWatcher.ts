import * as vscode from 'vscode';

export type FileWatcherEvent = 'created' | 'changed' | 'deleted';

export interface FileWatcherHandler {
  (uri: vscode.Uri, event: FileWatcherEvent): void;
}

/**
 * File system watcher for .tcase and .tsuite files with debouncing
 */
export class TSpecFileWatcher implements vscode.Disposable {
  private tcaseWatcher: vscode.FileSystemWatcher;
  private tsuiteWatcher: vscode.FileSystemWatcher;
  private handlers: FileWatcherHandler[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debounceDelay = 300; // ms

  constructor() {
    // Watch for all .tcase and .tsuite files in workspace
    this.tcaseWatcher = vscode.workspace.createFileSystemWatcher('**/*.tcase');
    this.tsuiteWatcher = vscode.workspace.createFileSystemWatcher('**/*.tsuite');
    
    this.tcaseWatcher.onDidCreate((uri) => this.handleEvent(uri, 'created'));
    this.tcaseWatcher.onDidChange((uri) => this.handleEvent(uri, 'changed'));
    this.tcaseWatcher.onDidDelete((uri) => this.handleEvent(uri, 'deleted'));
    
    this.tsuiteWatcher.onDidCreate((uri) => this.handleEvent(uri, 'created'));
    this.tsuiteWatcher.onDidChange((uri) => this.handleEvent(uri, 'changed'));
    this.tsuiteWatcher.onDidDelete((uri) => this.handleEvent(uri, 'deleted'));
  }

  /**
   * Register a handler for file events
   */
  onFileEvent(handler: FileWatcherHandler): vscode.Disposable {
    this.handlers.push(handler);
    return {
      dispose: () => {
        const index = this.handlers.indexOf(handler);
        if (index > -1) {
          this.handlers.splice(index, 1);
        }
      },
    };
  }

  /**
   * Handle file event with debouncing
   */
  private handleEvent(uri: vscode.Uri, event: FileWatcherEvent): void {
    const key = `${uri.fsPath}:${event}`;
    
    // Clear existing timer for this file/event
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.notifyHandlers(uri, event);
    }, this.debounceDelay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Notify all registered handlers
   */
  private notifyHandlers(uri: vscode.Uri, event: FileWatcherEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(uri, event);
      } catch (error) {
        console.error('File watcher handler error:', error);
      }
    }
  }

  /**
   * Set debounce delay in milliseconds
   */
  setDebounceDelay(ms: number): void {
    this.debounceDelay = ms;
  }

  /**
   * Clear all pending debounce timers
   */
  clearPendingTimers(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  dispose(): void {
    this.clearPendingTimers();
    this.tcaseWatcher.dispose();
    this.tsuiteWatcher.dispose();
    this.handlers = [];
  }
}
