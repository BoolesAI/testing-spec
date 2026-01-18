/**
 * TSpec DSL Parser
 * 
 * A Node.js parser for the Test Specification DSL (.tspec files)
 */

import { parseYamlFile, parseYamlString, validateTspec, getProtocolType, getBaseDir } from './parser.js';
import { applyTemplateInheritance } from './template.js';
import { replaceVariables, buildVariableContext } from './variables.js';
import { generateParameterizedCases } from './data-driver.js';
import { runAssertions, extractVariables, getAssertionSummary, extractJsonPath } from './assertions.js';
import path from 'path';

/**
 * Test case structure returned by generateTestCases
 * @typedef {Object} TestCase
 * @property {string} id - Unique test case identifier
 * @property {string} description - Test case description
 * @property {object} metadata - Test metadata
 * @property {string} protocol - Protocol type (http, grpc, etc.)
 * @property {object} request - Protocol-specific request configuration
 * @property {object[]} assertions - Assertion configurations
 * @property {object} [extract] - Variable extraction configuration
 * @property {object} [output] - Output configuration
 * @property {object} [lifecycle] - Lifecycle hooks
 * @property {object} [_raw] - Raw parsed spec (optional)
 */

/**
 * Generate test cases from a .tspec file
 * 
 * @param {string} filePath - Path to the .tspec file
 * @param {object} [options] - Generation options
 * @param {object} [options.params] - Input parameters (override variables)
 * @param {object} [options.env] - Environment variables
 * @param {object} [options.extracted] - Previously extracted variables
 * @returns {TestCase[]} Array of generated test cases
 */
export function generateTestCases(filePath, options = {}) {
  const { params = {}, env = {}, extracted = {} } = options;
  
  // Parse the spec file
  const baseDir = getBaseDir(filePath);
  let spec = parseYamlFile(filePath);
  
  // Validate basic structure
  const validation = validateTspec(spec);
  if (!validation.valid) {
    throw new Error(`Invalid tspec file: ${validation.errors.join(', ')}`);
  }
  
  // Apply template inheritance
  spec = applyTemplateInheritance(spec, baseDir);
  
  // Generate parameterized cases from data source
  const parameterizedSpecs = generateParameterizedCases(spec, baseDir);
  
  // Process each spec to generate test cases
  const testCases = parameterizedSpecs.map((caseSpec, index) => {
    // Build variable context
    const context = buildVariableContext(caseSpec, params, extracted);
    
    // Merge environment variables
    context.env = { ...context.env, ...env };
    
    // Replace variables in the entire spec
    const processedSpec = replaceVariables(caseSpec, context);
    
    // Get protocol type and request
    const protocol = getProtocolType(processedSpec);
    const request = processedSpec[protocol];
    
    // Build environment URL if applicable
    if (protocol === 'http' && processedSpec.environment) {
      const envConfig = processedSpec.environment;
      request._baseUrl = buildBaseUrl(envConfig);
    }
    
    // Generate unique test case ID
    const dataRowSuffix = caseSpec._dataRowIndex !== undefined ? `_row${caseSpec._dataRowIndex}` : '';
    const id = generateTestCaseId(filePath, index, dataRowSuffix);
    
    return {
      id,
      description: processedSpec.description,
      metadata: processedSpec.metadata,
      protocol,
      request,
      assertions: processedSpec.assertions,
      extract: processedSpec.extract,
      output: processedSpec.output,
      lifecycle: processedSpec.lifecycle,
      environment: processedSpec.environment,
      _dataRow: caseSpec._dataRow,
      _raw: processedSpec
    };
  });
  
  return testCases;
}

/**
 * Generate test cases from YAML string content
 * 
 * @param {string} content - YAML string content
 * @param {object} [options] - Generation options
 * @param {string} [options.baseDir] - Base directory for resolving relative paths
 * @param {object} [options.params] - Input parameters
 * @param {object} [options.env] - Environment variables
 * @param {object} [options.extracted] - Previously extracted variables
 * @returns {TestCase[]} Array of generated test cases
 */
export function generateTestCasesFromString(content, options = {}) {
  const { baseDir = process.cwd(), params = {}, env = {}, extracted = {} } = options;
  
  let spec = parseYamlString(content);
  
  const validation = validateTspec(spec);
  if (!validation.valid) {
    throw new Error(`Invalid tspec content: ${validation.errors.join(', ')}`);
  }
  
  spec = applyTemplateInheritance(spec, baseDir);
  
  const parameterizedSpecs = generateParameterizedCases(spec, baseDir);
  
  const testCases = parameterizedSpecs.map((caseSpec, index) => {
    const context = buildVariableContext(caseSpec, params, extracted);
    context.env = { ...context.env, ...env };
    
    const processedSpec = replaceVariables(caseSpec, context);
    const protocol = getProtocolType(processedSpec);
    const request = processedSpec[protocol];
    
    if (protocol === 'http' && processedSpec.environment) {
      request._baseUrl = buildBaseUrl(processedSpec.environment);
    }
    
    const dataRowSuffix = caseSpec._dataRowIndex !== undefined ? `_row${caseSpec._dataRowIndex}` : '';
    const id = `inline_${index}${dataRowSuffix}`;
    
    return {
      id,
      description: processedSpec.description,
      metadata: processedSpec.metadata,
      protocol,
      request,
      assertions: processedSpec.assertions,
      extract: processedSpec.extract,
      output: processedSpec.output,
      lifecycle: processedSpec.lifecycle,
      environment: processedSpec.environment,
      _dataRow: caseSpec._dataRow,
      _raw: processedSpec
    };
  });
  
  return testCases;
}

/**
 * Assertion result for a single assertion
 * @typedef {Object} AssertionResult
 * @property {boolean} passed - Whether assertion passed
 * @property {string} type - Assertion type
 * @property {*} expected - Expected value
 * @property {*} actual - Actual value
 * @property {string} message - Result message
 */

/**
 * Test result structure
 * @typedef {Object} TestResult
 * @property {string} testCaseId - Test case identifier
 * @property {boolean} passed - Overall pass/fail status
 * @property {AssertionResult[]} assertions - Individual assertion results
 * @property {object} summary - Assertion summary
 * @property {object} [extracted] - Extracted variables
 */

/**
 * Assert test results against a test case's assertions
 * 
 * @param {object} response - The actual response from test execution
 * @param {object} response.statusCode - HTTP status code (for HTTP)
 * @param {object} response.body - Response body (parsed JSON or object)
 * @param {object} response.headers - Response headers
 * @param {number} response.responseTime - Response time in milliseconds
 * @param {object} testCase - The test case object (from generateTestCases)
 * @param {object} [options] - Assertion options
 * @param {string} [options.baseDir] - Base directory for assertion includes
 * @returns {TestResult} Assertion results
 */
export function assertResults(response, testCase, options = {}) {
  const { baseDir = process.cwd() } = options;
  
  // Run all assertions
  const assertionResults = runAssertions(response, testCase.assertions, baseDir);
  
  // Extract variables if configured
  const extracted = testCase.extract ? extractVariables(response, testCase.extract) : {};
  
  // Calculate summary
  const summary = getAssertionSummary(assertionResults);
  
  // Determine overall pass/fail
  const passed = assertionResults.every(r => r.passed);
  
  return {
    testCaseId: testCase.id,
    passed,
    assertions: assertionResults,
    summary,
    extracted
  };
}

/**
 * Assert results for multiple test cases
 * 
 * @param {Array<{response: object, testCase: object}>} results - Array of response/testCase pairs
 * @param {object} [options] - Assertion options
 * @returns {TestResult[]} Array of test results
 */
export function assertMultipleResults(results, options = {}) {
  return results.map(({ response, testCase }) => assertResults(response, testCase, options));
}

/**
 * Build base URL from environment configuration
 * @param {object} envConfig - Environment configuration
 * @returns {string} Base URL
 */
function buildBaseUrl(envConfig) {
  const scheme = envConfig.scheme || 'https';
  const host = envConfig.host || 'localhost';
  const port = envConfig.port;
  
  let url = `${scheme}://${host}`;
  if (port && port !== '443' && port !== '80') {
    url += `:${port}`;
  }
  if (envConfig.variables?.base_path) {
    url += envConfig.variables.base_path;
  }
  
  return url;
}

/**
 * Generate unique test case ID
 * @param {string} filePath - Source file path
 * @param {number} index - Case index
 * @param {string} suffix - Additional suffix
 * @returns {string}
 */
function generateTestCaseId(filePath, index, suffix = '') {
  const baseName = path.basename(filePath, path.extname(filePath));
  // Remove .http, .grpc, etc. suffix
  const cleanName = baseName.replace(/\.(http|grpc|graphql|websocket)$/, '');
  return `${cleanName}${suffix}`;
}

// Re-export utilities for advanced usage
export { parseYamlFile, parseYamlString, validateTspec } from './parser.js';
export { deepMerge, applyTemplateInheritance } from './template.js';
export { replaceVariables, buildVariableContext, getBuiltinFunctions } from './variables.js';
export { generateParameterizedCases, loadDataFile, parseCSV } from './data-driver.js';
export { runAssertions, runAssertion, extractJsonPath, extractVariables, getAssertionSummary } from './assertions.js';
