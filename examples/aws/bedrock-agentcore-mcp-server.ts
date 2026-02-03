#!/usr/bin/env node
/**
 * MCP Server generated from Smithy model
 * Service: AmazonBedrockAgentCore
 * Generated at: 2026-02-03T02:19:46.408Z
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || "https://bedrock-agentcore.us-east-1.amazonaws.com",
  apiKey: process.env.API_KEY,
  timeout: parseInt(process.env.API_TIMEOUT || "30000"),
};

// Create MCP server
const server = new McpServer({
  name: "AmazonBedrockAgentCore",
  version: "2024-02-28",
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

// Tool: complete-resource-token-auth
server.registerTool(
  "complete-resource-token-auth",
  {
    description: "<p>Confirms the user authentication session for obtaining OAuth2.0 tokens for a resource.</p>",
    inputSchema: z.object({
    userIdentifier: z.union([z.object({ userToken: z.string().min(1).max(131072).regex(/^[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+$/) }), z.object({ userId: z.string().min(1).max(128) })]),
    sessionUri: z.string().min(1).max(1024).regex(/^urn:ietf:params:oauth:request_uri:[a-zA-Z0-9-._~]+$/),
  }),
  },
  async (params) => {
    try {
      const body = {
              userIdentifier: params.userIdentifier,
              sessionUri: params.sessionUri,
            };
      const result = await callApi("POST", "/identities/CompleteResourceTokenAuth", body, undefined, undefined);
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

// Tool: get-resource-api-key
server.registerTool(
  "get-resource-api-key",
  {
    description: "<p>Retrieves the API key associated with an API key credential provider.</p>",
    inputSchema: z.object({
    workloadIdentityToken: z.string().min(1).max(131072),
    resourceCredentialProviderName: z.string().min(1).max(128).regex(/^[a-zA-Z0-9\-_]+$/),
  }),
  },
  async (params) => {
    try {
      const body = {
              workloadIdentityToken: params.workloadIdentityToken,
              resourceCredentialProviderName: params.resourceCredentialProviderName,
            };
      const result = await callApi("POST", "/identities/api-key", body, undefined, undefined);
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

// Tool: get-resource-oauth2-token
server.registerTool(
  "get-resource-oauth2-token",
  {
    description: "<p>Returns the OAuth 2.0 token of the provided resource.</p>",
    inputSchema: z.object({
    workloadIdentityToken: z.string().min(1).max(131072),
    resourceCredentialProviderName: z.string().min(1).max(128).regex(/^[a-zA-Z0-9\-_]+$/),
    scopes: z.array(z.string().min(1).max(128)),
    oauth2Flow: z.enum(["USER_FEDERATION", "M2M"]),
    sessionUri: z.string().min(1).max(1024).regex(/^urn:ietf:params:oauth:request_uri:[a-zA-Z0-9-._~]+$/).optional(),
    resourceOauth2ReturnUrl: z.string().min(1).max(2048).regex(/^\w+:(\/?\/?)[^\s]+$/).optional(),
    forceAuthentication: z.boolean().optional(),
    customParameters: z.record(z.string(), z.string().min(1).max(2048)).optional(),
    customState: z.string().min(1).max(4096).optional(),
  }),
  },
  async (params) => {
    try {
      const body = {
              workloadIdentityToken: params.workloadIdentityToken,
              resourceCredentialProviderName: params.resourceCredentialProviderName,
              scopes: params.scopes,
              oauth2Flow: params.oauth2Flow,
              sessionUri: params.sessionUri,
              resourceOauth2ReturnUrl: params.resourceOauth2ReturnUrl,
              forceAuthentication: params.forceAuthentication,
              customParameters: params.customParameters,
              customState: params.customState,
            };
      const result = await callApi("POST", "/identities/oauth2/token", body, undefined, undefined);
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

// Tool: get-workload-access-token
server.registerTool(
  "get-workload-access-token",
  {
    description: "<p>Obtains a workload access token for agentic workloads not acting on behalf of a user.</p>",
    inputSchema: z.object({
    workloadName: z.string().min(3).max(255).regex(/^[A-Za-z0-9_.-]+$/),
  }),
  },
  async (params) => {
    try {
      const body = {
              workloadName: params.workloadName,
            };
      const result = await callApi("POST", "/identities/GetWorkloadAccessToken", body, undefined, undefined);
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

// Tool: get-workload-access-token-for-j-w-t
server.registerTool(
  "get-workload-access-token-for-j-w-t",
  {
    description: "<p>Obtains a workload access token for agentic workloads acting on behalf of a user, using a JWT token.</p>",
    inputSchema: z.object({
    workloadName: z.string().min(3).max(255).regex(/^[A-Za-z0-9_.-]+$/),
    userToken: z.string().min(1).max(131072).regex(/^[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+$/),
  }),
  },
  async (params) => {
    try {
      const body = {
              workloadName: params.workloadName,
              userToken: params.userToken,
            };
      const result = await callApi("POST", "/identities/GetWorkloadAccessTokenForJWT", body, undefined, undefined);
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

// Tool: get-workload-access-token-for-user-id
server.registerTool(
  "get-workload-access-token-for-user-id",
  {
    description: "<p>Obtains a workload access token for agentic workloads acting on behalf of a user, using the user's ID.</p>",
    inputSchema: z.object({
    workloadName: z.string().min(3).max(255).regex(/^[A-Za-z0-9_.-]+$/),
    userId: z.string().min(1).max(128),
  }),
  },
  async (params) => {
    try {
      const body = {
              workloadName: params.workloadName,
              userId: params.userId,
            };
      const result = await callApi("POST", "/identities/GetWorkloadAccessTokenForUserId", body, undefined, undefined);
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

// Tool: invoke-code-interpreter
server.registerTool(
  "invoke-code-interpreter",
  {
    description: "<p>Executes code within an active code interpreter session in Amazon Bedrock. This operation processes the provided code, runs it in a secure environment, and returns the execution results including output, errors, and generated visualizations.</p> <p>To execute code, you must specify the code interpreter identifier, session ID, and the code to run in the arguments parameter. The operation returns a stream containing the execution results, which can include text output, error messages, and data visualizations.</p> <p>This operation is subject to request rate limiting based on your account's service quotas.</p> <p>The following operations are related to <code>InvokeCodeInterpreter</code>:</p> <ul> <li> <p> <a href=\"https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_StartCodeInterpreterSession.html\">StartCodeInterpreterSession</a> </p> </li> <li> <p> <a href=\"https://docs.aws.amazon.com/bedrock-agentcore/latest/APIReference/API_GetCodeInterpreterSession.html\">GetCodeInterpreterSession</a> </p> </li> </ul>",
    inputSchema: z.object({
    codeInterpreterIdentifier: z.string(),
    sessionId: z.string().regex(/^[0-9a-zA-Z]{1,40}$/).optional(),
    traceId: z.string().optional(),
    traceParent: z.string().optional(),
    name: z.enum(["executeCode", "executeCommand", "readFiles", "listFiles", "removeFiles", "writeFiles", "startCommandExecution", "getTask", "stopTask"]),
    arguments: z.object({ code: z.string().max(100000000).optional(), language: z.enum(["python", "javascript", "typescript"]).optional(), clearContext: z.boolean().optional(), command: z.string().max(100000000).optional(), path: z.string().max(100000000).optional(), paths: z.array(z.string().max(100000000)).optional(), content: z.array(z.object({ path: z.string().max(100000000), text: z.string().max(100000000).optional(), blob: z.string().optional() })).optional(), directoryPath: z.string().max(100000000).optional(), taskId: z.string().max(100000000).optional() }).optional(),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              codeInterpreterIdentifier: String(params.codeInterpreterIdentifier),
            };
      const body = {
              name: params.name,
              arguments: params.arguments,
            };
      const result = await callApi("POST", "/code-interpreters/{codeInterpreterIdentifier}/tools/invoke", body, pathParams, undefined);
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
  console.error("AmazonBedrockAgentCore MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
