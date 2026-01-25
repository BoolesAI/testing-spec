import * as vscode from 'vscode';
import { CLIAdapter } from './cliAdapter';
import { TestParser } from './testParser';
import { TSpecFileWatcher } from './fileWatcher';
import { TestItemManager } from './testItemManager';
import { TestRunner } from './testRunner';
import { TestResultStore } from './testResultStore';
import { GutterDecorationManager } from './gutterDecorationManager';

/**
 * Main test provider that coordinates test discovery and execution
 */
export class TSpecTestProvider implements vscode.Disposable {
  private controller: vscode.TestController;
  private cliAdapter: CLIAdapter;
  private testParser: TestParser;
  private fileWatcher: TSpecFileWatcher;
  private testItemManager: TestItemManager;
  private testRunner: TestRunner;
  private testResultStore: TestResultStore;
  private gutterDecorationManager: GutterDecorationManager;
  private runProfile: vscode.TestRunProfile;
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    // Create test controller
    this.controller = vscode.tests.createTestController('tspecTests', 'TSpec Tests');
    this.disposables.push(this.controller);

    // Initialize components
    this.cliAdapter = new CLIAdapter();
    this.testParser = new TestParser();
    this.fileWatcher = new TSpecFileWatcher();
    this.testItemManager = new TestItemManager(this.controller);
    this.testResultStore = new TestResultStore(context);
    this.testRunner = new TestRunner(this.cliAdapter, this.testItemManager, this.testResultStore);
    this.gutterDecorationManager = new GutterDecorationManager(
      this.testResultStore,
      this.testItemManager,
      context
    );
    this.disposables.push(this.testResultStore);
    this.disposables.push(this.gutterDecorationManager);

    // Set up resolve handler for lazy loading
    this.controller.resolveHandler = async (item) => {
      if (!item) {
        // Root level - discover all tests
        await this.discoverAllTests();
      }
    };

    // Create run profile
    this.runProfile = this.controller.createRunProfile(
      'Run Tests',
      vscode.TestRunProfileKind.Run,
      async (request, token) => {
        await this.testRunner.runTests(request, this.controller, token);
        // Force update decorations after test run completes
        this.gutterDecorationManager.updateAllVisibleDecorations();
      },
      true // isDefault
    );
    this.disposables.push(this.runProfile);

    // Set up file watcher
    const config = this.cliAdapter.getConfig();
    if (config.watchMode) {
      this.setupFileWatcher();
    }

    // Listen for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('tspec.testing')) {
          this.handleConfigChange();
        }
      })
    );

    // Initial discovery
    this.discoverAllTests();
  }

  /**
   * Discover all .tspec test files in workspace
   */
  async discoverAllTests(): Promise<void> {
    const files = await this.testParser.findAllTestFiles();
    
    for (const uri of files) {
      await this.discoverTestsInFile(uri);
    }
  }

  /**
   * Discover tests in a single file
   */
  async discoverTestsInFile(uri: vscode.Uri): Promise<void> {
    const metadata = await this.testParser.parseFile(uri);
    
    if (metadata) {
      this.testItemManager.createOrUpdateTestItem(uri, metadata);
    }
  }

  /**
   * Remove tests for a file
   */
  removeTestsForFile(uri: vscode.Uri): void {
    this.testItemManager.removeTestItem(uri.fsPath);
  }

  /**
   * Set up file watcher for automatic refresh
   */
  private setupFileWatcher(): void {
    this.disposables.push(
      this.fileWatcher.onFileEvent(async (uri, event) => {
        switch (event) {
          case 'created':
          case 'changed':
            await this.discoverTestsInFile(uri);
            break;
          case 'deleted':
            this.removeTestsForFile(uri);
            break;
        }
      })
    );
    this.disposables.push(this.fileWatcher);
  }

  /**
   * Handle configuration changes
   */
  private handleConfigChange(): void {
    const config = this.cliAdapter.getConfig();
    
    if (!config.enabled) {
      // Clear all tests if disabled
      this.testItemManager.clear();
    } else {
      // Re-discover tests
      this.discoverAllTests();
    }
  }

  /**
   * Run a single test file (called from CodeLens)
   */
  async runTestFile(uri: vscode.Uri): Promise<void> {
    const testItem = this.testItemManager.getByFilePath(uri.fsPath);
    
    if (!testItem) {
      // Try to discover the test first
      await this.discoverTestsInFile(uri);
      const newItem = this.testItemManager.getByFilePath(uri.fsPath);
      
      if (!newItem) {
        vscode.window.showErrorMessage('Could not find test in file');
        return;
      }
      
      await this.runTestItems([newItem]);
    } else {
      await this.runTestItems([testItem]);
    }
  }

  /**
   * Run specific test items
   */
  private async runTestItems(items: vscode.TestItem[]): Promise<void> {
    const request = new vscode.TestRunRequest(items);
    const tokenSource = new vscode.CancellationTokenSource();
    
    try {
      await this.testRunner.runTests(request, this.controller, tokenSource.token);
      // Force update decorations after test run completes
      this.gutterDecorationManager.updateAllVisibleDecorations();
    } finally {
      tokenSource.dispose();
    }
  }

  /**
   * Refresh all tests
   */
  async refresh(): Promise<void> {
    this.testItemManager.clear();
    await this.discoverAllTests();
  }

  /**
   * Get the test controller
   */
  getController(): vscode.TestController {
    return this.controller;
  }

  /**
   * Get the test item manager
   */
  getTestItemManager(): TestItemManager {
    return this.testItemManager;
  }

  /**
   * Get the run profile
   */
  getRunProfile(): vscode.TestRunProfile {
    return this.runProfile;
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.cliAdapter.dispose();
  }
}
