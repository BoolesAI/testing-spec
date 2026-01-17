import path from 'path';
import { parseYamlFile } from './parser.js';

/**
 * Deep merge two objects following the DSL merge rules:
 * - Scalar values: child overrides parent
 * - Arrays: child appends to parent (unless $replace: true)
 * - Maps: deep merge (unless field starts with $)
 * 
 * @param {object} parent - Parent object
 * @param {object} child - Child object
 * @returns {object} Merged object
 */
export function deepMerge(parent, child) {
  if (!parent) return child;
  if (!child) return parent;
  
  const result = { ...parent };
  
  for (const key of Object.keys(child)) {
    // Skip special merge control keys
    if (key.startsWith('$')) {
      continue;
    }
    
    const parentValue = parent[key];
    const childValue = child[key];
    
    if (childValue === undefined) {
      continue;
    }
    
    // Check for $replace flag in child
    if (child['$replace'] === true || (typeof childValue === 'object' && childValue !== null && childValue['$replace'] === true)) {
      result[key] = childValue['$replace'] ? { ...childValue } : childValue;
      if (result[key] && result[key]['$replace']) {
        delete result[key]['$replace'];
      }
      continue;
    }
    
    // Scalar values: child overrides parent
    if (typeof childValue !== 'object' || childValue === null) {
      result[key] = childValue;
      continue;
    }
    
    // Arrays: child appends to parent
    if (Array.isArray(childValue)) {
      if (Array.isArray(parentValue)) {
        result[key] = [...parentValue, ...childValue];
      } else {
        result[key] = childValue;
      }
      continue;
    }
    
    // Maps: deep merge
    if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
      result[key] = deepMerge(parentValue, childValue);
    } else {
      result[key] = childValue;
    }
  }
  
  return result;
}

/**
 * Resolve template path relative to base directory
 * @param {string} templatePath - Template path from extends field
 * @param {string} baseDir - Base directory of the current file
 * @returns {string} Resolved absolute path
 */
export function resolveTemplatePath(templatePath, baseDir) {
  if (path.isAbsolute(templatePath)) {
    return templatePath;
  }
  return path.resolve(baseDir, templatePath);
}

/**
 * Load and merge template chain (supports multi-level inheritance)
 * @param {string} templatePath - Path to template file
 * @param {string} baseDir - Base directory for resolving relative paths
 * @param {Set<string>} visited - Set of visited templates (for circular detection)
 * @returns {object} Merged template content
 */
export function loadTemplateChain(templatePath, baseDir, visited = new Set()) {
  const resolvedPath = resolveTemplatePath(templatePath, baseDir);
  
  // Circular dependency check
  if (visited.has(resolvedPath)) {
    throw new Error(`Circular template dependency detected: ${resolvedPath}`);
  }
  visited.add(resolvedPath);
  
  const template = parseYamlFile(resolvedPath);
  const templateDir = path.dirname(resolvedPath);
  
  // If template itself has extends, load parent first
  if (template.extends) {
    const parentTemplate = loadTemplateChain(template.extends, templateDir, visited);
    // Remove extends from template before merging
    const { extends: _, ...templateWithoutExtends } = template;
    return deepMerge(parentTemplate, templateWithoutExtends);
  }
  
  return template;
}

/**
 * Apply template inheritance to a spec
 * @param {object} spec - Original spec object
 * @param {string} baseDir - Base directory for resolving template paths
 * @returns {object} Spec with template applied
 */
export function applyTemplateInheritance(spec, baseDir) {
  if (!spec.extends) {
    return spec;
  }
  
  const template = loadTemplateChain(spec.extends, baseDir);
  
  // Remove extends from spec before merging
  const { extends: _, ...specWithoutExtends } = spec;
  
  return deepMerge(template, specWithoutExtends);
}
