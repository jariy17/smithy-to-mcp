#!/usr/bin/env node
/**
 * MCP Server generated from Smithy model
 * Service: WeatherService
 * Generated at: 2026-02-03T02:02:14.135Z
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || "https://api.weather.example.com",
  apiKey: process.env.API_KEY,
  timeout: parseInt(process.env.API_TIMEOUT || "30000"),
};

// Create MCP server
const server = new McpServer({
  name: "WeatherService",
  version: "2024-01-01",
});

// HTTP client helper
async function callApi<T>(
  method: string,
  path: string,
  body?: unknown,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string>
): Promise<T> {
  // Replace path parameters
  let resolvedPath = path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
    }
  }

  // Build URL with query parameters
  const url = new URL(resolvedPath, CONFIG.baseUrl);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (CONFIG.apiKey) {
    headers["Authorization"] = `Bearer ${CONFIG.apiKey}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(CONFIG.timeout),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}

// Tool: get-current-weather
server.tool(
  "get-current-weather",
  "Get current weather for a location",
  {
    city: z.string(),
    units: z.enum(["celsius", "fahrenheit"]).optional(),
  },
  async (params) => {
    try {
      const pathParams = {
              city: String(params.city),
            };
      const queryParams = {
              "units": params.units !== undefined ? String(params.units) : undefined,
            };
      const result = await callApi("GET", "/weather/{city}", undefined, pathParams, queryParams);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Tool: get-forecast
server.tool(
  "get-forecast",
  "Get weather forecast for a location",
  {
    city: z.string(),
    days: z.number().int().optional(),
  },
  async (params) => {
    try {
      const pathParams = {
              city: String(params.city),
            };
      const queryParams = {
              "days": params.days !== undefined ? String(params.days) : undefined,
            };
      const result = await callApi("GET", "/forecast/{city}", undefined, pathParams, queryParams);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WeatherService MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
