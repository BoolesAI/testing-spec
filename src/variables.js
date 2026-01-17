import crypto from 'crypto';

/**
 * Built-in functions for variable replacement
 */
const builtinFunctions = {
  /**
   * Generate current Unix millisecond timestamp
   * @returns {number}
   */
  timestamp: () => Date.now(),
  
  /**
   * Generate UUID v4
   * @returns {string}
   */
  uuid: () => crypto.randomUUID(),
  
  /**
   * Generate random integer between min and max (inclusive)
   * @param {number} min 
   * @param {number} max 
   * @returns {number}
   */
  random_int: (min, max) => {
    min = parseInt(min, 10);
    max = parseInt(max, 10);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  /**
   * Get current date formatted
   * @param {string} format - Date format string
   * @returns {string}
   */
  now: (format = 'yyyy-MM-dd') => {
    const date = new Date();
    const formatMap = {
      'yyyy': date.getFullYear(),
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'dd': String(date.getDate()).padStart(2, '0'),
      'HH': String(date.getHours()).padStart(2, '0'),
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'ss': String(date.getSeconds()).padStart(2, '0'),
      'SSS': String(date.getMilliseconds()).padStart(3, '0')
    };
    
    let result = format;
    for (const [key, value] of Object.entries(formatMap)) {
      result = result.replace(key, value);
    }
    return result;
  }
};

/**
 * Parse a function call expression
 * @param {string} expr - Function expression like "random_int(1, 100)"
 * @returns {{name: string, args: string[]}|null}
 */
function parseFunctionCall(expr) {
  const match = expr.match(/^(\w+)\(([^)]*)\)$/);
  if (!match) {
    return null;
  }
  
  const name = match[1];
  const argsStr = match[2].trim();
  const args = argsStr ? argsStr.split(',').map(a => a.trim().replace(/^["']|["']$/g, '')) : [];
  
  return { name, args };
}

/**
 * Evaluate a variable expression
 * @param {string} expr - Expression inside ${}
 * @param {object} context - Variable context
 * @returns {*} Evaluated value
 */
function evaluateExpression(expr, context) {
  const { variables = {}, env = {}, extract = {}, params = {} } = context;
  
  // Check for function call (without parameters like timestamp, uuid)
  if (expr in builtinFunctions) {
    return builtinFunctions[expr]();
  }
  
  // Check for function call with parameters
  const funcCall = parseFunctionCall(expr);
  if (funcCall && funcCall.name in builtinFunctions) {
    return builtinFunctions[funcCall.name](...funcCall.args);
  }
  
  // Check for env.VAR_NAME
  if (expr.startsWith('env.')) {
    const envVar = expr.slice(4);
    return env[envVar] ?? process.env[envVar] ?? '';
  }
  
  // Check for extract.key
  if (expr.startsWith('extract.')) {
    const extractKey = expr.slice(8);
    return extract[extractKey] ?? '';
  }
  
  // Check for default value syntax: VAR_NAME|default
  if (expr.includes('|')) {
    const [varName, defaultValue] = expr.split('|');
    const value = params[varName] ?? env[varName] ?? process.env[varName] ?? variables[varName];
    return value !== undefined ? value : defaultValue;
  }
  
  // Simple variable lookup (priority: params > env > variables)
  return params[expr] ?? env[expr] ?? process.env[expr] ?? variables[expr] ?? '';
}

/**
 * Replace all variables in a string
 * @param {string} str - String with ${...} placeholders
 * @param {object} context - Variable context
 * @returns {string} String with replaced variables
 */
export function replaceVariablesInString(str, context) {
  if (typeof str !== 'string') {
    return str;
  }
  
  // Match ${...} patterns
  const pattern = /\$\{([^}]+)\}/g;
  
  return str.replace(pattern, (match, expr) => {
    const value = evaluateExpression(expr.trim(), context);
    return value !== undefined && value !== null ? String(value) : '';
  });
}

/**
 * Recursively replace variables in an object
 * @param {*} obj - Object, array, or primitive
 * @param {object} context - Variable context
 * @returns {*} Object with replaced variables
 */
export function replaceVariables(obj, context) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return replaceVariablesInString(obj, context);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item, context));
  }
  
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceVariables(value, context);
    }
    return result;
  }
  
  return obj;
}

/**
 * Build variable context from spec and input parameters
 * @param {object} spec - Parsed spec object
 * @param {object} inputParams - Input parameters from command line or external
 * @param {object} extractedValues - Values extracted from previous responses
 * @returns {object} Variable context
 */
export function buildVariableContext(spec, inputParams = {}, extractedValues = {}) {
  // Collect environment variables from spec
  const specEnv = spec.environment?.variables || {};
  
  // Collect spec-level variables
  const specVars = spec.variables || {};
  
  // Collect data variables
  const dataVars = spec.data?.variables || {};
  
  // Merge all variables (priority: inputParams > env > data > spec variables > template variables)
  const variables = {
    ...specVars,
    ...dataVars
  };
  
  return {
    variables,
    env: specEnv,
    extract: extractedValues,
    params: inputParams
  };
}

/**
 * Get built-in functions list
 * @returns {string[]}
 */
export function getBuiltinFunctions() {
  return Object.keys(builtinFunctions);
}
