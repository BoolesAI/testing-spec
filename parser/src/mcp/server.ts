import * as readline from 'readline';
import { tool as parseTspecTool } from './tools/parse-tspec.js';
import { tool as generateTestsTool } from './tools/generate-tests.js';
import { tool as assertResultsTool } from './tools/assert-results.js';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'tspec-parser';
const SERVER_VERSION = '2.0.0';

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface InitializeResult {
  protocolVersion: string;
  capabilities: {
    tools: Record<string, unknown>;
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

interface ToolsListResult {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
}

interface ToolsCallResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

const tools: MCPTool[] = [
  parseTspecTool as MCPTool,
  generateTestsTool as MCPTool,
  assertResultsTool as MCPTool
];

const toolMap = new Map<string, MCPTool>(tools.map(t => [t.name, t]));

function sendResponse(response: JsonRpcResponse): void {
  const json = JSON.stringify(response);
  process.stdout.write(json + '\n');
}

function sendError(id: string | number | null, code: number, message: string, data?: unknown): void {
  sendResponse({
    jsonrpc: '2.0',
    id,
    error: { code, message, data }
  });
}

function handleInitialize(id: string | number | null, _params?: Record<string, unknown>): void {
  const result: InitializeResult = {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {
      tools: {}
    },
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION
    }
  };
  
  sendResponse({
    jsonrpc: '2.0',
    id,
    result
  });
}

function handleToolsList(id: string | number | null): void {
  const result: ToolsListResult = {
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  };
  
  sendResponse({
    jsonrpc: '2.0',
    id,
    result
  });
}

async function handleToolsCall(id: string | number | null, params?: Record<string, unknown>): Promise<void> {
  if (!params) {
    sendError(id, -32602, 'Missing params');
    return;
  }
  
  const { name, arguments: args } = params as { name: string; arguments?: Record<string, unknown> };
  
  const tool = toolMap.get(name);
  if (!tool) {
    sendError(id, -32602, `Unknown tool: ${name}`);
    return;
  }
  
  try {
    const toolResult = await tool.handler(args || {});
    const result: ToolsCallResult = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(toolResult, null, 2)
        }
      ]
    };
    
    sendResponse({
      jsonrpc: '2.0',
      id,
      result
    });
  } catch (error) {
    const err = error as Error;
    const result: ToolsCallResult = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
          }, null, 2)
        }
      ],
      isError: true
    };
    
    sendResponse({
      jsonrpc: '2.0',
      id,
      result
    });
  }
}

async function handleMessage(message: string): Promise<void> {
  let request: JsonRpcRequest;
  
  try {
    request = JSON.parse(message) as JsonRpcRequest;
  } catch {
    sendError(null, -32700, 'Parse error');
    return;
  }
  
  const { id, method, params } = request;
  
  switch (method) {
    case 'initialize':
      handleInitialize(id ?? null, params);
      break;
    
    case 'initialized':
      break;
    
    case 'tools/list':
      handleToolsList(id ?? null);
      break;
    
    case 'tools/call':
      await handleToolsCall(id ?? null, params);
      break;
    
    case 'ping':
      sendResponse({ jsonrpc: '2.0', id: id ?? null, result: {} });
      break;
    
    default:
      if (id !== undefined) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
  }
}

export function startServer(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  
  rl.on('line', async (line: string) => {
    if (line.trim()) {
      await handleMessage(line);
    }
  });
  
  rl.on('close', () => {
    process.exit(0);
  });
  
  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT', () => process.exit(0));
  
  if (process.env.DEBUG) {
    console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  startServer();
}
