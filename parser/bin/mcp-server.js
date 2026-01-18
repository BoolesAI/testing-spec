#!/usr/bin/env node

/**
 * TSpec Parser MCP Server Executable
 * 
 * Launches the MCP server for stdio transport
 */

import { startServer } from '../src/mcp/server.js';

startServer();
