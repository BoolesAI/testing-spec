import path from 'path';
import { parseYamlFile } from './yaml-parser.js';
import type { TSpec } from './types.js';

interface MergeableObject {
  $replace?: boolean;
  [key: string]: unknown;
}

/**
 * Cache for loaded template files to avoid redundant file reads.
 * Templates are cached by their resolved absolute path.
 */
class TemplateCache {
  private cache: Map<string, TSpec> = new Map();

  get(resolvedPath: string): TSpec | undefined {
    return this.cache.get(resolvedPath);
  }

  set(resolvedPath: string, template: TSpec): void {
    this.cache.set(resolvedPath, template);
  }

  has(resolvedPath: string): boolean {
    return this.cache.has(resolvedPath);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Module-level singleton for template caching
const templateCache = new TemplateCache();

/**
 * Clears the template cache. Call this between test runs if templates may have changed.
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

export function deepMerge<T extends Record<string, unknown>>(parent: T, child: T): T {
  if (!parent) return child;
  if (!child) return parent;
  
  const result = { ...parent } as T;
  
  for (const key of Object.keys(child)) {
    if (key.startsWith('$')) {
      continue;
    }
    
    const parentValue = parent[key];
    const childValue = child[key] as unknown;
    
    if (childValue === undefined) {
      continue;
    }
    
    const childObj = child as MergeableObject;
    const childValueObj = childValue as MergeableObject;
    
    if (childObj['$replace'] === true || (typeof childValue === 'object' && childValue !== null && childValueObj['$replace'] === true)) {
      (result as Record<string, unknown>)[key] = childValueObj['$replace'] ? { ...childValueObj } : childValue;
      const resultValue = (result as Record<string, unknown>)[key] as MergeableObject;
      if (resultValue && resultValue['$replace']) {
        delete resultValue['$replace'];
      }
      continue;
    }
    
    if (typeof childValue !== 'object' || childValue === null) {
      (result as Record<string, unknown>)[key] = childValue;
      continue;
    }
    
    if (Array.isArray(childValue)) {
      if (Array.isArray(parentValue)) {
        (result as Record<string, unknown>)[key] = [...parentValue, ...childValue];
      } else {
        (result as Record<string, unknown>)[key] = childValue;
      }
      continue;
    }
    
    if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
      (result as Record<string, unknown>)[key] = deepMerge(
        parentValue as Record<string, unknown>,
        childValue as Record<string, unknown>
      );
    } else {
      (result as Record<string, unknown>)[key] = childValue;
    }
  }
  
  return result;
}

export function resolveTemplatePath(templatePath: string, baseDir: string): string {
  if (path.isAbsolute(templatePath)) {
    return templatePath;
  }
  return path.resolve(baseDir, templatePath);
}

export function loadTemplateChain(templatePath: string, baseDir: string, visited: Set<string> = new Set()): TSpec {
  const resolvedPath = resolveTemplatePath(templatePath, baseDir);
  
  if (visited.has(resolvedPath)) {
    throw new Error(`Circular template dependency detected: ${resolvedPath}`);
  }
  visited.add(resolvedPath);
  
  // Check cache first to avoid redundant file reads
  const cached = templateCache.get(resolvedPath);
  if (cached) {
    // For cached templates, we still need to check for circular deps in the current chain
    // but we can return the cached resolved template directly
    return cached;
  }
  
  const template = parseYamlFile(resolvedPath);
  const templateDir = path.dirname(resolvedPath);
  
  let resolvedTemplate: TSpec;
  if (template.extends) {
    const parentTemplate = loadTemplateChain(template.extends, templateDir, visited);
    const { extends: _, ...templateWithoutExtends } = template;
    resolvedTemplate = deepMerge(parentTemplate as unknown as Record<string, unknown>, templateWithoutExtends as unknown as Record<string, unknown>) as unknown as TSpec;
  } else {
    resolvedTemplate = template;
  }
  
  // Cache the fully resolved template
  templateCache.set(resolvedPath, resolvedTemplate);
  
  return resolvedTemplate;
}

export function applyTemplateInheritance(spec: TSpec, baseDir: string): TSpec {
  if (!spec.extends) {
    return spec;
  }
  
  const template = loadTemplateChain(spec.extends, baseDir);
  
  const { extends: _, ...specWithoutExtends } = spec;
  
  return deepMerge(template as unknown as Record<string, unknown>, specWithoutExtends as unknown as Record<string, unknown>) as unknown as TSpec;
}
