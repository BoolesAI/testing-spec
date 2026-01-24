import * as vscode from 'vscode';
import { TSpecCompletionProvider } from './providers/completionProvider';
import { TSpecDiagnosticProvider } from './providers/diagnosticProvider';

let diagnosticProvider: TSpecDiagnosticProvider;

export function activate(context: vscode.ExtensionContext): void {
  console.log('TSpec extension is now active');

  // Define document selector for TSpec files
  const tspecSelector: vscode.DocumentSelector = { 
    language: 'tspec', 
    scheme: 'file' 
  };

  // Initialize diagnostic provider
  diagnosticProvider = new TSpecDiagnosticProvider();
  context.subscriptions.push(diagnosticProvider);

  // Register completion provider
  const completionProvider = new TSpecCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      tspecSelector,
      completionProvider,
      ':', '$', '{', '.'  // Trigger characters
    )
  );

  // Validate all open TSpec documents
  vscode.workspace.textDocuments.forEach(document => {
    if (document.languageId === 'tspec') {
      diagnosticProvider.validateDocument(document);
    }
  });

  // Validate on document open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(document => {
      if (document.languageId === 'tspec') {
        diagnosticProvider.validateDocument(document);
      }
    })
  );

  // Validate on document change (debounced)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document.languageId === 'tspec') {
        diagnosticProvider.validateDocumentDebounced(event.document);
      }
    })
  );

  // Validate on document save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(document => {
      if (document.languageId === 'tspec') {
        diagnosticProvider.validateDocument(document);
      }
    })
  );

  // Clear diagnostics when document is closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument(document => {
      if (document.languageId === 'tspec') {
        // Diagnostics are automatically cleared when document is closed
      }
    })
  );
}

export function deactivate(): void {
  console.log('TSpec extension is now deactivated');
}
