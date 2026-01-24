export interface Response {
  statusCode?: number;
  status?: number;
  grpcCode?: number;
  code?: number;
  body: unknown;
  headers?: Record<string, string>;
  responseTime?: number;
  duration?: number;
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
}

export interface AssertionSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

export type ComparisonOperator = 
  | 'equals' | 'eq'
  | 'not_equals' | 'neq'
  | 'exists' | 'not_exists'
  | 'not_empty'
  | 'contains' | 'not_contains'
  | 'matches'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'type' | 'length' | 'length_gt' | 'length_gte' | 'length_lt' | 'length_lte';
