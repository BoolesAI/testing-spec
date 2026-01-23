import type { TSpec } from './types.js';
export declare function deepMerge<T extends Record<string, unknown>>(parent: T, child: T): T;
export declare function resolveTemplatePath(templatePath: string, baseDir: string): string;
export declare function loadTemplateChain(templatePath: string, baseDir: string, visited?: Set<string>): TSpec;
export declare function applyTemplateInheritance(spec: TSpec, baseDir: string): TSpec;
