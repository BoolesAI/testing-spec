export interface Response {
    /** @deprecated Use _envelope.status instead */
    statusCode?: number;
    /** @deprecated Use _envelope.status instead */
    status?: number;
    /** @deprecated Use _envelope.grpcCode instead */
    grpcCode?: number | string;
    /** @deprecated Use _envelope.grpcCode instead */
    code?: number;
    body: unknown;
    /** @deprecated Use _envelope.header instead */
    headers?: Record<string, string>;
    /** @deprecated Use _envelope.responseTime instead */
    responseTime?: number;
    /** @deprecated Use _envelope.responseTime instead */
    duration?: number;
    _envelope?: {
        status: number;
        grpcCode?: string;
        header: Record<string, string>;
        body: unknown;
        responseTime: number;
    };
}
export interface AssertionResult {
    passed: boolean;
    type: string;
    expected?: unknown;
    actual?: unknown;
    message: string;
    expression?: string;
    operator?: string;
    path?: string;
    name?: string;
    deprecated?: boolean;
    migrationHint?: string;
}
export interface AssertionSummary {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
}
export type ComparisonOperator = 'equals' | 'eq' | 'not_equals' | 'neq' | 'exists' | 'not_exists' | 'not_empty' | 'contains' | 'not_contains' | 'matches' | 'gt' | 'gte' | 'lt' | 'lte' | 'type' | 'length' | 'length_gt' | 'length_gte' | 'length_lt' | 'length_lte';
