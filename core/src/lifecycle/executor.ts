import type { LifecycleAction, LifecycleScope, OutputConfig } from '../parser/types.js';
import type { Response } from '../assertion/types.js';
import { extractVariables } from '../assertion/extractors.js';

/**
 * Context for lifecycle action execution
 */
export interface LifecycleContext {
  variables: Record<string, unknown>;
  extractedVars: Record<string, unknown>;
  response?: Response;
  outputConfig?: OutputConfig;
}

/**
 * Execute lifecycle actions filtered by scope
 * @param actions - Array of lifecycle actions
 * @param scope - The scope to filter actions by
 * @param context - Execution context with variables and response
 */
export async function executeLifecycleActions(
  actions: LifecycleAction[] | undefined,
  scope: LifecycleScope,
  context: LifecycleContext
): Promise<void> {
  if (!actions || actions.length === 0) {
    return;
  }

  const scopeActions = actions.filter(a => a.scope === scope);

  for (const action of scopeActions) {
    switch (action.action) {
      case 'script':
        await executeScriptAction(action, context);
        break;
      case 'extract':
        await executeExtractAction(action, context);
        break;
      case 'output':
        executeOutputAction(action, context);
        break;
      default:
        throw new Error(`Unknown lifecycle action type: ${(action as LifecycleAction).action}`);
    }
  }
}

/**
 * Execute a script action
 * Script can return an object that will be merged into variables
 */
async function executeScriptAction(
  action: LifecycleAction,
  context: LifecycleContext
): Promise<void> {
  if (!action.source) {
    throw new Error('Script action requires source field');
  }

  try {
    // Create an async function from the source code
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    // Build context variables for the script
    const scriptContext = {
      ...context.variables,
      ...context.extractedVars,
      response: context.response,
    };

    // Create function with context available
    const fn = new AsyncFunction(
      'context',
      'console',
      `
      with (context) {
        ${action.source}
      }
      `
    );

    const result = await fn(scriptContext, console);

    // Merge returned object into variables
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      Object.assign(context.variables, result);
    }
  } catch (error) {
    const err = error as Error;
    throw new Error(`Script action failed: ${err.message}`);
  }
}

/**
 * Execute an extract action
 * Extracts values from response using JSONPath expressions
 */
async function executeExtractAction(
  action: LifecycleAction,
  context: LifecycleContext
): Promise<void> {
  if (!action.vars) {
    throw new Error('Extract action requires vars field');
  }

  if (!context.response) {
    throw new Error('Extract action requires response to be available');
  }

  const extracted = extractVariables(context.response, action.vars);
  Object.assign(context.extractedVars, extracted);
}

/**
 * Execute an output action
 * Stores output configuration in context for later use
 */
function executeOutputAction(
  action: LifecycleAction,
  context: LifecycleContext
): void {
  if (!action.config) {
    throw new Error('Output action requires config field');
  }

  // Merge output config (later configs override earlier ones)
  context.outputConfig = {
    ...context.outputConfig,
    ...action.config,
  };
}

/**
 * Create a new lifecycle context
 */
export function createLifecycleContext(
  variables: Record<string, unknown> = {}
): LifecycleContext {
  return {
    variables: { ...variables },
    extractedVars: {},
    response: undefined,
    outputConfig: undefined,
  };
}
