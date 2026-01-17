import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

/**
 * Parse a YAML file and return the parsed object
 * @param {string} filePath - Path to the YAML file
 * @returns {object} Parsed YAML content
 */
export function parseYamlFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return yaml.load(content);
}

/**
 * Parse YAML string content
 * @param {string} content - YAML string content
 * @returns {object} Parsed YAML content
 */
export function parseYamlString(content) {
  return yaml.load(content);
}

/**
 * Validate tspec file structure
 * @param {object} spec - Parsed tspec object
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateTspec(spec) {
  const errors = [];
  const requiredFields = ['version', 'description', 'metadata', 'assertions'];
  
  for (const field of requiredFields) {
    if (!(field in spec)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check for protocol block (http, grpc, etc.)
  const protocolBlocks = ['http', 'grpc', 'graphql', 'websocket'];
  const hasProtocol = protocolBlocks.some(p => p in spec);
  if (!hasProtocol) {
    errors.push('Missing protocol block (http, grpc, etc.)');
  }
  
  // Validate metadata
  if (spec.metadata) {
    const requiredMetadata = ['ai_prompt', 'related_code', 'test_category', 'risk_level', 'tags', 'priority', 'timeout'];
    for (const field of requiredMetadata) {
      if (!(field in spec.metadata)) {
        errors.push(`Missing required metadata field: ${field}`);
      }
    }
    
    // Validate enums
    const validCategories = ['functional', 'integration', 'performance', 'security'];
    if (spec.metadata.test_category && !validCategories.includes(spec.metadata.test_category)) {
      errors.push(`Invalid test_category: ${spec.metadata.test_category}. Must be one of: ${validCategories.join(', ')}`);
    }
    
    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    if (spec.metadata.risk_level && !validRiskLevels.includes(spec.metadata.risk_level)) {
      errors.push(`Invalid risk_level: ${spec.metadata.risk_level}. Must be one of: ${validRiskLevels.join(', ')}`);
    }
    
    const validPriorities = ['low', 'medium', 'high'];
    if (spec.metadata.priority && !validPriorities.includes(spec.metadata.priority)) {
      errors.push(`Invalid priority: ${spec.metadata.priority}. Must be one of: ${validPriorities.join(', ')}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get the protocol type from a tspec object
 * @param {object} spec - Parsed tspec object
 * @returns {string|null} Protocol type or null
 */
export function getProtocolType(spec) {
  const protocols = ['http', 'grpc', 'graphql', 'websocket'];
  for (const protocol of protocols) {
    if (protocol in spec) {
      return protocol;
    }
  }
  return null;
}

/**
 * Get file base directory from file path
 * @param {string} filePath 
 * @returns {string}
 */
export function getBaseDir(filePath) {
  return path.dirname(path.resolve(filePath));
}
