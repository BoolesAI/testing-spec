import crypto from 'crypto';
import type { TSpec } from './types.js';

export interface VariableContext {
  variables: Record<string, unknown>;
  env: Record<string, string>;
  extract: Record<string, unknown>;
  params: Record<string, unknown>;
}

interface FunctionCall {
  name: string;
  args: string[];
}

type BuiltinFunction = (...args: string[]) => string | number;

const builtinFunctions: Record<string, BuiltinFunction> = {
  timestamp: () => Date.now(),
  
  uuid: () => crypto.randomUUID(),
  
  random_int: (min: string, max: string) => {
    const minNum = parseInt(min, 10);
    const maxNum = parseInt(max, 10);
    return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
  },
  
  now: (format = 'yyyy-MM-dd') => {
    const date = new Date();
    const formatMap: Record<string, string | number> = {
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
      result = result.replace(key, String(value));
    }
    return result;
  }
};

function parseFunctionCall(expr: string): FunctionCall | null {
  const match = expr.match(/^(\w+)\(([^)]*)\)$/);
  if (!match) {
    return null;
  }
  
  const name = match[1];
  const argsStr = match[2].trim();
  const args = argsStr ? argsStr.split(',').map(a => a.trim().replace(/^["']|["']$/g, '')) : [];
  
  return { name, args };
}

function evaluateExpression(expr: string, context: VariableContext): unknown {
  const { variables = {}, env = {}, extract = {}, params = {} } = context;
  
  if (expr in builtinFunctions) {
    return builtinFunctions[expr]();
  }
  
  const funcCall = parseFunctionCall(expr);
  if (funcCall && funcCall.name in builtinFunctions) {
    return builtinFunctions[funcCall.name](...funcCall.args);
  }
  
  if (expr.startsWith('env.')) {
    const envVar = expr.slice(4);
    return env[envVar] ?? process.env[envVar] ?? '';
  }
  
  if (expr.startsWith('extract.')) {
    const extractKey = expr.slice(8);
    return extract[extractKey] ?? '';
  }
  
  if (expr.includes('|')) {
    const [varName, defaultValue] = expr.split('|');
    const value = params[varName] ?? env[varName] ?? process.env[varName] ?? variables[varName];
    return value !== undefined ? value : defaultValue;
  }
  
  return params[expr] ?? env[expr] ?? process.env[expr] ?? variables[expr] ?? '';
}

export function replaceVariablesInString(str: string, context: VariableContext): string {
  if (typeof str !== 'string') {
    return str;
  }
  
  const pattern = /\$\{([^}]+)\}/g;
  
  return str.replace(pattern, (_match, expr: string) => {
    const value = evaluateExpression(expr.trim(), context);
    return value !== undefined && value !== null ? String(value) : '';
  });
}

export function replaceVariables<T>(obj: T, context: VariableContext): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return replaceVariablesInString(obj, context) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item, context)) as T;
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = replaceVariables(value, context);
    }
    return result as T;
  }
  
  return obj;
}

export function buildVariableContext(
  spec: TSpec,
  inputParams: Record<string, unknown> = {},
  extractedValues: Record<string, unknown> = {}
): VariableContext {
  const specEnv = spec.environment?.variables || {};
  const specVars = spec.variables || {};
  const dataVars = spec.data?.variables || {};
  
  // Build initial context without resolving variables yet
  const initialContext: VariableContext = {
    variables: {},
    env: specEnv,
    extract: extractedValues,
    params: inputParams
  };
  
  // Resolve variables in dependency order
  const allVars = {
    ...specVars,
    ...dataVars
  };
  
  const resolvedVariables: Record<string, unknown> = {};
  const maxIterations = 10; // Prevent infinite loops
  let iteration = 0;
  let remaining = { ...allVars };
  
  while (Object.keys(remaining).length > 0 && iteration < maxIterations) {
    const resolved: string[] = [];
    
    for (const [key, value] of Object.entries(remaining)) {
      // Create temporary context with currently resolved variables
      const tempContext = {
        ...initialContext,
        variables: resolvedVariables
      };
      
      // Try to resolve this variable
      const resolvedValue = typeof value === 'string' 
        ? replaceVariablesInString(value, tempContext)
        : value;
      
      // Check if resolution is complete (no more variable references)
      const hasUnresolvedVars = typeof resolvedValue === 'string' && 
        /\$\{[^}]+\}/.test(resolvedValue) &&
        resolvedValue.includes('${');
      
      if (!hasUnresolvedVars) {
        resolvedVariables[key] = resolvedValue;
        resolved.push(key);
      }
    }
    
    // Remove resolved variables from remaining
    for (const key of resolved) {
      delete remaining[key];
    }
    
    // If no progress was made, force resolve remaining to avoid infinite loop
    if (resolved.length === 0 && Object.keys(remaining).length > 0) {
      for (const [key, value] of Object.entries(remaining)) {
        const tempContext = {
          ...initialContext,
          variables: resolvedVariables
        };
        resolvedVariables[key] = typeof value === 'string'
          ? replaceVariablesInString(value, tempContext) 
          : value;
      }
      break;
    }
    
    iteration++;
  }
  
  return {
    variables: resolvedVariables,
    env: specEnv,
    extract: extractedValues,
    params: inputParams
  };
}

export function getBuiltinFunctions(): string[] {
  return Object.keys(builtinFunctions);
}
