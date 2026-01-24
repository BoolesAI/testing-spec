"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const completionProvider_1 = require("./providers/completionProvider");
const diagnosticProvider_1 = require("./providers/diagnosticProvider");
let diagnosticProvider;
function activate(context) {
    console.log('TSpec extension is now active');
    // Define document selector for TSpec files
    const tspecSelector = {
        language: 'tspec',
        scheme: 'file'
    };
    // Initialize diagnostic provider
    diagnosticProvider = new diagnosticProvider_1.TSpecDiagnosticProvider();
    context.subscriptions.push(diagnosticProvider);
    // Register completion provider
    const completionProvider = new completionProvider_1.TSpecCompletionProvider();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(tspecSelector, completionProvider, ':', '$', '{', '.' // Trigger characters
    ));
    // Validate all open TSpec documents
    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'tspec') {
            diagnosticProvider.validateDocument(document);
        }
    });
    // Validate on document open
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(document => {
        if (document.languageId === 'tspec') {
            diagnosticProvider.validateDocument(document);
        }
    }));
    // Validate on document change (debounced)
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'tspec') {
            diagnosticProvider.validateDocumentDebounced(event.document);
        }
    }));
    // Validate on document save
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'tspec') {
            diagnosticProvider.validateDocument(document);
        }
    }));
    // Clear diagnostics when document is closed
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => {
        if (document.languageId === 'tspec') {
            // Diagnostics are automatically cleared when document is closed
        }
    }));
}
function deactivate() {
    console.log('TSpec extension is now deactivated');
}
//# sourceMappingURL=extension.js.map