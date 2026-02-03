#!/usr/bin/env node
/**
 * MCP Server generated from Smithy model
 * Service: AmazonBedrockAgentCoreControl
 * Generated at: 2026-02-03T02:11:17.043Z
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || "https://bedrock-agentcore-control.us-east-1.amazonaws.com",
  apiKey: process.env.API_KEY,
  timeout: parseInt(process.env.API_TIMEOUT || "30000"),
};

// Create MCP server
const server = new McpServer({
  name: "AmazonBedrockAgentCoreControl",
  version: "2023-06-05",
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

// Tool: delete-resource-policy
server.tool(
  "delete-resource-policy",
  "<p>Deletes the resource-based policy for a specified resource.</p> <note> <p>This feature is currently available only for AgentCore Runtime and Gateway.</p> </note>",
  {
    resourceArn: z.string().min(20).max(1011),
  },
  async (params) => {
    try {
      const pathParams = {
              resourceArn: String(params.resourceArn),
            };
      const result = await callApi("DELETE", "/resourcepolicy/{resourceArn}", undefined, pathParams, undefined);
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

// Tool: get-resource-policy
server.tool(
  "get-resource-policy",
  "<p>Retrieves the resource-based policy for a specified resource.</p> <note> <p>This feature is currently available only for AgentCore Runtime and Gateway.</p> </note>",
  {
    resourceArn: z.string().min(20).max(1011),
  },
  async (params) => {
    try {
      const pathParams = {
              resourceArn: String(params.resourceArn),
            };
      const result = await callApi("GET", "/resourcepolicy/{resourceArn}", undefined, pathParams, undefined);
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

// Tool: get-token-vault
server.tool(
  "get-token-vault",
  "<p>Retrieves information about a token vault.</p>",
  {
    tokenVaultId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9\-_]+$/).optional(),
  },
  async (params) => {
    try {
      const body = {
              tokenVaultId: params.tokenVaultId,
            };
      const result = await callApi("POST", "/identities/get-token-vault", body, undefined, undefined);
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

// Tool: list-tags-for-resource
server.tool(
  "list-tags-for-resource",
  "<p>Lists the tags associated with the specified resource.</p> <note> <p>This feature is currently available only for AgentCore Runtime, Browser, Code Interpreter tool, and Gateway.</p> </note>",
  {
    resourceArn: z.string().min(20).max(1011).regex(/^arn:(?:[^:]+)?:bedrock-agentcore:[a-z0-9-]+:[0-9]{12}:([a-z-]+/[^/]+)(?:/[a-z-]+/[^/]+)*$/),
  },
  async (params) => {
    try {
      const pathParams = {
              resourceArn: String(params.resourceArn),
            };
      const result = await callApi("GET", "/tags/{resourceArn}", undefined, pathParams, undefined);
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

// Tool: put-resource-policy
server.tool(
  "put-resource-policy",
  "<p>Creates or updates a resource-based policy for a resource with the specified resourceArn.</p> <note> <p>This feature is currently available only for AgentCore Runtime and Gateway.</p> </note>",
  {
    resourceArn: z.string().min(20).max(1011),
    policy: z.string().min(1).max(20480),
  },
  async (params) => {
    try {
      const pathParams = {
              resourceArn: String(params.resourceArn),
            };
      const body = {
              policy: params.policy,
            };
      const result = await callApi("PUT", "/resourcepolicy/{resourceArn}", body, pathParams, undefined);
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

// Tool: set-token-vault-c-m-k
server.tool(
  "set-token-vault-c-m-k",
  "<p>Sets the customer master key (CMK) for a token vault.</p>",
  {
    tokenVaultId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9\-_]+$/).optional(),
    kmsConfiguration: z.object({ keyType: z.enum(["CustomerManagedKey", "ServiceManagedKey"]), kmsKeyArn: z.string().min(1).max(2048).regex(/^arn:aws(|-cn|-us-gov):kms:[a-zA-Z0-9-]*:[0-9]{12}:key/[a-zA-Z0-9-]{36}$/).optional() }),
  },
  async (params) => {
    try {
      const body = {
              tokenVaultId: params.tokenVaultId,
              kmsConfiguration: params.kmsConfiguration,
            };
      const result = await callApi("POST", "/identities/set-token-vault-cmk", body, undefined, undefined);
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

// Tool: tag-resource
server.tool(
  "tag-resource",
  "<p>Associates the specified tags to a resource with the specified resourceArn. If existing tags on a resource are not specified in the request parameters, they are not changed. When a resource is deleted, the tags associated with that resource are also deleted.</p> <note> <p>This feature is currently available only for AgentCore Runtime, Browser, Code Interpreter tool, and Gateway.</p> </note>",
  {
    resourceArn: z.string().min(20).max(1011).regex(/^arn:(?:[^:]+)?:bedrock-agentcore:[a-z0-9-]+:[0-9]{12}:([a-z-]+/[^/]+)(?:/[a-z-]+/[^/]+)*$/),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(/^[a-zA-Z0-9\s._:/=+@-]*$/)),
  },
  async (params) => {
    try {
      const pathParams = {
              resourceArn: String(params.resourceArn),
            };
      const body = {
              tags: params.tags,
            };
      const result = await callApi("POST", "/tags/{resourceArn}", body, pathParams, undefined);
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

// Tool: untag-resource
server.tool(
  "untag-resource",
  "<p>Removes the specified tags from the specified resource.</p> <note> <p>This feature is currently available only for AgentCore Runtime, Browser, Code Interpreter tool, and Gateway.</p> </note>",
  {
    resourceArn: z.string().min(20).max(1011).regex(/^arn:(?:[^:]+)?:bedrock-agentcore:[a-z0-9-]+:[0-9]{12}:([a-z-]+/[^/]+)(?:/[a-z-]+/[^/]+)*$/),
    tagKeys: z.array(z.string().min(1).max(128).regex(/^[a-zA-Z0-9\s._:/=+@-]*$/)),
  },
  async (params) => {
    try {
      const pathParams = {
              resourceArn: String(params.resourceArn),
            };
      const queryParams = {
              "tagKeys": params.tagKeys !== undefined ? String(params.tagKeys) : undefined,
            };
      const result = await callApi("DELETE", "/tags/{resourceArn}", undefined, pathParams, queryParams);
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
  console.error("AmazonBedrockAgentCoreControl MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
