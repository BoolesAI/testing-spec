/**
 * Web Plugin Types
 */

/**
 * Web action types for browser automation
 */
export type WebActionType = 
  | 'navigate'
  | 'click'
  | 'fill'
  | 'select'
  | 'check'
  | 'uncheck'
  | 'hover'
  | 'press'
  | 'wait'
  | 'screenshot'
  | 'scroll'
  | 'evaluate'
  | 'upload'
  | 'extract';

/**
 * Navigate to a URL
 */
export interface WebNavigateAction {
  action: 'navigate';
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  timeout?: number;
}

/**
 * Click on an element
 */
export interface WebClickAction {
  action: 'click';
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  timeout?: number;
}

/**
 * Fill a form field
 */
export interface WebFillAction {
  action: 'fill';
  selector: string;
  value: string;
  clear?: boolean;
  timeout?: number;
}

/**
 * Select option from dropdown
 */
export interface WebSelectAction {
  action: 'select';
  selector: string;
  value?: string | string[];
  timeout?: number;
}

/**
 * Check/uncheck a checkbox
 */
export interface WebCheckAction {
  action: 'check' | 'uncheck';
  selector: string;
  timeout?: number;
}

/**
 * Hover over an element
 */
export interface WebHoverAction {
  action: 'hover';
  selector: string;
  timeout?: number;
}

/**
 * Press a key or key combination
 */
export interface WebPressAction {
  action: 'press';
  key: string;
  selector?: string;
  timeout?: number;
}

/**
 * Wait for condition
 */
export interface WebWaitAction {
  action: 'wait';
  for: 'selector' | 'timeout' | 'navigation' | 'function';
  selector?: string;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  duration?: number;
  function?: string;
  timeout?: number;
}

/**
 * Take a screenshot
 */
export interface WebScreenshotAction {
  action: 'screenshot';
  path?: string;
  fullPage?: boolean;
  selector?: string;
  type?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  timeout?: number;
}

/**
 * Scroll the page
 */
export interface WebScrollAction {
  action: 'scroll';
  selector?: string;
  x?: number;
  y?: number;
  behavior?: 'auto' | 'smooth';
  timeout?: number;
}

/**
 * Evaluate JavaScript in the page
 */
export interface WebEvaluateAction {
  action: 'evaluate';
  script: string;
  args?: Record<string, unknown>;
  extract?: string;
  timeout?: number;
}

/**
 * Upload files
 */
export interface WebUploadAction {
  action: 'upload';
  selector: string;
  files: string | string[];
  timeout?: number;
}

/**
 * Extract data from page
 */
export interface WebExtractAction {
  action: 'extract';
  name: string;
  selector: string;
  attribute?: string;
  property?: string;
  timeout?: number;
}

/**
 * Union of all web actions
 */
export type WebAction =
  | WebNavigateAction
  | WebClickAction
  | WebFillAction
  | WebSelectAction
  | WebCheckAction
  | WebHoverAction
  | WebPressAction
  | WebWaitAction
  | WebScreenshotAction
  | WebScrollAction
  | WebEvaluateAction
  | WebUploadAction
  | WebExtractAction;

/**
 * Web request configuration
 */
export interface WebRequest {
  /** Initial URL to navigate to */
  url?: string;
  
  /** Browser viewport size */
  viewport?: {
    width: number;
    height: number;
  };
  
  /** Run browser in headless mode */
  headless?: boolean;
  
  /** Browser context options */
  context?: {
    locale?: string;
    timezone?: string;
    colorScheme?: 'light' | 'dark' | 'no-preference';
  };
  
  /** Wait configuration */
  wait?: {
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  };
  
  /** Actions to perform */
  actions: WebAction[];
}

/**
 * Web runner options
 */
export interface WebRunnerOptions {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  executablePath?: string;
  args?: string[];
}

/**
 * Screenshot info
 */
export interface ScreenshotInfo {
  name: string;
  path: string;
  timestamp: number;
}

/**
 * Console message info
 */
export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: number;
}

/**
 * Web response
 */
export interface WebResponse {
  url: string;
  title: string;
  status?: number;
  screenshots?: ScreenshotInfo[];
  extracted: Record<string, unknown>;
  console: ConsoleMessage[];
  errors?: string[];
  duration: number;
  _envelope?: {
    status: number;
    url: string;
    title: string;
    body: {
      extracted: Record<string, unknown>;
      console: ConsoleMessage[];
    };
    responseTime: number;
  };
}
