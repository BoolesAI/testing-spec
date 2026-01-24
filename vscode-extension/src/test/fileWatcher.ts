import * as vscode from 'vscode';

export type FileWatcherEvent = 'created' | 'changed' | 'deleted';

export interface FileWatcherHandler {
  (uri: vscode.Uri, event: FileWatcherEvent): void;
}

/**
 * File system watcher for .tspec files with debouncing
 */
export class TSpecFileWatcher implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher;
  private handlers: FileWatcherHandler[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debounceDelay = 300; // ms

  constructor() {
    // Watch for all .tspec files in workspace
    this.watcher = vscode.workspace.createFileSystemWatcher('**/*.tspec');
    
    this.watcher.onDidCreate((uri) => this.handleEvent(uri, 'created'));
    this.watcher.onDidChange((uri) => this.handleEvent(uri, 'changed'));
    this.watcher.onDidDelete((uri) => this.handleEvent(uri, 'deleted'));
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
    this.watcher.dispose();
    this.handlers = [];
  }
}
