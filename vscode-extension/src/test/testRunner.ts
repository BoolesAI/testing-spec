import * as vscode from 'vscode';
import { CLIAdapter } from './cliAdapter';
import { TestItemManager } from './testItemManager';
import { TestResultStore } from './testResultStore';
import { TSpecTestResult, TSpecAssertionResult } from './types';

/**
 * Executes tests and reports results to VS Code Test Explorer
 */
export class TestRunner {
  private cliAdapter: CLIAdapter;
  private testItemManager: TestItemManager;
  private resultStore: TestResultStore | null;

  constructor(
    cliAdapter: CLIAdapter,
    testItemManager: TestItemManager,
    resultStore?: TestResultStore
  ) {
    this.cliAdapter = cliAdapter;
    this.testItemManager = testItemManager;
    this.resultStore = resultStore || null;
  }

  /**
   * Run tests and report results
   */
  async runTests(
    request: vscode.TestRunRequest,
    controller: vscode.TestController,
    token: vscode.CancellationToken
  ): Promise<void> {
    const run = controller.createTestRun(request);
    console.log('[TSpec] runTests called');
    console.log('[TSpec] request.include:', request.include?.length, 'items');
    if (request.include) {
      request.include.forEach(item => {
        console.log('[TSpec] request.include item:', item.id, 'uri:', item.uri?.fsPath);
      });
    }

    try {
      // Get test items to run
      const testItems = this.getTestItemsToRun(request, controller);
      console.log('[TSpec] runTests - testItems count:', testItems.length);
      console.log('[TSpec] testItems:', testItems.map(i => ({ id: i.id, label: i.label, uri: i.uri?.fsPath })));

      if (testItems.length === 0) {
        console.log('[TSpec] No test items found, ending run');
        run.end();
        return;
      }

      // Mark all tests as enqueued
      for (const item of testItems) {
        run.enqueued(item);
        // Also enqueue assertion children
        const assertions = this.testItemManager.getAssertionItems(item);
        for (const assertion of assertions) {
          run.enqueued(assertion);
        }
      }

      // Run tests file by file
      for (const testItem of testItems) {
        if (token.isCancellationRequested) {
          run.skipped(testItem);
          continue;
        }

        await this.runSingleTest(testItem, run, token);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('[TSpec] runTests error:', errorMessage);
      vscode.window.showErrorMessage(`Test run failed: ${errorMessage}`);
    } finally {
      console.log('[TSpec] runTests ending');
      run.end();
    }
  }

  /**
   * Get test items to run based on request
   */
  private getTestItemsToRun(
    request: vscode.TestRunRequest,
    controller: vscode.TestController
  ): vscode.TestItem[] {
    const items: vscode.TestItem[] = [];

    if (request.include) {
      // Run specific tests
      for (const item of request.include) {
        const data = this.testItemManager.getData(item);
        console.log('[TSpec] getTestItemsToRun - item:', item.id, 'uri:', item.uri?.fsPath, 'data type:', data?.type);
        
        if (data?.type === 'file' || data?.type === 'suite-child') {
          // Individual test file or suite child - run directly
          items.push(item);
        } else if (data?.type === 'suite') {
          // Suite - collect all suite-child items to run
          item.children.forEach(child => {
            const childData = this.testItemManager.getData(child);
            if (childData?.type === 'suite-child') {
              items.push(child);
            }
          });
        } else if (data?.type === 'folder') {
          // Collect all file tests in folder
          this.collectFileTests(item, items);
        } else if (data?.type === 'assertion') {
          // Find parent file test
          const parent = this.findParentFileTest(item, controller);
          if (parent && !items.includes(parent)) {
            items.push(parent);
          }
        } else if (!data && item.uri) {
          // Fallback: if no data but has URI, check if it's a test file
          const fsPath = item.uri.fsPath;
          if (fsPath.endsWith('.tcase') || fsPath.endsWith('.tsuite')) {
            console.log('[TSpec] getTestItemsToRun - using fallback for test file:', fsPath);
            items.push(item);
          }
        }
      }
    } else {
      // Run all tests - get all file-level items (excludes suites, includes suite-children)
      const allItems = this.testItemManager.getAllFileTestItems();
      for (const item of allItems) {
        const data = this.testItemManager.getData(item);
        // Only include individual runnable tests (file and suite-child), not suites themselves
        if (data?.type === 'file' || data?.type === 'suite-child') {
          items.push(item);
        }
      }
    }

    // Exclude tests if specified
    if (request.exclude) {
      const excludeSet = new Set(request.exclude.map((item) => item.id));
      return items.filter((item) => !excludeSet.has(item.id));
    }

    return items;
  }

  /**
   * Collect all file-level tests from a folder item
   */
  private collectFileTests(item: vscode.TestItem, result: vscode.TestItem[]): void {
    item.children.forEach((child) => {
      const data = this.testItemManager.getData(child);
      if (data?.type === 'file' || data?.type === 'suite-child') {
        result.push(child);
      } else if (data?.type === 'suite') {
        // Collect suite children
        child.children.forEach(suiteChild => {
          const suiteChildData = this.testItemManager.getData(suiteChild);
          if (suiteChildData?.type === 'suite-child') {
            result.push(suiteChild);
          }
        });
      } else if (data?.type === 'folder') {
        this.collectFileTests(child, result);
      }
    });
  }

  /**
   * Find parent file test item for an assertion
   */
  private findParentFileTest(
    item: vscode.TestItem,
    controller: vscode.TestController
  ): vscode.TestItem | null {
    // Search controller items for parent
    const search = (collection: vscode.TestItemCollection): vscode.TestItem | null => {
      let result: vscode.TestItem | null = null;
      collection.forEach((testItem) => {
        if (testItem.children.get(item.id)) {
          const data = this.testItemManager.getData(testItem);
          if (data?.type === 'file' || data?.type === 'suite-child') {
            result = testItem;
          }
        } else {
          const found = search(testItem.children);
          if (found) {
            result = found;
          }
        }
      });
      return result;
    };

    return search(controller.items);
  }

  /**
   * Run a single test file
   */
  private async runSingleTest(
    testItem: vscode.TestItem,
    run: vscode.TestRun,
    token: vscode.CancellationToken
  ): Promise<void> {
    const data = this.testItemManager.getData(testItem);
    
    // Determine the file to execute based on item type
    let fileToExecute: string | undefined;
    
    if (data?.type === 'suite-child' && data.childFilePath) {
      // Suite child - execute the specific .tcase file
      fileToExecute = data.childFilePath;
    } else {
      // Regular file or fallback
      fileToExecute = data?.uri?.fsPath || testItem.uri?.fsPath;
    }
    
    console.log('[TSpec] runSingleTest - testItem:', testItem.id, 'type:', data?.type, 'fileToExecute:', fileToExecute);
    
    // Mark as started FIRST - required before any result reporting
    run.started(testItem);
    const startTime = Date.now();
    
    if (!fileToExecute) {
      console.log('[TSpec] runSingleTest - no file to execute, reporting error');
      run.errored(testItem, new vscode.TestMessage('Test file path not found'));
      return;
    }

    try {
      // Execute test via CLI
      const config = this.cliAdapter.getConfig();
      console.log('[TSpec] Executing CLI for file:', fileToExecute);
      
      const output = await this.cliAdapter.execute(
        [fileToExecute],
        {
          concurrency: config.concurrency,
          timeout: config.defaultTimeout,
          envVars: config.envVars,
        },
        token
      );

      console.log('[TSpec] CLI output received, results count:', output.results.length);
      console.log('[TSpec] Looking for testCaseId:', data?.metadata?.testCaseId);
      console.log('[TSpec] Available testCaseIds:', output.results.map(r => r.testCaseId));

      // Find result for this test
      const result = output.results.find(
        (r) => r.testCaseId === data?.metadata?.testCaseId
      ) || output.results[0];

      console.log('[TSpec] Selected result:', result ? result.testCaseId : 'none');

      if (result) {
        this.reportTestResult(testItem, result, run);
      } else {
        console.log('[TSpec] No result found, reporting error');
        run.errored(testItem, new vscode.TestMessage('No result found for test'));
        // Store failed result for gutter decoration
        this.storeTestResult(fileToExecute, data?.metadata?.testCaseId || '', false, Date.now() - startTime);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('[TSpec] CLI execution error:', errorMessage);
      const duration = Date.now() - startTime;
      run.errored(
        testItem,
        new vscode.TestMessage(errorMessage),
        duration
      );

      // Store failed result for gutter decoration
      this.storeTestResult(fileToExecute, data?.metadata?.testCaseId || '', false, duration);

      // Mark all assertion children as errored too
      const assertions = this.testItemManager.getAssertionItems(testItem);
      for (const assertion of assertions) {
        run.errored(assertion, new vscode.TestMessage('Parent test failed'));
      }
    }
  }

  /**
   * Store test result for gutter decorations
   */
  private storeTestResult(filePath: string, testCaseId: string, passed: boolean, duration: number): void {
    if (this.resultStore) {
      console.log('[TSpec] Storing test result:', { filePath, passed });
      this.resultStore.setResult(filePath, {
        testCaseId,
        passed,
        timestamp: Date.now(),
        duration,
      });
    }
  }

  /**
   * Report test result to TestRun
   */
  private reportTestResult(
    testItem: vscode.TestItem,
    result: TSpecTestResult,
    run: vscode.TestRun
  ): void {
    if (result.passed) {
      run.passed(testItem, result.duration);
    } else {
      const messages = this.buildFailureMessages(result);
      run.failed(testItem, messages, result.duration);
    }

    // Store result for gutter decorations
    const filePath = testItem.uri?.fsPath;
    if (filePath) {
      this.storeTestResult(filePath, result.testCaseId, result.passed, result.duration);
    }

    // Report assertion results
    this.reportAssertionResults(testItem, result.assertions, run);
  }

  /**
   * Report individual assertion results
   */
  private reportAssertionResults(
    testItem: vscode.TestItem,
    assertionResults: TSpecAssertionResult[],
    run: vscode.TestRun
  ): void {
    const assertionItems = this.testItemManager.getAssertionItems(testItem);

    assertionItems.forEach((assertionItem, index) => {
      const result = assertionResults[index];
      
      if (!result) {
        run.skipped(assertionItem);
        return;
      }

      if (result.passed) {
        run.passed(assertionItem);
      } else {
        const message = new vscode.TestMessage(result.message || 'Assertion failed');
        if (result.expected !== undefined && result.actual !== undefined) {
          message.expectedOutput = JSON.stringify(result.expected, null, 2);
          message.actualOutput = JSON.stringify(result.actual, null, 2);
        }
        run.failed(assertionItem, message);
      }
    });
  }

  /**
   * Build failure messages from test result
   */
  private buildFailureMessages(result: TSpecTestResult): vscode.TestMessage[] {
    const messages: vscode.TestMessage[] = [];

    if (result.error) {
      messages.push(new vscode.TestMessage(result.error));
    }

    // Add messages for failed assertions
    for (const assertion of result.assertions) {
      if (!assertion.passed) {
        const msg = new vscode.TestMessage(
          `[${assertion.type}] ${assertion.message}`
        );
        
        if (assertion.expected !== undefined && assertion.actual !== undefined) {
          msg.expectedOutput = JSON.stringify(assertion.expected, null, 2);
          msg.actualOutput = JSON.stringify(assertion.actual, null, 2);
        }
        
        messages.push(msg);
      }
    }

    if (messages.length === 0) {
      messages.push(new vscode.TestMessage('Test failed'));
    }

    return messages;
  }
}
