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

    try {
      // Get test items to run
      const testItems = this.getTestItemsToRun(request, controller);

      if (testItems.length === 0) {
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
      vscode.window.showErrorMessage(`Test run failed: ${errorMessage}`);
    } finally {
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
        if (data?.type === 'file') {
          items.push(item);
        } else if (data?.type === 'folder') {
          // Collect all file tests in folder
          this.collectFileTests(item, items);
        } else if (data?.type === 'assertion') {
          // Find parent file test
          const parent = this.findParentFileTest(item, controller);
          if (parent && !items.includes(parent)) {
            items.push(parent);
          }
        }
      }
    } else {
      // Run all tests
      items.push(...this.testItemManager.getAllFileTestItems());
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
      if (data?.type === 'file') {
        result.push(child);
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
          if (data?.type === 'file') {
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
    if (!data?.uri) {
      run.errored(testItem, new vscode.TestMessage('Test file URI not found'));
      return;
    }

    // Mark as started
    run.started(testItem);
    const startTime = Date.now();

    try {
      // Execute test via CLI
      const config = this.cliAdapter.getConfig();
      const output = await this.cliAdapter.execute(
        [data.uri.fsPath],
        {
          concurrency: config.concurrency,
          timeout: config.defaultTimeout,
          envVars: config.envVars,
        },
        token
      );

      // Find result for this test
      const result = output.results.find(
        (r) => r.testCaseId === data.metadata?.testCaseId
      ) || output.results[0];

      if (result) {
        this.reportTestResult(testItem, result, run);
      } else {
        run.errored(testItem, new vscode.TestMessage('No result found for test'));
        // Store failed result for gutter decoration
        this.storeTestResult(data.uri.fsPath, data.metadata?.testCaseId || '', false, Date.now() - startTime);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;
      run.errored(
        testItem,
        new vscode.TestMessage(errorMessage),
        duration
      );

      // Store failed result for gutter decoration
      this.storeTestResult(data.uri.fsPath, data.metadata?.testCaseId || '', false, duration);

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
