import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { executeRun, type RunParams } from '../commands/run.js';
import { executeValidate, type ValidateParams } from '../commands/validate.js';
import { executeParse, type ParseParams } from '../commands/parse.js';
import { executeList, type ListParams } from '../commands/list.js';

const TOOL_DEFINITIONS = [
  {
    name: 'tspec_run',
    description: 'Execute TSpec test cases and report results',
    inputSchema: {
      type: 'object' as const,
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files or glob patterns to run (e.g., ["tests/*.tcase"])'
        },
        concurrency: {
          type: 'number',
          description: 'Max concurrent tests (default: 5)'
        },
        env: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Environment variables as key-value pairs'
        },
        params: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Parameters as key-value pairs'
        },
        failFast: {
          type: 'boolean',
          description: 'Stop on first failure'
        },
        output: {
          type: 'string',
          enum: ['json', 'text'],
          description: 'Output format (default: text)'
        }
      },
      required: ['files']
    }
  },
  {
    name: 'tspec_validate',
    description: 'Validate .tcase files for schema correctness',
    inputSchema: {
      type: 'object' as const,
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files or glob patterns to validate'
        },
        output: {
          type: 'string',
          enum: ['json', 'text'],
          description: 'Output format (default: text)'
        }
      },
      required: ['files']
    }
  },
  {
    name: 'tspec_parse',
    description: 'Parse and display test case information without execution',
    inputSchema: {
      type: 'object' as const,
      properties: {
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Files or glob patterns to parse'
        },
        env: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Environment variables as key-value pairs'
        },
        params: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Parameters as key-value pairs'
        },
        verbose: {
          type: 'boolean',
          description: 'Show detailed information'
        },
        output: {
          type: 'string',
          enum: ['json', 'text'],
          description: 'Output format (default: text)'
        }
      },
      required: ['files']
    }
  },
  {
    name: 'tspec_list',
    description: 'List supported protocols and configuration',
    inputSchema: {
      type: 'object' as const,
      properties: {
        output: {
          type: 'string',
          enum: ['json', 'text'],
          description: 'Output format (default: text)'
        }
      }
    }
  }
];

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    {
      name: 'tspec',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOL_DEFINITIONS };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'tspec_run': {
          const params: RunParams = {
            files: args?.files as string[],
            concurrency: args?.concurrency as number | undefined,
            env: args?.env as Record<string, string> | undefined,
            params: args?.params as Record<string, string> | undefined,
            failFast: args?.failFast as boolean | undefined,
            output: args?.output as 'json' | 'text' | undefined
          };
          const result = await executeRun(params);
          return {
            content: [{ type: 'text', text: result.output }],
            isError: !result.success
          };
        }

        case 'tspec_validate': {
          const params: ValidateParams = {
            files: args?.files as string[],
            output: args?.output as 'json' | 'text' | undefined
          };
          const result = await executeValidate(params);
          return {
            content: [{ type: 'text', text: result.output }],
            isError: !result.success
          };
        }

        case 'tspec_parse': {
          const params: ParseParams = {
            files: args?.files as string[],
            env: args?.env as Record<string, string> | undefined,
            params: args?.params as Record<string, string> | undefined,
            verbose: args?.verbose as boolean | undefined,
            output: args?.output as 'json' | 'text' | undefined
          };
          const result = await executeParse(params);
          return {
            content: [{ type: 'text', text: result.output }],
            isError: !result.success
          };
        }

        case 'tspec_list': {
          const params: ListParams = {
            output: args?.output as 'json' | 'text' | undefined
          };
          const result = await executeList(params);
          return {
            content: [{ type: 'text', text: result.output }],
            isError: !result.success
          };
        }

        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true
          };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true
      };
    }
  });

  // Handle server errors - log to stderr to avoid polluting MCP stdout
  server.onerror = (error) => {
    console.error('[MCP Error]', error);
  };

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Keep process running until explicitly terminated
  await new Promise(() => {}); // Never resolves - server runs until killed
}
