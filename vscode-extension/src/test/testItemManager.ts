import * as vscode from 'vscode';
import * as path from 'path';
import { TSpecTestMetadata, TestItemData, TSpecAssertion } from './types';
import { TestParser } from './testParser';

/**
 * Manages TestItem hierarchy for the Test Explorer
 */
export class TestItemManager {
  private controller: vscode.TestController;
  private testItemData: WeakMap<vscode.TestItem, TestItemData> = new WeakMap();
  private fileToTestItem: Map<string, vscode.TestItem> = new Map();
  // Suite tracking maps
  private suiteChildrenMap: Map<string, Set<string>> = new Map();  // suite path -> child paths
  private fileToSuiteMap: Map<string, string> = new Map();         // child path -> suite path

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
   * Check if a file is managed by a suite (should not appear at root level)
   */
  isFileManagedBySuite(filePath: string): boolean {
    return this.fileToSuiteMap.has(filePath);
  }

  /**
   * Create a suite with its child test files
   */
  async createSuiteWithChildren(
    suiteUri: vscode.Uri,
    suiteMetadata: TSpecTestMetadata,
    childUris: vscode.Uri[],
    parser: TestParser
  ): Promise<vscode.TestItem> {
    // Check for existing suite item
    const existingItem = this.fileToTestItem.get(suiteUri.fsPath);
    if (existingItem) {
      // Update existing suite - remove old children first
      existingItem.children.forEach(child => {
        const data = this.testItemData.get(child);
        if (data?.type === 'suite-child') {
          existingItem.children.delete(child.id);
        }
      });
      existingItem.label = suiteMetadata.description;
    }

    // Create folder hierarchy
    const parentItem = this.getOrCreateFolderItem(suiteUri);

    // Create or reuse suite item
    const suiteItem = existingItem || this.controller.createTestItem(
      suiteMetadata.testCaseId,
      suiteMetadata.description,
      suiteUri
    );

    // Set tags based on metadata
    if (suiteMetadata.priority) {
      suiteItem.tags = [new vscode.TestTag(suiteMetadata.priority)];
    }

    // Store suite data
    this.testItemData.set(suiteItem, {
      type: 'suite',
      uri: suiteUri,
      metadata: suiteMetadata,
    });

    // Track suite's children
    const childPaths = new Set<string>();

    // Create child items for each referenced .tcase file
    for (const childUri of childUris) {
      const childMetadata = await parser.parseFile(childUri);
      if (!childMetadata) continue;

      const childItem = this.controller.createTestItem(
        `${suiteMetadata.testCaseId}:${childMetadata.testCaseId}`,
        childMetadata.description,
        childUri
      );

      // Store suite-child data
      this.testItemData.set(childItem, {
        type: 'suite-child',
        uri: childUri,
        metadata: childMetadata,
        suiteUri: suiteUri,
        childFilePath: childUri.fsPath,
      });

      // Add assertion children to the suite-child
      this.updateAssertionChildren(childItem, childMetadata);

      // Add child to suite
      suiteItem.children.add(childItem);

      // Track membership
      childPaths.add(childUri.fsPath);
      this.fileToSuiteMap.set(childUri.fsPath, suiteUri.fsPath);
    }

    this.suiteChildrenMap.set(suiteUri.fsPath, childPaths);

    // Add suite to parent (folder or root)
    if (!existingItem) {
      if (parentItem) {
        parentItem.children.add(suiteItem);
      } else {
        this.controller.items.add(suiteItem);
      }
    }

    // Store mapping
    this.fileToTestItem.set(suiteUri.fsPath, suiteItem);

    return suiteItem;
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
  updateAssertionChildren(testItem: vscode.TestItem, metadata: TSpecTestMetadata): void {
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
    this.suiteChildrenMap.clear();
    this.fileToSuiteMap.clear();
  }

  /**
   * Get all file-level test items (not folders, not assertions)
   * Includes 'file', 'suite', and 'suite-child' types
   */
  getAllFileTestItems(): vscode.TestItem[] {
    const items: vscode.TestItem[] = [];
    
    const collectItems = (collection: vscode.TestItemCollection): void => {
      collection.forEach((item) => {
        const data = this.testItemData.get(item);
        if (data?.type === 'file' || data?.type === 'suite' || data?.type === 'suite-child') {
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
