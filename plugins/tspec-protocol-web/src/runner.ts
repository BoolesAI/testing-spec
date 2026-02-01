/**
 * Web Runner using Puppeteer
 */

import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';
import type { 
  WebRequest, 
  WebAction, 
  WebResponse, 
  WebRunnerOptions,
  ScreenshotInfo,
  ConsoleMessage
} from './types.js';

/**
 * Test case interface (minimal for plugin use)
 */
interface TestCase {
  protocol: string | null;
  request: unknown;
}

/**
 * TestRunner interface
 */
interface TestRunner {
  execute(testCase: TestCase): Promise<WebResponse>;
}

export class WebRunner implements TestRunner {
  private options: WebRunnerOptions;
  private browser?: Browser;
  private page?: Page;

  constructor(options: WebRunnerOptions = {}) {
    this.options = {
      headless: true,
      timeout: 30000,
      ...options
    };
  }

  async execute(testCase: TestCase): Promise<WebResponse> {
    if (testCase.protocol !== 'web') {
      throw new Error(`WebRunner only supports web protocol, got: ${testCase.protocol}`);
    }

    const request = testCase.request as WebRequest;
    if (!request) {
      throw new Error('No web request defined in test case');
    }

    const startTime = Date.now();
    
    try {
      await this.setupBrowser(request);
      const result = await this.executeActions(request);
      
      return {
        ...result,
        duration: Date.now() - startTime
      };
    } finally {
      await this.cleanup();
    }
  }

  private async setupBrowser(request: WebRequest): Promise<void> {
    const launchOptions: PuppeteerLaunchOptions = {
      headless: request.headless ?? this.options.headless,
      slowMo: this.options.slowMo,
      args: this.options.args || ['--no-sandbox', '--disable-setuid-sandbox']
    };

    if (this.options.executablePath) {
      launchOptions.executablePath = this.options.executablePath;
    }

    this.browser = await puppeteer.launch(launchOptions);
    this.page = await this.browser.newPage();

    // Set viewport
    if (request.viewport) {
      await this.page.setViewport({
        width: request.viewport.width,
        height: request.viewport.height
      });
    }

    // Set default timeout
    const timeout = request.wait?.timeout ?? this.options.timeout ?? 30000;
    this.page.setDefaultTimeout(timeout);
  }

  private async executeActions(request: WebRequest): Promise<Omit<WebResponse, 'duration'>> {
    const screenshots: ScreenshotInfo[] = [];
    const extracted: Record<string, unknown> = {};
    const consoleMessages: ConsoleMessage[] = [];
    const errors: string[] = [];

    // Listen to console events
    this.page?.on('console', msg => {
      consoleMessages.push({
        type: msg.type() as ConsoleMessage['type'],
        message: msg.text(),
        timestamp: Date.now()
      });
    });

    // Listen to page errors
    this.page?.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to initial URL if provided
    if (request.url) {
      await this.page?.goto(request.url, {
        waitUntil: request.wait?.waitUntil || 'load'
      });
    }

    // Execute each action
    for (const action of request.actions) {
      try {
        await this.executeAction(action, { screenshots, extracted });
      } catch (error) {
        errors.push(`Action ${action.action} failed: ${(error as Error).message}`);
      }
    }

    const url = this.page?.url() || '';
    const title = await this.page?.title() || '';

    return {
      url,
      title,
      screenshots: screenshots.length > 0 ? screenshots : undefined,
      extracted,
      console: consoleMessages,
      errors: errors.length > 0 ? errors : undefined,
      _envelope: {
        status: 200,
        url,
        title,
        body: { extracted, console: consoleMessages },
        responseTime: 0
      }
    };
  }

  private async executeAction(
    action: WebAction,
    context: { screenshots: ScreenshotInfo[]; extracted: Record<string, unknown> }
  ): Promise<void> {
    const page = this.page!;

    switch (action.action) {
      case 'navigate':
        await page.goto(action.url, {
          waitUntil: action.waitUntil || 'load',
          timeout: action.timeout
        });
        break;

      case 'click':
        await page.click(action.selector, {
          button: action.button,
          clickCount: action.clickCount
        });
        break;

      case 'fill':
        if (action.clear) {
          await page.click(action.selector, { clickCount: 3 });
          await page.keyboard.press('Backspace');
        }
        await page.type(action.selector, action.value);
        break;

      case 'select':
        const values = Array.isArray(action.value) ? action.value : [action.value || ''];
        await page.select(action.selector, ...values);
        break;

      case 'check':
        const checkbox = await page.$(action.selector);
        if (checkbox) {
          const isChecked = await checkbox.evaluate((el: Element) => (el as HTMLInputElement).checked);
          if (!isChecked) {
            await checkbox.click();
          }
        }
        break;

      case 'uncheck':
        const uncheckBox = await page.$(action.selector);
        if (uncheckBox) {
          const isChecked = await uncheckBox.evaluate((el: Element) => (el as HTMLInputElement).checked);
          if (isChecked) {
            await uncheckBox.click();
          }
        }
        break;

      case 'hover':
        await page.hover(action.selector);
        break;

      case 'press':
        if (action.selector) {
          await page.click(action.selector);
        }
        await page.keyboard.press(action.key as any);
        break;

      case 'wait':
        await this.executeWaitAction(action);
        break;

      case 'screenshot':
        const screenshotPath = action.path || `screenshot-${Date.now()}.${action.type || 'png'}`;
        const screenshotOptions: any = {
          path: screenshotPath,
          fullPage: action.fullPage,
          type: action.type || 'png'
        };
        if (action.quality && (action.type === 'jpeg' || action.type === 'webp')) {
          screenshotOptions.quality = action.quality;
        }
        
        if (action.selector) {
          const element = await page.$(action.selector);
          if (element) {
            await element.screenshot(screenshotOptions);
          }
        } else {
          await page.screenshot(screenshotOptions);
        }
        
        context.screenshots.push({
          name: action.path || 'screenshot',
          path: screenshotPath,
          timestamp: Date.now()
        });
        break;

      case 'scroll':
        if (action.selector) {
          await page.$eval(action.selector, (el: Element) => {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
          });
        } else {
          await page.evaluate(({ x, y }) => {
            window.scrollTo(x || 0, y || 0);
          }, { x: action.x, y: action.y });
        }
        break;

      case 'evaluate':
        const result = await page.evaluate(action.script);
        if (action.extract) {
          context.extracted[action.extract] = result;
        }
        break;

      case 'upload':
        const fileInput = await page.$(action.selector);
        if (fileInput) {
          const files = Array.isArray(action.files) ? action.files : [action.files];
          await fileInput.uploadFile(...files);
        }
        break;

      case 'extract':
        let value: unknown;
        const element = await page.$(action.selector);
        if (element) {
          if (action.attribute) {
            value = await element.evaluate((el, attr) => el.getAttribute(attr), action.attribute);
          } else if (action.property) {
            value = await element.evaluate((el, prop) => (el as any)[prop], action.property);
          } else {
            value = await element.evaluate(el => el.textContent?.trim());
          }
        }
        context.extracted[action.name] = value;
        break;
    }
  }

  private async executeWaitAction(action: WebAction & { action: 'wait' }): Promise<void> {
    const page = this.page!;

    switch (action.for) {
      case 'selector':
        if (action.selector) {
          await page.waitForSelector(action.selector, {
            visible: action.state === 'visible',
            hidden: action.state === 'hidden' || action.state === 'detached',
            timeout: action.timeout
          });
        }
        break;

      case 'timeout':
        await new Promise(resolve => setTimeout(resolve, action.duration || 1000));
        break;

      case 'navigation':
        await page.waitForNavigation({ timeout: action.timeout });
        break;

      case 'function':
        if (action.function) {
          await page.waitForFunction(action.function, { timeout: action.timeout });
        }
        break;
    }
  }

  private async cleanup(): Promise<void> {
    await this.page?.close().catch(() => {});
    await this.browser?.close().catch(() => {});
    this.page = undefined;
    this.browser = undefined;
  }
}
