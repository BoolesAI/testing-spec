import type { LifecycleAction, LifecycleScope, OutputConfig } from '../parser/types.js';
import type { Response } from '../assertion/types.js';
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
export declare function executeLifecycleActions(actions: LifecycleAction[] | undefined, scope: LifecycleScope, context: LifecycleContext): Promise<void>;
/**
 * Create a new lifecycle context
 */
export declare function createLifecycleContext(variables?: Record<string, unknown>): LifecycleContext;
