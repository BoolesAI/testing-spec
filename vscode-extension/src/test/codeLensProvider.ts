import * as vscode from 'vscode';
import { TSpecTestProvider } from './testProvider';

/**
 * Provides CodeLens "Run Test" buttons in .tspec files
 */
export class TSpecCodeLensProvider implements vscode.CodeLensProvider {
  private testProvider: TSpecTestProvider;
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(testProvider: TSpecTestProvider) {
    this.testProvider = testProvider;
  }

  /**
   * Provide CodeLens for .tspec files
   */
  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    if (document.languageId !== 'tspec') {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    // Find the version line (usually first meaningful line)
    const text = document.getText();
    const versionMatch = text.match(/^version:\s*/m);

    if (versionMatch) {
      const startPos = document.positionAt(versionMatch.index || 0);
      const range = new vscode.Range(startPos, startPos);

      // Run Test CodeLens
      const runLens = new vscode.CodeLens(range, {
        title: '$(play) Run Test',
        command: 'tspec.runTestFromCodeLens',
        arguments: [document.uri],
        tooltip: 'Run this TSpec test',
      });
      codeLenses.push(runLens);

      // Show in Test Explorer CodeLens
      const showLens = new vscode.CodeLens(range, {
        title: '$(beaker) Show in Test Explorer',
        command: 'tspec.showInTestExplorer',
        arguments: [document.uri],
        tooltip: 'Show this test in Test Explorer',
      });
      codeLenses.push(showLens);
    }

    return codeLenses;
  }

  /**
   * Refresh CodeLenses
   */
  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}

/**
 * Register CodeLens provider and related commands
 */
export function registerCodeLens(
  context: vscode.ExtensionContext,
  testProvider: TSpecTestProvider
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Create CodeLens provider
  const codeLensProvider = new TSpecCodeLensProvider(testProvider);

  // Register CodeLens provider for tspec files
  disposables.push(
    vscode.languages.registerCodeLensProvider(
      { language: 'tspec', scheme: 'file' },
      codeLensProvider
    )
  );

  // Register run command
  disposables.push(
    vscode.commands.registerCommand(
      'tspec.runTestFromCodeLens',
      async (uri: vscode.Uri) => {
        // Get the test item for this file
        const testItemManager = testProvider.getTestItemManager();
        let testItem = testItemManager.getByFilePath(uri.fsPath);
        
        if (!testItem) {
          // Try to discover the test first
          await testProvider.discoverTestsInFile(uri);
          testItem = testItemManager.getByFilePath(uri.fsPath);
          
          if (!testItem) {
            vscode.window.showErrorMessage('Could not find test in file');
            return;
          }
        }
        
        // Show test results panel first
        await vscode.commands.executeCommand('testing.showMostRecentOutput');
        
        // Create a test run request and execute it through the run profile
        const request = new vscode.TestRunRequest([testItem]);
        const runProfile = testProvider.getRunProfile();
        const tokenSource = new vscode.CancellationTokenSource();
        
        try {
          await runProfile.runHandler(request, tokenSource.token);
        } finally {
          tokenSource.dispose();
        }
      }
    )
  );

  // Register show in test explorer command
  disposables.push(
    vscode.commands.registerCommand(
      'tspec.showInTestExplorer',
      async (uri: vscode.Uri) => {
        const testItemManager = testProvider.getTestItemManager();
        const testItem = testItemManager.getByFilePath(uri.fsPath);

        if (testItem) {
          // Focus test explorer and reveal the item
          await vscode.commands.executeCommand('workbench.view.testing.focus');
          await vscode.commands.executeCommand(
            'vscode.revealTestInExplorer',
            testItem
          );
        } else {
          // Try to discover and then show
          await testProvider.discoverTestsInFile(uri);
          const newItem = testItemManager.getByFilePath(uri.fsPath);
          if (newItem) {
            await vscode.commands.executeCommand('workbench.view.testing.focus');
            await vscode.commands.executeCommand(
              'vscode.revealTestInExplorer',
              newItem
            );
          }
        }
      }
    )
  );

  // Register refresh command
  disposables.push(
    vscode.commands.registerCommand('tspec.refreshTests', async () => {
      await testProvider.refresh();
      codeLensProvider.refresh();
    })
  );

  return disposables;
}
