import * as vscode from 'vscode';
import * as path from 'path';
import { TSpecTestMetadata, TestItemData, TSpecAssertion } from './types';

/**
 * Manages TestItem hierarchy for the Test Explorer
 */
export class TestItemManager {
  private controller: vscode.TestController;
  private testItemData: WeakMap<vscode.TestItem, TestItemData> = new WeakMap();
  private fileToTestItem: Map<string, vscode.TestItem> = new Map();

  constructor(controller: vscode.TestController) {
    this.controller = controller;
  }

  /**
   * Get custom data for a TestItem
   */
  getData(item: vscode.TestItem): TestItemData | undefined {
    return this.testItemData.get(item);
  }

  /**
   * Get TestItem by file path
   */
  getByFilePath(filePath: string): vscode.TestItem | undefined {
    return this.fileToTestItem.get(filePath);
  }

  /**
   * Create or update a test item for a file
   */
  createOrUpdateTestItem(uri: vscode.Uri, metadata: TSpecTestMetadata): vscode.TestItem {
    const existingItem = this.fileToTestItem.get(uri.fsPath);
    
    if (existingItem) {
      // Update existing item
      existingItem.label = metadata.description;
      this.updateAssertionChildren(existingItem, metadata);
      return existingItem;
    }

    // Create folder hierarchy
    const parentItem = this.getOrCreateFolderItem(uri);
    
    // Create test item
    const testItem = this.controller.createTestItem(
      metadata.testCaseId,
      metadata.description,
      uri
    );
    
    // Set tags based on metadata
    if (metadata.priority) {
      testItem.tags = [new vscode.TestTag(metadata.priority)];
    }

    // Store custom data
    this.testItemData.set(testItem, {
      type: 'file',
      uri,
      metadata,
    });

    // Add to parent
    if (parentItem) {
      parentItem.children.add(testItem);
    } else {
      this.controller.items.add(testItem);
    }

    // Store mapping
    this.fileToTestItem.set(uri.fsPath, testItem);

    // Add assertion children
    this.updateAssertionChildren(testItem, metadata);

    return testItem;
  }

  /**
   * Update assertion sub-items for a test
   */
  private updateAssertionChildren(testItem: vscode.TestItem, metadata: TSpecTestMetadata): void {
    // Clear existing assertion children
    testItem.children.forEach((child) => {
      const data = this.testItemData.get(child);
      if (data?.type === 'assertion') {
        testItem.children.delete(child.id);
      }
    });

    // Add assertion children
    metadata.assertions.forEach((assertion, index) => {
      const assertionItem = this.createAssertionItem(testItem, assertion, index);
      testItem.children.add(assertionItem);
    });
  }

  /**
   * Create a TestItem for an assertion
   */
  private createAssertionItem(
    parentItem: vscode.TestItem,
    assertion: TSpecAssertion,
    index: number
  ): vscode.TestItem {
    const id = `${parentItem.id}:assertion:${index}`;
    const label = `[${assertion.type}] ${assertion.message || `Assertion ${index + 1}`}`;
    
    const assertionItem = this.controller.createTestItem(id, label, parentItem.uri);
    
    // Assertion items are not runnable individually - they're part of the test file
    assertionItem.canResolveChildren = false;

    // Store custom data
    this.testItemData.set(assertionItem, {
      type: 'assertion',
      assertion,
      assertionIndex: index,
    });

    return assertionItem;
  }

  /**
   * Get or create folder items for the path hierarchy
   */
  private getOrCreateFolderItem(uri: vscode.Uri): vscode.TestItem | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null;
    }

    // Find which workspace folder contains this file
    const workspaceFolder = workspaceFolders.find((folder) =>
      uri.fsPath.startsWith(folder.uri.fsPath)
    );

    if (!workspaceFolder) {
      return null;
    }

    const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
    const dirPath = path.dirname(relativePath);

    if (dirPath === '.' || dirPath === '') {
      return null;
    }

    const parts = dirPath.split(path.sep);
    let parentCollection = this.controller.items;
    let currentPath = workspaceFolder.uri.fsPath;
    let lastFolderItem: vscode.TestItem | null = null;

    for (const part of parts) {
      currentPath = path.join(currentPath, part);
      const folderId = `folder:${currentPath}`;
      
      let folderItem = parentCollection.get(folderId);
      
      if (!folderItem) {
        folderItem = this.controller.createTestItem(
          folderId,
          part,
          vscode.Uri.file(currentPath)
        );
        
        this.testItemData.set(folderItem, {
          type: 'folder',
          uri: vscode.Uri.file(currentPath),
        });
        
        parentCollection.add(folderItem);
      }

      parentCollection = folderItem.children;
      lastFolderItem = folderItem;
    }

    return lastFolderItem;
  }

  /**
   * Remove a test item by file path
   */
  removeTestItem(filePath: string): void {
    const testItem = this.fileToTestItem.get(filePath);
    if (!testItem) {
      return;
    }

    // Remove from parent
    const parent = this.findParent(testItem);
    if (parent) {
      parent.children.delete(testItem.id);
      // Clean up empty folder items
      this.cleanupEmptyFolders(parent);
    } else {
      this.controller.items.delete(testItem.id);
    }

    // Remove mapping
    this.fileToTestItem.delete(filePath);
  }

  /**
   * Find parent TestItem
   */
  private findParent(item: vscode.TestItem): vscode.TestItem | null {
    // Search through all items to find parent
    const searchCollection = (
      collection: vscode.TestItemCollection
    ): vscode.TestItem | null => {
      let result: vscode.TestItem | null = null;
      collection.forEach((child) => {
        if (child.children.get(item.id)) {
          result = child;
        } else {
          const found = searchCollection(child.children);
          if (found) {
            result = found;
          }
        }
      });
      return result;
    };

    return searchCollection(this.controller.items);
  }

  /**
   * Remove empty folder items recursively
   */
  private cleanupEmptyFolders(item: vscode.TestItem): void {
    const data = this.testItemData.get(item);
    if (data?.type !== 'folder') {
      return;
    }

    if (item.children.size === 0) {
      const parent = this.findParent(item);
      if (parent) {
        parent.children.delete(item.id);
        this.cleanupEmptyFolders(parent);
      } else {
        this.controller.items.delete(item.id);
      }
    }
  }

  /**
   * Clear all test items
   */
  clear(): void {
    this.controller.items.replace([]);
    this.fileToTestItem.clear();
  }

  /**
   * Get all file-level test items (not folders, not assertions)
   */
  getAllFileTestItems(): vscode.TestItem[] {
    const items: vscode.TestItem[] = [];
    
    const collectItems = (collection: vscode.TestItemCollection): void => {
      collection.forEach((item) => {
        const data = this.testItemData.get(item);
        if (data?.type === 'file') {
          items.push(item);
        }
        collectItems(item.children);
      });
    };

    collectItems(this.controller.items);
    return items;
  }

  /**
   * Get assertion children for a test item
   */
  getAssertionItems(testItem: vscode.TestItem): vscode.TestItem[] {
    const assertions: vscode.TestItem[] = [];
    testItem.children.forEach((child) => {
      const data = this.testItemData.get(child);
      if (data?.type === 'assertion') {
        assertions.push(child);
      }
    });
    return assertions;
  }
}
