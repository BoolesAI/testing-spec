# TSpec Web Protocol Plugin

Browser UI testing plugin for [TSpec](https://github.com/boolesai/testing-spec) - enables end-to-end web testing using Puppeteer.

## Features

- 🌐 **Browser Automation**: Full Chromium browser control via Puppeteer
- 🖱️ **Rich Actions**: Navigate, click, fill, select, hover, scroll, and more
- 📸 **Screenshots**: Capture full page or element screenshots
- 🎭 **Context Control**: Set viewport, locale, timezone, color scheme
- ⚡ **Async Waiting**: Smart waits for selectors, navigation, and network
- 📊 **Data Extraction**: Extract text, attributes, and computed values
- 🎯 **Assertions**: Validate page state, URLs, and extracted data
- 🔍 **JavaScript Execution**: Run custom scripts in browser context

## Installation

### Using TSpec CLI (Recommended)

```bash
tspec plugin:install @boolesai/tspec-plugin-web
```

### Manual Installation

```bash
npm install --save-dev @boolesai/tspec-plugin-web
```

> **Note**: This will automatically install Puppeteer and download Chromium (~170MB).

Then add to your `tspec.config.json`:

```json
{
  "plugins": ["@boolesai/tspec-plugin-web"]
}
```

## Usage

### Basic Example

Create a test case file `login.web.tcase`:

```yaml
version: "1.0"
description: "Test login form"

web:
  url: "https://example.com/login"
  viewport:
    width: 1920
    height: 1080
  actions:
    - action: "fill"
      selector: "#email"
      value: "test@example.com"
    - action: "fill"
      selector: "#password"
      value: "password123"
    - action: "click"
      selector: "button[type='submit']"
    - action: "wait"
      for: "navigation"
    - action: "extract"
      name: "pageTitle"
      selector: "h1"

assertions:
  - type: "json_path"
    expression: "$.url"
    operator: "contains"
    expected: "/dashboard"
  - type: "json_path"
    expression: "$.extracted.pageTitle"
    operator: "equals"
    expected: "Dashboard"
```

Run the test:

```bash
tspec run login.web.tcase
```

## Actions Reference

### Navigation

#### navigate

Navigate to a URL.

```yaml
- action: "navigate"
  url: "https://example.com/page"
  waitUntil: "networkidle0"  # Optional: load, domcontentloaded, networkidle0, networkidle2
```

### Input Actions

#### fill

Fill an input field.

```yaml
- action: "fill"
  selector: "#email"
  value: "user@example.com"
  clear: true  # Optional: clear existing value first
```

#### click

Click an element.

```yaml
- action: "click"
  selector: "button.submit"
  clickCount: 1  # Optional: number of clicks
  delay: 0       # Optional: delay between clicks (ms)
```

#### check / uncheck

Toggle checkboxes.

```yaml
- action: "check"
  selector: "#terms-checkbox"

- action: "uncheck"
  selector: "#newsletter"
```

#### select

Select dropdown option.

```yaml
- action: "select"
  selector: "#country"
  value: "US"  # or values: ["US", "CA"] for multi-select
```

#### upload

Upload files.

```yaml
- action: "upload"
  selector: "input[type='file']"
  files:
    - "/path/to/file1.pdf"
    - "/path/to/file2.jpg"
```

### Mouse Actions

#### hover

Hover over an element.

```yaml
- action: "hover"
  selector: ".menu-item"
```

#### press

Press keyboard keys.

```yaml
- action: "press"
  key: "Enter"  # or: Tab, Escape, ArrowDown, etc.
  delay: 100    # Optional: delay before release (ms)
```

### Waiting

#### wait

Wait for various conditions.

```yaml
# Wait for selector
- action: "wait"
  for: "selector"
  selector: ".loading-complete"
  timeout: 30000  # Optional: default 30s

# Wait for navigation
- action: "wait"
  for: "navigation"
  waitUntil: "networkidle0"

# Wait for timeout
- action: "wait"
  for: "timeout"
  timeout: 2000

# Wait for function
- action: "wait"
  for: "function"
  pageFunction: "() => document.readyState === 'complete'"
```

### Data Extraction

#### extract

Extract data from page elements.

```yaml
# Extract text content
- action: "extract"
  name: "title"
  selector: "h1"

# Extract attribute
- action: "extract"
  name: "imageUrl"
  selector: "img.hero"
  property: "src"

# Extract multiple elements
- action: "extract"
  name: "productNames"
  selector: ".product-name"
  multiple: true

# Extract via JavaScript
- action: "extract"
  name: "metadata"
  pageFunction: "() => ({ title: document.title, url: window.location.href })"
```

### JavaScript Execution

#### evaluate

Execute JavaScript in browser context.

```yaml
- action: "evaluate"
  pageFunction: |
    () => {
      localStorage.setItem('token', 'abc123');
      return { success: true };
    }
```

### Screenshots

#### screenshot

Capture page screenshots.

```yaml
- action: "screenshot"
  path: "screenshot.png"
  fullPage: true          # Optional: capture full page
  type: "png"            # Optional: png or jpeg
  quality: 90            # Optional: for jpeg (0-100)
  clip:                  # Optional: capture specific region
    x: 0
    y: 0
    width: 800
    height: 600
```

### Scrolling

#### scroll

Scroll the page or element.

```yaml
# Scroll to element
- action: "scroll"
  selector: "#footer"

# Scroll by pixels
- action: "scroll"
  x: 0
  y: 1000
```

## Configuration

Configure plugin behavior in `tspec.config.json`:

```json
{
  "plugins": ["@boolesai/tspec-plugin-web"],
  "pluginOptions": {
    "@boolesai/tspec-plugin-web": {
      "headless": true,
      "slowMo": 0,
      "defaultViewport": {
        "width": 1920,
        "height": 1080
      },
      "timeout": 30000,
      "executablePath": "/usr/bin/chromium",
      "args": [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    }
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headless` | `boolean` | `true` | Run browser in headless mode |
| `slowMo` | `number` | `0` | Slow down operations by N milliseconds |
| `defaultViewport` | `object` | `{width: 1920, height: 1080}` | Default viewport size |
| `timeout` | `number` | `30000` | Default timeout for actions (ms) |
| `executablePath` | `string` | - | Path to browser executable |
| `args` | `string[]` | `[]` | Additional browser launch arguments |
| `devtools` | `boolean` | `false` | Open DevTools automatically |

## Request Schema

The web request block supports:

```yaml
web:
  url: string              # Optional: Initial URL to navigate
  viewport:                # Optional: Viewport configuration
    width: number
    height: number
  headless: boolean        # Optional: Override headless mode
  context:                 # Optional: Browser context
    locale: string
    timezone: string
    colorScheme: "light" | "dark" | "no-preference"
  wait:                    # Optional: Wait configuration
    timeout: number
    waitUntil: "load" | "domcontentloaded" | "networkidle0" | "networkidle2"
  actions: array           # Required: Actions to perform
```

## Response Structure

```typescript
{
  protocol: 'web',
  success: boolean,
  url: string,              // Final URL after navigation
  title: string,            // Page title
  duration: number,         // Execution time in ms
  screenshots: string[],    // Paths to captured screenshots
  extracted: object,        // Extracted data by name
  console: object[],        // Console messages
  errors: string[],         // Page errors
  error?: string           // Execution error if failed
}
```

## Environment Variables

Use environment variables in test cases:

```yaml
web:
  url: "${BASE_URL}/login"
  actions:
    - action: "fill"
      selector: "#username"
      value: "${TEST_USERNAME}"
```

Set via command line or `.env` file:

```bash
tspec run --env BASE_URL=https://staging.example.com login.web.tcase
```

## Advanced Features

### Browser Context

Configure browser context for testing:

```yaml
web:
  url: "https://example.com"
  context:
    locale: "en-US"
    timezone: "America/New_York"
    colorScheme: "dark"
  actions:
    - action: "screenshot"
      path: "dark-mode.png"
```

### Console Monitoring

Capture and assert on console messages:

```yaml
web:
  url: "https://example.com"
  actions:
    - action: "click"
      selector: "#trigger-error"

assertions:
  - type: "json_path"
    expression: "$.console[?(@.type=='error')].text"
    operator: "exists"
```

### Mobile Device Emulation

```yaml
web:
  viewport:
    width: 375
    height: 812
    isMobile: true
    hasTouch: true
    deviceScaleFactor: 3
  context:
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)..."
```

### Network Interception

Coming soon - intercept and mock network requests.

## Examples

### Complete E2E Test

```yaml
version: "1.0"
description: "Complete e-commerce checkout flow"

web:
  url: "https://shop.example.com"
  viewport:
    width: 1920
    height: 1080
  actions:
    # Search for product
    - action: "fill"
      selector: "#search"
      value: "laptop"
    - action: "press"
      key: "Enter"
    - action: "wait"
      for: "selector"
      selector: ".search-results"
    
    # Select first product
    - action: "click"
      selector: ".product-card:first-child"
    - action: "wait"
      for: "navigation"
    
    # Add to cart
    - action: "click"
      selector: "button.add-to-cart"
    - action: "wait"
      for: "selector"
      selector: ".cart-notification"
    
    # Extract product info
    - action: "extract"
      name: "productName"
      selector: "h1.product-title"
    - action: "extract"
      name: "price"
      selector: ".product-price"
    
    # Go to checkout
    - action: "click"
      selector: "a.checkout-button"
    - action: "wait"
      for: "navigation"
    
    # Screenshot final state
    - action: "screenshot"
      path: "checkout.png"
      fullPage: true

assertions:
  - type: "json_path"
    expression: "$.url"
    operator: "contains"
    expected: "/checkout"
  - type: "json_path"
    expression: "$.extracted.productName"
    operator: "exists"
```

## Troubleshooting

### Chromium Download Issues

If Chromium download fails during installation:

```bash
# Use system Chrome/Chromium
PUPPETEER_SKIP_DOWNLOAD=true npm install @boolesai/tspec-plugin-web

# Then configure path
{
  "pluginOptions": {
    "@boolesai/tspec-plugin-web": {
      "executablePath": "/usr/bin/google-chrome"
    }
  }
}
```

### Selector Not Found

Use better waiting strategies:

```yaml
- action: "wait"
  for: "selector"
  selector: ".dynamic-content"
  timeout: 10000

- action: "click"
  selector: ".dynamic-content button"
```

### Headless Mode Issues

Some features work better in headful mode:

```bash
tspec run --plugin-options='{"@boolesai/tspec-plugin-web":{"headless":false}}' test.web.tcase
```

### Debug Mode

Enable detailed logging:

```bash
DEBUG=tspec:*,puppeteer:* tspec run test.web.tcase
```

## API Reference

### WebRunner

```typescript
import { WebRunner } from '@boolesai/tspec-plugin-web';

const runner = new WebRunner({
  headless: true,
  timeout: 30000
});

const response = await runner.execute(testCase);
```

## Performance Tips

1. **Reuse Browser Instances**: When running multiple tests, browser instances are reused
2. **Use networkidle0 Sparingly**: It waits for all network requests, which can be slow
3. **Optimize Screenshots**: Use specific regions instead of full page when possible
4. **Avoid Unnecessary Waits**: Use selector-based waits instead of fixed timeouts

## Contributing

Contributions are welcome! Please see the [Plugin Development Guide](../DEVELOPMENT.md) for details.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Related

- [TSpec Core](../../core/README.md)
- [TSpec CLI](../../cli/README.md)
- [Plugin Development Guide](../DEVELOPMENT.md)
- [HTTP Plugin](../tspec-protocol-http/README.md)
- [Full Documentation](https://tspec.boolesai.com)
- [Puppeteer Documentation](https://pptr.dev/)
