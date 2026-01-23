import type { TSpec } from './types.js';
export interface VariableContext {
    variables: Record<string, unknown>;
    env: Record<string, string>;
    extract: Record<string, unknown>;
    params: Record<string, unknown>;
}
export declare function replaceVariablesInString(str: string, context: VariableContext): string;
export declare function replaceVariables<T>(obj: T, context: VariableContext): T;
export declare function buildVariableContext(spec: TSpec, inputParams?: Record<string, unknown>, extractedValues?: Record<string, unknown>): VariableContext;
export declare function getBuiltinFunctions(): string[];
