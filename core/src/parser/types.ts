/**
 * Represents a line range in a source file.
 * For single lines, start equals end.
 */
export interface LineRange {
  start: number;
  end: number;
}

/**
 * Represents a parsed related_code reference with optional line ranges.
 * 
 * @example
 * // Plain path
 * { filePath: "src/auth/login.js", rawValue: "src/auth/login.js" }
 * 
 * @example
 * // With line references
 * { 
 *   filePath: "src/auth/login.js", 
 *   lineRanges: [{ start: 1, end: 10 }, { start: 20, end: 20 }],
 *   rawValue: "src/auth/login.js[1-10,20]"
 * }
 */
export interface RelatedCodeReference {
  filePath: string;
  lineRanges?: LineRange[];
  rawValue: string;
}

export interface TSpec {
  version: string;
  description: string;
  metadata: TSpecMetadata;
  assertions: Assertion[];
  http?: HttpRequest;
  grpc?: GrpcRequest;
  graphql?: GraphqlRequest;
  websocket?: WebsocketRequest;
  web?: WebRequest;
  extends?: string;
  variables?: Record<string, unknown>;
  environment?: EnvironmentConfig;
  data?: DataConfig;
  lifecycle?: LifecycleConfig;
}

export interface TSpecMetadata {
  prompt?: string;
  related_code?: string[];
  test_category?: 'functional' | 'integration' | 'performance' | 'security';
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  timeout?: string;
}

export interface Assertion {
  type: string;
  include?: string;
  expected?: unknown;
  expression?: string;
  operator?: string;
  path?: string;
  name?: string;
  value?: unknown;
  pattern?: string;
  extract_group?: number;
  max_ms?: number;
  source?: string;
  message?: string;
}

export interface HttpRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  _baseUrl?: string;
}

export interface GrpcRequest {
  service: string;
  method: string;
  message: unknown;
}

export interface GraphqlRequest {
  query: string;
  variables?: Record<string, unknown>;
}

export interface WebsocketRequest {
  url: string;
  messages: unknown[];
}

// ============================================================================
// Web Protocol Types (Browser UI Testing)
// ============================================================================

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
 * Web action base interface
 */
export interface WebActionBase {
  action: WebActionType;
  timeout?: number;
}

/**
 * Navigate to a URL
 */
export interface WebNavigateAction extends WebActionBase {
  action: 'navigate';
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

/**
 * Click on an element
 */
export interface WebClickAction extends WebActionBase {
  action: 'click';
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
}

/**
 * Fill a form field
 */
export interface WebFillAction extends WebActionBase {
  action: 'fill';
  selector: string;
  value: string;
  clear?: boolean;
}

/**
 * Select option from dropdown
 */
export interface WebSelectAction extends WebActionBase {
  action: 'select';
  selector: string;
  value?: string | string[];
  label?: string | string[];
}

/**
 * Check/uncheck a checkbox
 */
export interface WebCheckAction extends WebActionBase {
  action: 'check' | 'uncheck';
  selector: string;
}

/**
 * Hover over an element
 */
export interface WebHoverAction extends WebActionBase {
  action: 'hover';
  selector: string;
}

/**
 * Press a key or key combination
 */
export interface WebPressAction extends WebActionBase {
  action: 'press';
  key: string;
  selector?: string;
}

/**
 * Wait for condition
 */
export interface WebWaitAction extends WebActionBase {
  action: 'wait';
  for: 'selector' | 'timeout' | 'navigation' | 'load_state' | 'function';
  selector?: string;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  duration?: number;
  loadState?: 'load' | 'domcontentloaded' | 'networkidle';
  function?: string;
}

/**
 * Take a screenshot
 */
export interface WebScreenshotAction extends WebActionBase {
  action: 'screenshot';
  path?: string;
  fullPage?: boolean;
  selector?: string;
  type?: 'png' | 'jpeg';
  quality?: number;
}

/**
 * Scroll the page
 */
export interface WebScrollAction extends WebActionBase {
  action: 'scroll';
  selector?: string;
  x?: number;
  y?: number;
  behavior?: 'auto' | 'smooth';
}

/**
 * Evaluate JavaScript in the page
 */
export interface WebEvaluateAction extends WebActionBase {
  action: 'evaluate';
  script: string;
  args?: Record<string, unknown>;
  extract?: string;
}

/**
 * Upload files
 */
export interface WebUploadAction extends WebActionBase {
  action: 'upload';
  selector: string;
  files: string | string[];
}

/**
 * Extract data from page
 */
export interface WebExtractAction extends WebActionBase {
  action: 'extract';
  name: string;
  selector: string;
  attribute?: string;
  property?: string;
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
    storageState?: string;
  };
  
  /** Wait configuration */
  wait?: {
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  };
  
  /** Actions to perform */
  actions: WebAction[];
}

export interface EnvironmentConfig {
  scheme?: string;
  host?: string;
  port?: string | number;
  variables?: Record<string, string>;
}

export interface DataConfig {
  source?: string;
  format?: string;
  driver?: string;
  current_row?: number;
  variables?: Record<string, unknown>;
}

export interface OutputConfig {
  save_response_on_failure?: boolean;
  metrics?: string[];
  notifications?: Array<{
    type: string;
    channel?: string;
    condition?: 'failure' | 'success' | 'always';
  }>;
}

// Lifecycle action types
export type LifecycleActionType = 'script' | 'extract' | 'output';
export type LifecycleScope = 'test' | 'assert' | 'run' | 'data';

export interface LifecycleAction {
  action: LifecycleActionType;
  scope: LifecycleScope;
  source?: string;               // For script action
  vars?: Record<string, string>; // For extract action
  config?: OutputConfig;         // For output action
}

export interface LifecycleConfig {
  setup?: LifecycleAction[];
  teardown?: LifecycleAction[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type ProtocolType = 'http' | 'grpc' | 'graphql' | 'websocket' | 'web';

// ============================================================================
// Test Suite Types
// ============================================================================

/**
 * Extended lifecycle action types for suite-level hooks
 */
export type SuiteLifecycleActionType = 
  | 'script'    // Execute shell script
  | 'http'      // Make HTTP request
  | 'grpc'      // Make gRPC call
  | 'extract'   // Extract variables
  | 'output'    // Configure output
  | 'wait'      // Wait/delay
  | 'log';      // Log message

/**
 * HTTP request action for lifecycle hooks
 */
export interface HttpLifecycleAction {
  action: 'http';
  request: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  extract?: Record<string, string>;
}

/**
 * Wait action for lifecycle hooks
 */
export interface WaitLifecycleAction {
  action: 'wait';
  duration: string;  // e.g., "1s", "500ms"
}

/**
 * Log action for lifecycle hooks
 */
export interface LogLifecycleAction {
  action: 'log';
  message: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
}

/**
 * gRPC request action for lifecycle hooks
 */
export interface GrpcLifecycleAction {
  action: 'grpc';
  request: {
    service: string;
    method: string;
    message: unknown;
  };
  extract?: Record<string, string>;
}

/**
 * Union type for all suite lifecycle actions
 */
export type SuiteLifecycleAction = 
  | LifecycleAction
  | HttpLifecycleAction
  | WaitLifecycleAction
  | LogLifecycleAction
  | GrpcLifecycleAction;

/**
 * Suite metadata - extends test metadata with additional fields
 */
export interface SuiteMetadata {
  prompt?: string;
  related_code?: string[];
  test_category?: 'functional' | 'integration' | 'performance' | 'security';
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  timeout?: string;
  owner?: string;
}

/**
 * Test reference - either single file or glob pattern
 * Either 'file' or 'files' must be specified, not both
 */
export interface TestReference {
  file?: string;                   // Path to single .tcase file
  files?: string;                  // Glob pattern for multiple .tcase files
  skip?: boolean;                  // Skip this test/tests
  only?: boolean;                  // Run only this test/tests (focus mode)
  variables?: Record<string, unknown>; // Override variables
  timeout?: string;                // Override timeout
}

/**
 * Suite reference for nested suites
 */
export interface SuiteReference {
  file: string;                    // Path to .tsuite file
  skip?: boolean;
  only?: boolean;
}

/**
 * Retry configuration for suite execution
 */
export interface RetryConfig {
  count?: number;                  // Max retry attempts (default: 0)
  delay?: string;                  // Delay between retries (default: "1s")
  on_failure_only?: boolean;       // Retry only failed tests (default: true)
}

/**
 * Execution configuration for suite
 */
export interface ExecutionConfig {
  parallel_tests?: boolean;        // Run tests in parallel (default: false)
  parallel_suites?: boolean;       // Run nested suites in parallel (default: false)
  concurrency?: number;            // Max concurrent items (default: 5)
  order?: 'defined' | 'random';    // Test execution order (default: 'defined')
  fail_fast?: boolean;             // Stop on first failure (default: false)
  retry?: RetryConfig;             // Retry configuration
  timeout?: string;                // Suite-level timeout
}

/**
 * Suite lifecycle configuration with before_each/after_each hooks
 */
export interface SuiteLifecycleConfig {
  setup?: SuiteLifecycleAction[];
  teardown?: SuiteLifecycleAction[];
}

/**
 * Suite definition - the main structure of a test suite
 */
export interface SuiteDefinition {
  name: string;                    // Required: Suite name
  description?: string;            // Human-readable description
  version?: string;                // Suite version (default: "1.0")
  
  extends?: string;                // Template inheritance
  depends_on?: string[];           // Suite dependencies (file paths)
  
  metadata?: SuiteMetadata;        // AI and categorization metadata
  environment?: EnvironmentConfig; // Shared environment settings
  variables?: Record<string, unknown>; // Suite-level variables
  
  lifecycle?: SuiteLifecycleConfig; // Suite-level setup/teardown
  before_each?: SuiteLifecycleAction[]; // Per-test setup (beforeEach)
  after_each?: SuiteLifecycleAction[];  // Per-test teardown (afterEach)
  
  execution?: ExecutionConfig;     // Execution control
  
  tests?: TestReference[];         // Test file references (file or files glob)
  suites?: SuiteReference[];       // Nested suite references
}

/**
 * Top-level structure for a .tsuite file
 */
export interface TSpecSuite {
  suite: SuiteDefinition;
}

/**
 * Suite result statistics
 */
export interface SuiteStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  error: number;
}

/**
 * Hook execution result
 */
export interface HookResult {
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

/**
 * Suite execution result
 */
export interface SuiteResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'error' | 'blocked';
  duration: number;
  
  stats: SuiteStats;
  
  setup?: HookResult;
  teardown?: HookResult;
  
  tests: SuiteTestResult[];
  suites?: SuiteResult[];
}

/**
 * Test execution result (for suite context)
 */
export interface SuiteTestResult {
  name: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  error?: string;
  assertions?: SuiteAssertionResult[];
}

/**
 * Assertion result (for suite context)
 */
export interface SuiteAssertionResult {
  type: string;
  passed: boolean;
  message?: string;
  expected?: unknown;
  actual?: unknown;
}
