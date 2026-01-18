import crypto from 'crypto';
import type { TSpec } from './parser.js';

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

export function getBuiltinFunctions(): string[] {
  return Object.keys(builtinFunctions);
}
