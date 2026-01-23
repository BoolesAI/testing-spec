import path from 'path';
import { parseYamlFile } from './yaml-parser.js';
import type { TSpec } from './types.js';

interface MergeableObject {
  $replace?: boolean;
  [key: string]: unknown;
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
  
  const template = parseYamlFile(resolvedPath);
  const templateDir = path.dirname(resolvedPath);
  
  if (template.extends) {
    const parentTemplate = loadTemplateChain(template.extends, templateDir, visited);
    const { extends: _, ...templateWithoutExtends } = template;
    return deepMerge(parentTemplate as unknown as Record<string, unknown>, templateWithoutExtends as unknown as Record<string, unknown>) as unknown as TSpec;
  }
  
  return template;
}

export function applyTemplateInheritance(spec: TSpec, baseDir: string): TSpec {
  if (!spec.extends) {
    return spec;
  }
  
  const template = loadTemplateChain(spec.extends, baseDir);
  
  const { extends: _, ...specWithoutExtends } = spec;
  
  return deepMerge(template as unknown as Record<string, unknown>, specWithoutExtends as unknown as Record<string, unknown>) as unknown as TSpec;
}
