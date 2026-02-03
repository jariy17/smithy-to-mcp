#!/usr/bin/env node
/**
 * MCP Server generated from Smithy model
 * Service: AmazonBedrockAgentCoreControl
 * Generated at: 2026-02-03T03:02:33.184Z
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@smithy/protocol-http";

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || `https://bedrock-agentcore-control.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`,
  region: process.env.AWS_REGION || "us-east-1",
  service: "bedrock-agentcore",
  timeout: parseInt(process.env.API_TIMEOUT || "30000"),
};

// AWS SigV4 signer
const signer = new SignatureV4({
  credentials: defaultProvider(),
  region: CONFIG.region,
  service: CONFIG.service,
  sha256: Sha256,
});

// Create MCP server
const server = new McpServer({
  name: "AmazonBedrockAgentCoreControl",
  version: "2023-06-05",
});

// HTTP client helper with AWS SigV4 signing
async function callApi<T>(
  method: string,
  path: string,
  body?: unknown,
  pathParams?: Record<string, string>,
  queryParams?: Record<string, string | undefined>
): Promise<T> {
  // Replace path parameters
  let resolvedPath = path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
    }
  }

  // Build URL
  const url = new URL(resolvedPath, CONFIG.baseUrl);

  // Build query object for signing (must be separate from path for SigV4)
  const query: Record<string, string> = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        query[key] = value;
        url.searchParams.set(key, value);
      }
    }
  }

  const bodyString = body ? JSON.stringify(body) : undefined;

  // Create HTTP request for signing
  const request = new HttpRequest({
    method,
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port ? parseInt(url.port) : undefined,
    path: url.pathname,
    query: Object.keys(query).length > 0 ? query : undefined,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "host": url.hostname,
    },
    body: bodyString,
  });

  // Sign the request
  const signedRequest = await signer.sign(request);

  // Execute the request
  const response = await fetch(url.toString(), {
    method,
    headers: signedRequest.headers as Record<string, string>,
    body: bodyString,
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
server.registerTool(
  "delete-resource-policy",
  {
    description: "Deletes the resource-based policy for a specified resource. This feature is currently available only for AgentCore Runtime and Gateway.",
    inputSchema: z.object({
    resourceArn: z.string().min(20).max(1011).describe("The Amazon Resource Name (ARN) of the resource for which to delete the resource policy."),
  }),
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
server.registerTool(
  "get-resource-policy",
  {
    description: "Retrieves the resource-based policy for a specified resource. This feature is currently available only for AgentCore Runtime and Gateway.",
    inputSchema: z.object({
    resourceArn: z.string().min(20).max(1011).describe("The Amazon Resource Name (ARN) of the resource for which to retrieve the resource policy."),
  }),
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
server.registerTool(
  "get-token-vault",
  {
    description: "Retrieves information about a token vault.",
    inputSchema: z.object({
    tokenVaultId: z.string().min(1).max(64).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).optional().describe("The unique identifier of the token vault to retrieve."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "tokenVaultId": params.tokenVaultId,
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
server.registerTool(
  "list-tags-for-resource",
  {
    description: "Lists the tags associated with the specified resource. This feature is currently available only for AgentCore Runtime, Browser, Code Interpreter tool, and Gateway.",
    inputSchema: z.object({
    resourceArn: z.string().min(20).max(1011).regex(new RegExp("^arn:(?:[^:]+)?:bedrock-agentcore:[a-z0-9-]+:[0-9]{12}:([a-z-]+/[^/]+)(?:/[a-z-]+/[^/]+)*$")).describe("The Amazon Resource Name (ARN) of the resource for which you want to list tags."),
  }),
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
server.registerTool(
  "put-resource-policy",
  {
    description: "Creates or updates a resource-based policy for a resource with the specified resourceArn. This feature is currently available only for AgentCore Runtime and Gateway.",
    inputSchema: z.object({
    resourceArn: z.string().min(20).max(1011).describe("The Amazon Resource Name (ARN) of the resource for which to create or update the resource policy."),
    policy: z.string().min(1).max(20480).describe("The resource policy to create or update."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              resourceArn: String(params.resourceArn),
            };
      const body = {
              "policy": params.policy,
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
server.registerTool(
  "set-token-vault-c-m-k",
  {
    description: "Sets the customer master key (CMK) for a token vault.",
    inputSchema: z.object({
    tokenVaultId: z.string().min(1).max(64).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).optional().describe("The unique identifier of the token vault to update."),
    kmsConfiguration: z.object({ keyType: z.enum(["CustomerManagedKey", "ServiceManagedKey"]), kmsKeyArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(|-cn|-us-gov):kms:[a-zA-Z0-9-]*:[0-9]{12}:key/[a-zA-Z0-9-]{36}$")).optional() }).describe("The KMS configuration for the token vault, including the key type and KMS key ARN."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "tokenVaultId": params.tokenVaultId,
              "kmsConfiguration": params.kmsConfiguration,
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
server.registerTool(
  "tag-resource",
  {
    description: "Associates the specified tags to a resource with the specified resourceArn. If existing tags on a resource are not specified in the request parameters, they are not changed. When a resource is deleted, the tags associated with that resource are also deleted. This feature is currently available only for AgentCore Runtime, Browser, Code Interpreter tool, and Gateway.",
    inputSchema: z.object({
    resourceArn: z.string().min(20).max(1011).regex(new RegExp("^arn:(?:[^:]+)?:bedrock-agentcore:[a-z0-9-]+:[0-9]{12}:([a-z-]+/[^/]+)(?:/[a-z-]+/[^/]+)*$")).describe("The Amazon Resource Name (ARN) of the resource that you want to tag."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).describe("The tags to add to the resource. A tag is a key-value pair."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              resourceArn: String(params.resourceArn),
            };
      const body = {
              "tags": params.tags,
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
server.registerTool(
  "untag-resource",
  {
    description: "Removes the specified tags from the specified resource. This feature is currently available only for AgentCore Runtime, Browser, Code Interpreter tool, and Gateway.",
    inputSchema: z.object({
    resourceArn: z.string().min(20).max(1011).regex(new RegExp("^arn:(?:[^:]+)?:bedrock-agentcore:[a-z0-9-]+:[0-9]{12}:([a-z-]+/[^/]+)(?:/[a-z-]+/[^/]+)*$")).describe("The Amazon Resource Name (ARN) of the resource that you want to untag."),
    tagKeys: z.array(z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).describe("The tag keys of the tags to remove from the resource."),
  }),
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

// Tool: create-agent-runtime-endpoint
server.registerTool(
  "create-agent-runtime-endpoint",
  {
    description: "Creates an AgentCore Runtime endpoint.",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime to create an endpoint for."),
    name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the AgentCore Runtime endpoint."),
    agentRuntimeVersion: z.string().min(1).max(5).regex(new RegExp("^([1-9][0-9]{0,4})$")).optional().describe("The version of the AgentCore Runtime to use for the endpoint."),
    description: z.string().min(1).max(256).optional().describe("The description of the AgentCore Runtime endpoint."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure idempotency of the request."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).optional().describe("A map of tag keys and values to assign to the agent runtime endpoint. Tags enable you to categorize your resources in different ways, for example, by purpose, owner, or environment."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
            };
      const body = {
              "name": params.name,
              "agentRuntimeVersion": params.agentRuntimeVersion,
              "description": params.description,
              "clientToken": params.clientToken,
              "tags": params.tags,
            };
      const result = await callApi("PUT", "/runtimes/{agentRuntimeId}/runtime-endpoints/", body, pathParams, undefined);
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

// Tool: get-agent-runtime-endpoint
server.registerTool(
  "get-agent-runtime-endpoint",
  {
    description: "Gets information about an Amazon Secure AgentEndpoint.",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime associated with the endpoint."),
    endpointName: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the AgentCore Runtime endpoint to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
              endpointName: String(params.endpointName),
            };
      const result = await callApi("GET", "/runtimes/{agentRuntimeId}/runtime-endpoints/{endpointName}/", undefined, pathParams, undefined);
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

// Tool: update-agent-runtime-endpoint
server.registerTool(
  "update-agent-runtime-endpoint",
  {
    description: "Updates an existing Amazon Bedrock AgentCore Runtime endpoint.",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime associated with the endpoint."),
    endpointName: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the AgentCore Runtime endpoint to update."),
    agentRuntimeVersion: z.string().min(1).max(5).regex(new RegExp("^([1-9][0-9]{0,4})$")).optional().describe("The updated version of the AgentCore Runtime for the endpoint."),
    description: z.string().min(1).max(256).optional().describe("The updated description of the AgentCore Runtime endpoint."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure idempotency of the request."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
              endpointName: String(params.endpointName),
            };
      const body = {
              "agentRuntimeVersion": params.agentRuntimeVersion,
              "description": params.description,
              "clientToken": params.clientToken,
            };
      const result = await callApi("PUT", "/runtimes/{agentRuntimeId}/runtime-endpoints/{endpointName}/", body, pathParams, undefined);
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

// Tool: delete-agent-runtime-endpoint
server.registerTool(
  "delete-agent-runtime-endpoint",
  {
    description: "Deletes an AAgentCore Runtime endpoint.",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime associated with the endpoint."),
    endpointName: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the AgentCore Runtime endpoint to delete."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure idempotency of the request."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
              endpointName: String(params.endpointName),
            };
      const queryParams = {
              "clientToken": params.clientToken !== undefined ? String(params.clientToken) : undefined,
            };
      const result = await callApi("DELETE", "/runtimes/{agentRuntimeId}/runtime-endpoints/{endpointName}/", undefined, pathParams, queryParams);
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

// Tool: list-agent-runtime-endpoints
server.registerTool(
  "list-agent-runtime-endpoints",
  {
    description: "Lists all endpoints for a specific Amazon Secure Agent. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: runtimeEndpoints]",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime to list endpoints for."),
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of results to return in the response."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("A token to retrieve the next page of results."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
            };
      const queryParams = {
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
            };
      const result = await callApi("POST", "/runtimes/{agentRuntimeId}/runtime-endpoints/", undefined, pathParams, queryParams);
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

// Tool: create-agent-runtime
server.registerTool(
  "create-agent-runtime",
  {
    description: "Creates an Amazon Bedrock AgentCore Runtime.",
    inputSchema: z.object({
    agentRuntimeName: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the AgentCore Runtime."),
    agentRuntimeArtifact: z.union([z.object({ containerConfiguration: z.object({ containerUri: z.string().min(1).max(1024).regex(new RegExp("^([0-9]{12})\\.dkr\\.ecr\\.([a-z0-9-]+)\\.amazonaws\\.com/((?:[a-z0-9]+(?:[._-][a-z0-9]+)*/)*[a-z0-9]+(?:[._-][a-z0-9]+)*)(?::([^:@]{1,300}))?(?:@(.+))?$")) }) }), z.object({ codeConfiguration: z.object({ code: z.union([z.object({ s3: z.object({ bucket: z.string(), prefix: z.string(), versionId: z.string().optional() }) })]), runtime: z.enum(["PYTHON_3_10", "PYTHON_3_11", "PYTHON_3_12", "PYTHON_3_13"]), entryPoint: z.array(z.string().min(1).max(128)) }) })]).describe("The artifact of the AgentCore Runtime."),
    roleArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(-[^:]+)?:iam::([0-9]{12})?:role/.+$")).describe("The IAM role ARN that provides permissions for the AgentCore Runtime."),
    networkConfiguration: z.object({ networkMode: z.enum(["PUBLIC", "VPC"]), networkModeConfig: z.object({ securityGroups: z.array(z.string().regex(new RegExp("^sg-[0-9a-zA-Z]{8,17}$"))), subnets: z.array(z.string().regex(new RegExp("^subnet-[0-9a-zA-Z]{8,17}$"))) }).optional() }).describe("The network configuration for the AgentCore Runtime."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure idempotency of the request."),
    description: z.string().min(1).max(4096).optional().describe("The description of the AgentCore Runtime."),
    authorizerConfiguration: z.union([z.object({ customJWTAuthorizer: z.object({ discoveryUrl: z.string().regex(new RegExp("^.+/\\.well-known/openid-configuration$")), allowedAudience: z.array(z.string()).optional(), allowedClients: z.array(z.string()).optional(), allowedScopes: z.array(z.string().min(1).max(255).regex(new RegExp("^[\\x21\\x23-\\x5B\\x5D-\\x7E]+$"))).optional(), customClaims: z.array(z.object({ inboundTokenClaimName: z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-:]+$")), inboundTokenClaimValueType: z.enum(["STRING", "STRING_ARRAY"]), authorizingClaimMatchValue: z.object({ claimMatchValue: z.union([z.object({ matchValueString: z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")) }), z.object({ matchValueStringList: z.array(z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$"))) })]), claimMatchOperator: z.enum(["EQUALS", "CONTAINS", "CONTAINS_ANY"]) }) })).optional() }) })]).optional().describe("The authorizer configuration for the AgentCore Runtime."),
    requestHeaderConfiguration: z.union([z.object({ requestHeaderAllowlist: z.array(z.string().min(1).max(256).regex(new RegExp("^(Authorization|X-Amzn-Bedrock-AgentCore-Runtime-Custom-[a-zA-Z0-9-]+)$"))) })]).optional().describe("Configuration for HTTP request headers that will be passed through to the runtime."),
    protocolConfiguration: z.object({ serverProtocol: z.enum(["MCP", "HTTP", "A2A"]) }).optional(),
    lifecycleConfiguration: z.object({ idleRuntimeSessionTimeout: z.number().int().optional(), maxLifetime: z.number().int().optional() }).optional().describe("The life cycle configuration for the AgentCore Runtime."),
    environmentVariables: z.record(z.string(), z.string().min(0).max(5000)).optional().describe("Environment variables to set in the AgentCore Runtime environment."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).optional().describe("A map of tag keys and values to assign to the agent runtime. Tags enable you to categorize your resources in different ways, for example, by purpose, owner, or environment."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "agentRuntimeName": params.agentRuntimeName,
              "agentRuntimeArtifact": params.agentRuntimeArtifact,
              "roleArn": params.roleArn,
              "networkConfiguration": params.networkConfiguration,
              "clientToken": params.clientToken,
              "description": params.description,
              "authorizerConfiguration": params.authorizerConfiguration,
              "requestHeaderConfiguration": params.requestHeaderConfiguration,
              "protocolConfiguration": params.protocolConfiguration,
              "lifecycleConfiguration": params.lifecycleConfiguration,
              "environmentVariables": params.environmentVariables,
              "tags": params.tags,
            };
      const result = await callApi("PUT", "/runtimes/", body, undefined, undefined);
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

// Tool: get-agent-runtime
server.registerTool(
  "get-agent-runtime",
  {
    description: "Gets an Amazon Bedrock AgentCore Runtime.",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime to retrieve."),
    agentRuntimeVersion: z.string().min(1).max(5).regex(new RegExp("^([1-9][0-9]{0,4})$")).optional().describe("The version of the AgentCore Runtime to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
            };
      const queryParams = {
              "version": params.agentRuntimeVersion !== undefined ? String(params.agentRuntimeVersion) : undefined,
            };
      const result = await callApi("GET", "/runtimes/{agentRuntimeId}/", undefined, pathParams, queryParams);
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

// Tool: update-agent-runtime
server.registerTool(
  "update-agent-runtime",
  {
    description: "Updates an existing Amazon Secure Agent.",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime to update."),
    agentRuntimeArtifact: z.union([z.object({ containerConfiguration: z.object({ containerUri: z.string().min(1).max(1024).regex(new RegExp("^([0-9]{12})\\.dkr\\.ecr\\.([a-z0-9-]+)\\.amazonaws\\.com/((?:[a-z0-9]+(?:[._-][a-z0-9]+)*/)*[a-z0-9]+(?:[._-][a-z0-9]+)*)(?::([^:@]{1,300}))?(?:@(.+))?$")) }) }), z.object({ codeConfiguration: z.object({ code: z.union([z.object({ s3: z.object({ bucket: z.string(), prefix: z.string(), versionId: z.string().optional() }) })]), runtime: z.enum(["PYTHON_3_10", "PYTHON_3_11", "PYTHON_3_12", "PYTHON_3_13"]), entryPoint: z.array(z.string().min(1).max(128)) }) })]).describe("The updated artifact of the AgentCore Runtime."),
    roleArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(-[^:]+)?:iam::([0-9]{12})?:role/.+$")).describe("The updated IAM role ARN that provides permissions for the AgentCore Runtime."),
    networkConfiguration: z.object({ networkMode: z.enum(["PUBLIC", "VPC"]), networkModeConfig: z.object({ securityGroups: z.array(z.string().regex(new RegExp("^sg-[0-9a-zA-Z]{8,17}$"))), subnets: z.array(z.string().regex(new RegExp("^subnet-[0-9a-zA-Z]{8,17}$"))) }).optional() }).describe("The updated network configuration for the AgentCore Runtime."),
    description: z.string().min(1).max(4096).optional().describe("The updated description of the AgentCore Runtime."),
    authorizerConfiguration: z.union([z.object({ customJWTAuthorizer: z.object({ discoveryUrl: z.string().regex(new RegExp("^.+/\\.well-known/openid-configuration$")), allowedAudience: z.array(z.string()).optional(), allowedClients: z.array(z.string()).optional(), allowedScopes: z.array(z.string().min(1).max(255).regex(new RegExp("^[\\x21\\x23-\\x5B\\x5D-\\x7E]+$"))).optional(), customClaims: z.array(z.object({ inboundTokenClaimName: z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-:]+$")), inboundTokenClaimValueType: z.enum(["STRING", "STRING_ARRAY"]), authorizingClaimMatchValue: z.object({ claimMatchValue: z.union([z.object({ matchValueString: z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")) }), z.object({ matchValueStringList: z.array(z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$"))) })]), claimMatchOperator: z.enum(["EQUALS", "CONTAINS", "CONTAINS_ANY"]) }) })).optional() }) })]).optional().describe("The updated authorizer configuration for the AgentCore Runtime."),
    requestHeaderConfiguration: z.union([z.object({ requestHeaderAllowlist: z.array(z.string().min(1).max(256).regex(new RegExp("^(Authorization|X-Amzn-Bedrock-AgentCore-Runtime-Custom-[a-zA-Z0-9-]+)$"))) })]).optional().describe("The updated configuration for HTTP request headers that will be passed through to the runtime."),
    protocolConfiguration: z.object({ serverProtocol: z.enum(["MCP", "HTTP", "A2A"]) }).optional(),
    lifecycleConfiguration: z.object({ idleRuntimeSessionTimeout: z.number().int().optional(), maxLifetime: z.number().int().optional() }).optional().describe("The updated life cycle configuration for the AgentCore Runtime."),
    environmentVariables: z.record(z.string(), z.string().min(0).max(5000)).optional().describe("Updated environment variables to set in the AgentCore Runtime environment."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure idempotency of the request."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
            };
      const body = {
              "agentRuntimeArtifact": params.agentRuntimeArtifact,
              "roleArn": params.roleArn,
              "networkConfiguration": params.networkConfiguration,
              "description": params.description,
              "authorizerConfiguration": params.authorizerConfiguration,
              "requestHeaderConfiguration": params.requestHeaderConfiguration,
              "protocolConfiguration": params.protocolConfiguration,
              "lifecycleConfiguration": params.lifecycleConfiguration,
              "environmentVariables": params.environmentVariables,
              "clientToken": params.clientToken,
            };
      const result = await callApi("PUT", "/runtimes/{agentRuntimeId}/", body, pathParams, undefined);
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

// Tool: delete-agent-runtime
server.registerTool(
  "delete-agent-runtime",
  {
    description: "Deletes an Amazon Bedrock AgentCore Runtime.",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime to delete."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the operation completes no more than one time. If this token matches a previous request, the service ignores the request but does not return an error."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
            };
      const queryParams = {
              "clientToken": params.clientToken !== undefined ? String(params.clientToken) : undefined,
            };
      const result = await callApi("DELETE", "/runtimes/{agentRuntimeId}/", undefined, pathParams, queryParams);
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

// Tool: list-agent-runtimes
server.registerTool(
  "list-agent-runtimes",
  {
    description: "Lists all Amazon Secure Agents in your account. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: agentRuntimes]",
    inputSchema: z.object({
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of results to return in the response."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("A token to retrieve the next page of results."),
  }),
  },
  async (params) => {
    try {
      const queryParams = {
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
            };
      const result = await callApi("POST", "/runtimes/", undefined, undefined, queryParams);
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

// Tool: list-agent-runtime-versions
server.registerTool(
  "list-agent-runtime-versions",
  {
    description: "Lists all versions of a specific Amazon Secure Agent. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: agentRuntimes]",
    inputSchema: z.object({
    agentRuntimeId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the AgentCore Runtime to list versions for."),
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of results to return in the response."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("A token to retrieve the next page of results."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeId: String(params.agentRuntimeId),
            };
      const queryParams = {
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
            };
      const result = await callApi("POST", "/runtimes/{agentRuntimeId}/versions/", undefined, pathParams, queryParams);
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

// Tool: get-api-key-credential-provider
server.registerTool(
  "get-api-key-credential-provider",
  {
    description: "Retrieves information about an API key credential provider.",
    inputSchema: z.object({
    name: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).describe("The name of the API key credential provider to retrieve."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
            };
      const result = await callApi("POST", "/identities/GetApiKeyCredentialProvider", body, undefined, undefined);
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

// Tool: update-api-key-credential-provider
server.registerTool(
  "update-api-key-credential-provider",
  {
    description: "Updates an existing API key credential provider.",
    inputSchema: z.object({
    name: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).describe("The name of the API key credential provider to update."),
    apiKey: z.string().min(1).max(65536).describe("The new API key to use for authentication. This value replaces the existing API key and is encrypted and stored securely."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
              "apiKey": params.apiKey,
            };
      const result = await callApi("POST", "/identities/UpdateApiKeyCredentialProvider", body, undefined, undefined);
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

// Tool: delete-api-key-credential-provider
server.registerTool(
  "delete-api-key-credential-provider",
  {
    description: "Deletes an API key credential provider.",
    inputSchema: z.object({
    name: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).describe("The name of the API key credential provider to delete."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
            };
      const result = await callApi("POST", "/identities/DeleteApiKeyCredentialProvider", body, undefined, undefined);
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

// Tool: list-api-key-credential-providers
server.registerTool(
  "list-api-key-credential-providers",
  {
    description: "Lists all API key credential providers in your account. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: credentialProviders]",
    inputSchema: z.object({
    nextToken: z.string().optional().describe("Pagination token."),
    maxResults: z.number().int().min(1).max(100).optional().describe("Maximum number of results to return."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "nextToken": params.nextToken,
              "maxResults": params.maxResults,
            };
      const result = await callApi("POST", "/identities/ListApiKeyCredentialProviders", body, undefined, undefined);
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

// Tool: create-browser
server.registerTool(
  "create-browser",
  {
    description: "Creates a custom browser.",
    inputSchema: z.object({
    name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the browser. The name must be unique within your account."),
    description: z.string().min(1).max(4096).optional().describe("The description of the browser."),
    executionRoleArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(-[^:]+)?:iam::([0-9]{12})?:role/.+$")).optional().describe("The Amazon Resource Name (ARN) of the IAM role that provides permissions for the browser to access Amazon Web Services services."),
    networkConfiguration: z.object({ networkMode: z.enum(["PUBLIC", "VPC"]), vpcConfig: z.object({ securityGroups: z.array(z.string().regex(new RegExp("^sg-[0-9a-zA-Z]{8,17}$"))), subnets: z.array(z.string().regex(new RegExp("^subnet-[0-9a-zA-Z]{8,17}$"))) }).optional() }).describe("The network configuration for the browser. This configuration specifies the network mode for the browser."),
    recording: z.object({ enabled: z.boolean().optional(), s3Location: z.object({ bucket: z.string(), prefix: z.string(), versionId: z.string().optional() }).optional() }).optional().describe("The recording configuration for the browser. When enabled, browser sessions are recorded and stored in the specified Amazon S3 location."),
    browserSigning: z.object({ enabled: z.boolean() }).optional().describe("The browser signing configuration that enables cryptographic agent identification using HTTP message signatures for web bot authentication."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the operation completes no more than one time. If this token matches a previous request, Amazon Bedrock ignores the request but does not return an error."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).optional().describe("A map of tag keys and values to assign to the browser. Tags enable you to categorize your resources in different ways, for example, by purpose, owner, or environment."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
              "description": params.description,
              "executionRoleArn": params.executionRoleArn,
              "networkConfiguration": params.networkConfiguration,
              "recording": params.recording,
              "browserSigning": params.browserSigning,
              "clientToken": params.clientToken,
              "tags": params.tags,
            };
      const result = await callApi("PUT", "/browsers", body, undefined, undefined);
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

// Tool: get-browser
server.registerTool(
  "get-browser",
  {
    description: "Gets information about a custom browser.",
    inputSchema: z.object({
    browserId: z.string().regex(new RegExp("^(aws\\.browser\\.v1|[a-zA-Z][a-zA-Z0-9_]{0,47}-[a-zA-Z0-9]{10})$")).describe("The unique identifier of the browser to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              browserId: String(params.browserId),
            };
      const result = await callApi("GET", "/browsers/{browserId}", undefined, pathParams, undefined);
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

// Tool: delete-browser
server.registerTool(
  "delete-browser",
  {
    description: "Deletes a custom browser.",
    inputSchema: z.object({
    browserId: z.string().regex(new RegExp("^(aws\\.browser\\.v1|[a-zA-Z][a-zA-Z0-9_]{0,47}-[a-zA-Z0-9]{10})$")).describe("The unique identifier of the browser to delete."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure idempotency of the request."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              browserId: String(params.browserId),
            };
      const queryParams = {
              "clientToken": params.clientToken !== undefined ? String(params.clientToken) : undefined,
            };
      const result = await callApi("DELETE", "/browsers/{browserId}", undefined, pathParams, queryParams);
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

// Tool: list-browsers
server.registerTool(
  "list-browsers",
  {
    description: "Lists all custom browsers in your account. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: browserSummaries]",
    inputSchema: z.object({
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of results to return in a single call. The default value is 10. The maximum value is 50."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results."),
    type: z.enum(["SYSTEM", "CUSTOM"]).optional().describe("The type of browsers to list. If not specified, all browser types are returned."),
  }),
  },
  async (params) => {
    try {
      const queryParams = {
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
              "type": params.type !== undefined ? String(params.type) : undefined,
            };
      const result = await callApi("POST", "/browsers", undefined, undefined, queryParams);
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

// Tool: create-code-interpreter
server.registerTool(
  "create-code-interpreter",
  {
    description: "Creates a custom code interpreter.",
    inputSchema: z.object({
    name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the code interpreter. The name must be unique within your account."),
    description: z.string().min(1).max(4096).optional().describe("The description of the code interpreter."),
    executionRoleArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(-[^:]+)?:iam::([0-9]{12})?:role/.+$")).optional().describe("The Amazon Resource Name (ARN) of the IAM role that provides permissions for the code interpreter to access Amazon Web Services services."),
    networkConfiguration: z.object({ networkMode: z.enum(["PUBLIC", "SANDBOX", "VPC"]), vpcConfig: z.object({ securityGroups: z.array(z.string().regex(new RegExp("^sg-[0-9a-zA-Z]{8,17}$"))), subnets: z.array(z.string().regex(new RegExp("^subnet-[0-9a-zA-Z]{8,17}$"))) }).optional() }).describe("The network configuration for the code interpreter. This configuration specifies the network mode for the code interpreter."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the operation completes no more than one time. If this token matches a previous request, Amazon Bedrock ignores the request but does not return an error."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).optional().describe("A map of tag keys and values to assign to the code interpreter. Tags enable you to categorize your resources in different ways, for example, by purpose, owner, or environment."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
              "description": params.description,
              "executionRoleArn": params.executionRoleArn,
              "networkConfiguration": params.networkConfiguration,
              "clientToken": params.clientToken,
              "tags": params.tags,
            };
      const result = await callApi("PUT", "/code-interpreters", body, undefined, undefined);
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

// Tool: get-code-interpreter
server.registerTool(
  "get-code-interpreter",
  {
    description: "Gets information about a custom code interpreter.",
    inputSchema: z.object({
    codeInterpreterId: z.string().regex(new RegExp("^(aws\\.codeinterpreter\\.v1|[a-zA-Z][a-zA-Z0-9_]{0,47}-[a-zA-Z0-9]{10})$")).describe("The unique identifier of the code interpreter to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              codeInterpreterId: String(params.codeInterpreterId),
            };
      const result = await callApi("GET", "/code-interpreters/{codeInterpreterId}", undefined, pathParams, undefined);
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

// Tool: delete-code-interpreter
server.registerTool(
  "delete-code-interpreter",
  {
    description: "Deletes a custom code interpreter.",
    inputSchema: z.object({
    codeInterpreterId: z.string().regex(new RegExp("^(aws\\.codeinterpreter\\.v1|[a-zA-Z][a-zA-Z0-9_]{0,47}-[a-zA-Z0-9]{10})$")).describe("The unique identifier of the code interpreter to delete."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure idempotency of the request."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              codeInterpreterId: String(params.codeInterpreterId),
            };
      const queryParams = {
              "clientToken": params.clientToken !== undefined ? String(params.clientToken) : undefined,
            };
      const result = await callApi("DELETE", "/code-interpreters/{codeInterpreterId}", undefined, pathParams, queryParams);
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

// Tool: list-code-interpreters
server.registerTool(
  "list-code-interpreters",
  {
    description: "Lists all custom code interpreters in your account. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: codeInterpreterSummaries]",
    inputSchema: z.object({
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of results to return in the response."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("A token to retrieve the next page of results."),
    type: z.enum(["SYSTEM", "CUSTOM"]).optional().describe("The type of code interpreters to list."),
  }),
  },
  async (params) => {
    try {
      const queryParams = {
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
              "type": params.type !== undefined ? String(params.type) : undefined,
            };
      const result = await callApi("POST", "/code-interpreters", undefined, undefined, queryParams);
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

// Tool: create-evaluator
server.registerTool(
  "create-evaluator",
  {
    description: "Creates a custom evaluator for agent quality assessment. Custom evaluators use LLM-as-a-Judge configurations with user-defined prompts, rating scales, and model settings to evaluate agent performance at tool call, trace, or session levels.",
    inputSchema: z.object({
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If you don't specify this field, a value is randomly generated for you. If this token matches a previous request, the service ignores the request, but doesn't return an error. For more information, see Ensuring idempotency."),
    evaluatorName: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the evaluator. Must be unique within your account."),
    description: z.string().min(1).max(200).optional().describe("The description of the evaluator that explains its purpose and evaluation criteria."),
    evaluatorConfig: z.union([z.object({ llmAsAJudge: z.object({ instructions: z.string(), ratingScale: z.union([z.object({ numerical: z.array(z.object({ definition: z.string(), value: z.number(), label: z.string() })) }), z.object({ categorical: z.array(z.object({ definition: z.string(), label: z.string() })) })]), modelConfig: z.union([z.object({ bedrockEvaluatorModelConfig: z.object({ modelId: z.string(), inferenceConfig: z.object({ maxTokens: z.number().int().optional(), temperature: z.number().optional(), topP: z.number().optional(), stopSequences: z.array(z.string().min(1)).optional() }).optional(), additionalModelRequestFields: z.object({}).passthrough().optional() }) })]) }) })]).describe("The configuration for the evaluator, including LLM-as-a-Judge settings with instructions, rating scale, and model configuration."),
    level: z.enum(["TOOL_CALL", "TRACE", "SESSION"]).describe("The evaluation level that determines the scope of evaluation. Valid values are TOOL_CALL for individual tool invocations, TRACE for single request-response interactions, or SESSION for entire conversation sessions."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).optional().describe("A map of tag keys and values to assign to an AgentCore Evaluator. Tags enable you to categorize your resources in different ways, for example, by purpose, owner, or environment."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "clientToken": params.clientToken,
              "evaluatorName": params.evaluatorName,
              "description": params.description,
              "evaluatorConfig": params.evaluatorConfig,
              "level": params.level,
              "tags": params.tags,
            };
      const result = await callApi("POST", "/evaluators/create", body, undefined, undefined);
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

// Tool: get-evaluator
server.registerTool(
  "get-evaluator",
  {
    description: "Retrieves detailed information about an evaluator, including its configuration, status, and metadata. Works with both built-in and custom evaluators.",
    inputSchema: z.object({
    evaluatorId: z.string().regex(new RegExp("^(Builtin.[a-zA-Z0-9_-]+|[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10})$")).describe("The unique identifier of the evaluator to retrieve. Can be a built-in evaluator ID (e.g., Builtin.Helpfulness) or a custom evaluator ID."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              evaluatorId: String(params.evaluatorId),
            };
      const result = await callApi("GET", "/evaluators/{evaluatorId}", undefined, pathParams, undefined);
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

// Tool: update-evaluator
server.registerTool(
  "update-evaluator",
  {
    description: "Updates a custom evaluator's configuration, description, or evaluation level. Built-in evaluators cannot be updated. The evaluator must not be locked for modification.",
    inputSchema: z.object({
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If you don't specify this field, a value is randomly generated for you. If this token matches a previous request, the service ignores the request, but doesn't return an error. For more information, see Ensuring idempotency."),
    evaluatorId: z.string().regex(new RegExp("^(Builtin.[a-zA-Z0-9_-]+|[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10})$")).describe("The unique identifier of the evaluator to update."),
    description: z.string().min(1).max(200).optional().describe("The updated description of the evaluator."),
    evaluatorConfig: z.union([z.object({ llmAsAJudge: z.object({ instructions: z.string(), ratingScale: z.union([z.object({ numerical: z.array(z.object({ definition: z.string(), value: z.number(), label: z.string() })) }), z.object({ categorical: z.array(z.object({ definition: z.string(), label: z.string() })) })]), modelConfig: z.union([z.object({ bedrockEvaluatorModelConfig: z.object({ modelId: z.string(), inferenceConfig: z.object({ maxTokens: z.number().int().optional(), temperature: z.number().optional(), topP: z.number().optional(), stopSequences: z.array(z.string().min(1)).optional() }).optional(), additionalModelRequestFields: z.object({}).passthrough().optional() }) })]) }) })]).optional().describe("The updated configuration for the evaluator, including LLM-as-a-Judge settings with instructions, rating scale, and model configuration."),
    level: z.enum(["TOOL_CALL", "TRACE", "SESSION"]).optional().describe("The updated evaluation level (TOOL_CALL, TRACE, or SESSION) that determines the scope of evaluation."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              evaluatorId: String(params.evaluatorId),
            };
      const body = {
              "clientToken": params.clientToken,
              "description": params.description,
              "evaluatorConfig": params.evaluatorConfig,
              "level": params.level,
            };
      const result = await callApi("PUT", "/evaluators/{evaluatorId}", body, pathParams, undefined);
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

// Tool: delete-evaluator
server.registerTool(
  "delete-evaluator",
  {
    description: "Deletes a custom evaluator. Builtin evaluators cannot be deleted. The evaluator must not be referenced by any active online evaluation configurations.",
    inputSchema: z.object({
    evaluatorId: z.string().regex(new RegExp("^(Builtin.[a-zA-Z0-9_-]+|[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10})$")).describe("The unique identifier of the evaluator to delete."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              evaluatorId: String(params.evaluatorId),
            };
      const result = await callApi("DELETE", "/evaluators/{evaluatorId}", undefined, pathParams, undefined);
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

// Tool: list-evaluators
server.registerTool(
  "list-evaluators",
  {
    description: "Lists all available evaluators, including both builtin evaluators provided by the service and custom evaluators created by the user. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: evaluators]",
    inputSchema: z.object({
    nextToken: z.string().optional().describe("The pagination token from a previous request to retrieve the next page of results."),
    maxResults: z.number().int().optional().describe("The maximum number of evaluators to return in a single response."),
  }),
  },
  async (params) => {
    try {
      const queryParams = {
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
            };
      const result = await callApi("POST", "/evaluators", undefined, undefined, queryParams);
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

// Tool: create-gateway
server.registerTool(
  "create-gateway",
  {
    description: "Creates a gateway for Amazon Bedrock Agent. A gateway serves as an integration point between your agent and external services. If you specify CUSTOM_JWT as the authorizerType, you must provide an authorizerConfiguration.",
    inputSchema: z.object({
    name: z.string().regex(new RegExp("^([0-9a-zA-Z][-]?){1,100}$")).describe("The name of the gateway. The name must be unique within your account."),
    description: z.string().min(1).max(200).optional().describe("The description of the gateway."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If you don't specify this field, a value is randomly generated for you. If this token matches a previous request, the service ignores the request, but doesn't return an error. For more information, see Ensuring idempotency."),
    roleArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(-[^:]+)?:iam::([0-9]{12})?:role/.+$")).describe("The Amazon Resource Name (ARN) of the IAM role that provides permissions for the gateway to access Amazon Web Services services."),
    protocolType: z.enum(["MCP"]).describe("The protocol type for the gateway."),
    protocolConfiguration: z.union([z.object({ mcp: z.object({ supportedVersions: z.array(z.string().default("2025-03-26")).optional(), instructions: z.string().min(1).max(2048).optional(), searchType: z.enum(["SEMANTIC"]).optional() }) })]).optional().describe("The configuration settings for the protocol specified in the protocolType parameter."),
    authorizerType: z.enum(["CUSTOM_JWT", "AWS_IAM", "NONE"]).describe("The type of authorizer to use for the gateway. CUSTOM_JWT - Authorize with a bearer token. AWS_IAM - Authorize with your Amazon Web Services IAM credentials. NONE - No authorization"),
    authorizerConfiguration: z.union([z.object({ customJWTAuthorizer: z.object({ discoveryUrl: z.string().regex(new RegExp("^.+/\\.well-known/openid-configuration$")), allowedAudience: z.array(z.string()).optional(), allowedClients: z.array(z.string()).optional(), allowedScopes: z.array(z.string().min(1).max(255).regex(new RegExp("^[\\x21\\x23-\\x5B\\x5D-\\x7E]+$"))).optional(), customClaims: z.array(z.object({ inboundTokenClaimName: z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-:]+$")), inboundTokenClaimValueType: z.enum(["STRING", "STRING_ARRAY"]), authorizingClaimMatchValue: z.object({ claimMatchValue: z.union([z.object({ matchValueString: z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")) }), z.object({ matchValueStringList: z.array(z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$"))) })]), claimMatchOperator: z.enum(["EQUALS", "CONTAINS", "CONTAINS_ANY"]) }) })).optional() }) })]).optional().describe("The authorizer configuration for the gateway. Required if authorizerType is CUSTOM_JWT."),
    kmsKeyArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(|-cn|-us-gov):kms:[a-zA-Z0-9-]*:[0-9]{12}:key/[a-zA-Z0-9-]{36}$")).optional().describe("The Amazon Resource Name (ARN) of the KMS key used to encrypt data associated with the gateway."),
    interceptorConfigurations: z.array(z.object({ interceptor: z.union([z.object({ lambda: z.object({ arn: z.string().min(1).max(170).regex(new RegExp("^arn:(aws[a-zA-Z-]*)?:lambda:([a-z]{2}(-gov)?-[a-z]+-\\d{1}):(\\d{12}):function:([a-zA-Z0-9-_.]+)(:(\\$LATEST|[a-zA-Z0-9-]+))?$")) }) })]), interceptionPoints: z.array(z.enum(["REQUEST", "RESPONSE"])), inputConfiguration: z.object({ passRequestHeaders: z.boolean() }).optional() })).optional().describe("A list of configuration settings for a gateway interceptor. Gateway interceptors allow custom code to be invoked during gateway invocations."),
    policyEngineConfiguration: z.object({ arn: z.string().min(1).max(170).regex(new RegExp("^arn:aws:bedrock-agentcore:[a-z0-9-]+:[0-9]{12}:policy-engine\\/[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9_]{10}$")), mode: z.enum(["LOG_ONLY", "ENFORCE"]) }).optional().describe("The policy engine configuration for the gateway. A policy engine is a collection of policies that evaluates and authorizes agent tool calls. When associated with a gateway, the policy engine intercepts all agent requests and determines whether to allow or deny each action based on the defined policies."),
    exceptionLevel: z.enum(["DEBUG"]).optional().describe("The level of detail in error messages returned when invoking the gateway. If the value is DEBUG, granular exception messages are returned to help a user debug the gateway. If the value is omitted, a generic error message is returned to the end user."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).optional().describe("A map of key-value pairs to associate with the gateway as metadata tags."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
              "description": params.description,
              "clientToken": params.clientToken,
              "roleArn": params.roleArn,
              "protocolType": params.protocolType,
              "protocolConfiguration": params.protocolConfiguration,
              "authorizerType": params.authorizerType,
              "authorizerConfiguration": params.authorizerConfiguration,
              "kmsKeyArn": params.kmsKeyArn,
              "interceptorConfigurations": params.interceptorConfigurations,
              "policyEngineConfiguration": params.policyEngineConfiguration,
              "exceptionLevel": params.exceptionLevel,
              "tags": params.tags,
            };
      const result = await callApi("POST", "/gateways/", body, undefined, undefined);
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

// Tool: delete-gateway
server.registerTool(
  "delete-gateway",
  {
    description: "Deletes a gateway.",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The identifier of the gateway to delete."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
            };
      const result = await callApi("DELETE", "/gateways/{gatewayIdentifier}/", undefined, pathParams, undefined);
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

// Tool: get-gateway
server.registerTool(
  "get-gateway",
  {
    description: "Retrieves information about a specific Gateway.",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The identifier of the gateway to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
            };
      const result = await callApi("GET", "/gateways/{gatewayIdentifier}/", undefined, pathParams, undefined);
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

// Tool: list-gateways
server.registerTool(
  "list-gateways",
  {
    description: "Lists all gateways in the account. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: items]",
    inputSchema: z.object({
    maxResults: z.number().int().min(1).max(1000).optional().describe("The maximum number of results to return in the response. If the total number of results is greater than this value, use the token returned in the response in the nextToken field when making another request to return the next batch of results."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("If the total number of results is greater than the maxResults value provided in the request, enter the token returned in the nextToken field in the response in this field to return the next batch of results."),
  }),
  },
  async (params) => {
    try {
      const queryParams = {
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
            };
      const result = await callApi("GET", "/gateways/", undefined, undefined, queryParams);
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

// Tool: update-gateway
server.registerTool(
  "update-gateway",
  {
    description: "Updates an existing gateway.",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The identifier of the gateway to update."),
    name: z.string().regex(new RegExp("^([0-9a-zA-Z][-]?){1,100}$")).describe("The name of the gateway. This name must be the same as the one when the gateway was created."),
    description: z.string().min(1).max(200).optional().describe("The updated description for the gateway."),
    roleArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(-[^:]+)?:iam::([0-9]{12})?:role/.+$")).describe("The updated IAM role ARN that provides permissions for the gateway."),
    protocolType: z.enum(["MCP"]).describe("The updated protocol type for the gateway."),
    protocolConfiguration: z.union([z.object({ mcp: z.object({ supportedVersions: z.array(z.string().default("2025-03-26")).optional(), instructions: z.string().min(1).max(2048).optional(), searchType: z.enum(["SEMANTIC"]).optional() }) })]).optional(),
    authorizerType: z.enum(["CUSTOM_JWT", "AWS_IAM", "NONE"]).describe("The updated authorizer type for the gateway."),
    authorizerConfiguration: z.union([z.object({ customJWTAuthorizer: z.object({ discoveryUrl: z.string().regex(new RegExp("^.+/\\.well-known/openid-configuration$")), allowedAudience: z.array(z.string()).optional(), allowedClients: z.array(z.string()).optional(), allowedScopes: z.array(z.string().min(1).max(255).regex(new RegExp("^[\\x21\\x23-\\x5B\\x5D-\\x7E]+$"))).optional(), customClaims: z.array(z.object({ inboundTokenClaimName: z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-:]+$")), inboundTokenClaimValueType: z.enum(["STRING", "STRING_ARRAY"]), authorizingClaimMatchValue: z.object({ claimMatchValue: z.union([z.object({ matchValueString: z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")) }), z.object({ matchValueStringList: z.array(z.string().min(1).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$"))) })]), claimMatchOperator: z.enum(["EQUALS", "CONTAINS", "CONTAINS_ANY"]) }) })).optional() }) })]).optional().describe("The updated authorizer configuration for the gateway."),
    kmsKeyArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(|-cn|-us-gov):kms:[a-zA-Z0-9-]*:[0-9]{12}:key/[a-zA-Z0-9-]{36}$")).optional().describe("The updated ARN of the KMS key used to encrypt the gateway."),
    interceptorConfigurations: z.array(z.object({ interceptor: z.union([z.object({ lambda: z.object({ arn: z.string().min(1).max(170).regex(new RegExp("^arn:(aws[a-zA-Z-]*)?:lambda:([a-z]{2}(-gov)?-[a-z]+-\\d{1}):(\\d{12}):function:([a-zA-Z0-9-_.]+)(:(\\$LATEST|[a-zA-Z0-9-]+))?$")) }) })]), interceptionPoints: z.array(z.enum(["REQUEST", "RESPONSE"])), inputConfiguration: z.object({ passRequestHeaders: z.boolean() }).optional() })).optional().describe("The updated interceptor configurations for the gateway."),
    policyEngineConfiguration: z.object({ arn: z.string().min(1).max(170).regex(new RegExp("^arn:aws:bedrock-agentcore:[a-z0-9-]+:[0-9]{12}:policy-engine\\/[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9_]{10}$")), mode: z.enum(["LOG_ONLY", "ENFORCE"]) }).optional().describe("The updated policy engine configuration for the gateway. A policy engine is a collection of policies that evaluates and authorizes agent tool calls. When associated with a gateway, the policy engine intercepts all agent requests and determines whether to allow or deny each action based on the defined policies."),
    exceptionLevel: z.enum(["DEBUG"]).optional().describe("The level of detail in error messages returned when invoking the gateway. If the value is DEBUG, granular exception messages are returned to help a user debug the gateway. If the value is omitted, a generic error message is returned to the end user."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
            };
      const body = {
              "name": params.name,
              "description": params.description,
              "roleArn": params.roleArn,
              "protocolType": params.protocolType,
              "protocolConfiguration": params.protocolConfiguration,
              "authorizerType": params.authorizerType,
              "authorizerConfiguration": params.authorizerConfiguration,
              "kmsKeyArn": params.kmsKeyArn,
              "interceptorConfigurations": params.interceptorConfigurations,
              "policyEngineConfiguration": params.policyEngineConfiguration,
              "exceptionLevel": params.exceptionLevel,
            };
      const result = await callApi("PUT", "/gateways/{gatewayIdentifier}/", body, pathParams, undefined);
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

// Tool: create-gateway-target
server.registerTool(
  "create-gateway-target",
  {
    description: "Creates a target for a gateway. A target defines an endpoint that the gateway can connect to.",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The identifier of the gateway to create a target for."),
    name: z.string().regex(new RegExp("^([0-9a-zA-Z][-]?){1,100}$")).describe("The name of the gateway target. The name must be unique within the gateway."),
    description: z.string().min(1).max(200).optional().describe("The description of the gateway target."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If you don't specify this field, a value is randomly generated for you. If this token matches a previous request, the service ignores the request, but doesn't return an error. For more information, see Ensuring idempotency."),
    targetConfiguration: z.union([z.object({ mcp: z.union([z.object({ openApiSchema: z.union([z.object({ s3: z.object({ uri: z.string().regex(new RegExp("^s3://.{1,2043}$")).optional(), bucketOwnerAccountId: z.string().regex(new RegExp("^[0-9]{12}$")).optional() }) }), z.object({ inlinePayload: z.string() })]) }), z.object({ smithyModel: z.union([z.object({ s3: z.object({ uri: z.string().regex(new RegExp("^s3://.{1,2043}$")).optional(), bucketOwnerAccountId: z.string().regex(new RegExp("^[0-9]{12}$")).optional() }) }), z.object({ inlinePayload: z.string() })]) }), z.object({ lambda: z.object({ lambdaArn: z.string().min(1).max(170).regex(new RegExp("^arn:(aws[a-zA-Z-]*)?:lambda:([a-z]{2}(-gov)?-[a-z]+-\\d{1}):(\\d{12}):function:([a-zA-Z0-9-_.]+)(:(\\$LATEST|[a-zA-Z0-9-]+))?$")), toolSchema: z.union([z.object({ s3: z.object({ uri: z.string().regex(new RegExp("^s3://.{1,2043}$")).optional(), bucketOwnerAccountId: z.string().regex(new RegExp("^[0-9]{12}$")).optional() }) }), z.object({ inlinePayload: z.array(z.object({ name: z.string(), description: z.string(), inputSchema: z.object({ type: z.enum(["string", "number", "object", "array", "boolean", "integer"]), properties: z.record(z.string(), z.unknown()).optional(), required: z.array(z.unknown()).optional(), items: z.unknown().optional(), description: z.string().optional() }), outputSchema: z.object({ type: z.enum(["string", "number", "object", "array", "boolean", "integer"]), properties: z.record(z.string(), z.unknown()).optional(), required: z.array(z.unknown()).optional(), items: z.unknown().optional(), description: z.string().optional() }).optional() })) })]) }) }), z.object({ mcpServer: z.object({ endpoint: z.string() }) }), z.object({ apiGateway: z.object({ restApiId: z.string(), stage: z.string(), apiGatewayToolConfiguration: z.object({ toolOverrides: z.array(z.object({ name: z.string(), description: z.string().optional(), path: z.string(), method: z.enum(["GET", "DELETE", "HEAD", "OPTIONS", "PATCH", "PUT", "POST"]) })).optional(), toolFilters: z.array(z.object({ filterPath: z.string(), methods: z.array(z.enum(["GET", "DELETE", "HEAD", "OPTIONS", "PATCH", "PUT", "POST"])) })) }) }) })]) })]).describe("The configuration settings for the target, including endpoint information and schema definitions."),
    credentialProviderConfigurations: z.array(z.object({ credentialProviderType: z.enum(["GATEWAY_IAM_ROLE", "OAUTH", "API_KEY"]), credentialProvider: z.union([z.object({ oauthCredentialProvider: z.object({ providerArn: z.string().regex(new RegExp("^arn:([^:]*):([^:]*):([^:]*):([0-9]{12})?:(.+)$")), scopes: z.array(z.string().min(1).max(64)), customParameters: z.record(z.string(), z.string().min(1).max(2048)).optional(), grantType: z.enum(["CLIENT_CREDENTIALS", "AUTHORIZATION_CODE"]).optional(), defaultReturnUrl: z.string().min(1).max(2048).regex(new RegExp("^\\w+:(\\/?\\/?)[^\\s]+$")).optional() }) }), z.object({ apiKeyCredentialProvider: z.object({ providerArn: z.string().regex(new RegExp("^arn:([^:]*):([^:]*):([^:]*):([0-9]{12})?:(.+)$")), credentialParameterName: z.string().min(1).max(64).optional(), credentialPrefix: z.string().min(1).max(64).optional(), credentialLocation: z.enum(["HEADER", "QUERY_PARAMETER"]).optional() }) })]).optional() })).optional().describe("The credential provider configurations for the target. These configurations specify how the gateway authenticates with the target endpoint."),
    metadataConfiguration: z.object({ allowedRequestHeaders: z.array(z.string().min(1).max(100)).optional(), allowedQueryParameters: z.array(z.string().min(1).max(40)).optional(), allowedResponseHeaders: z.array(z.string().min(1).max(100)).optional() }).optional().describe("Optional configuration for HTTP header and query parameter propagation to and from the gateway target."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
            };
      const body = {
              "name": params.name,
              "description": params.description,
              "clientToken": params.clientToken,
              "targetConfiguration": params.targetConfiguration,
              "credentialProviderConfigurations": params.credentialProviderConfigurations,
              "metadataConfiguration": params.metadataConfiguration,
            };
      const result = await callApi("POST", "/gateways/{gatewayIdentifier}/targets/", body, pathParams, undefined);
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

// Tool: delete-gateway-target
server.registerTool(
  "delete-gateway-target",
  {
    description: "Deletes a gateway target.",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The unique identifier of the gateway associated with the target."),
    targetId: z.string().regex(new RegExp("^[0-9a-zA-Z]{10}$")).describe("The unique identifier of the gateway target to delete."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
              targetId: String(params.targetId),
            };
      const result = await callApi("DELETE", "/gateways/{gatewayIdentifier}/targets/{targetId}/", undefined, pathParams, undefined);
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

// Tool: get-gateway-target
server.registerTool(
  "get-gateway-target",
  {
    description: "Retrieves information about a specific gateway target.",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The identifier of the gateway that contains the target."),
    targetId: z.string().regex(new RegExp("^[0-9a-zA-Z]{10}$")).describe("The unique identifier of the target to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
              targetId: String(params.targetId),
            };
      const result = await callApi("GET", "/gateways/{gatewayIdentifier}/targets/{targetId}/", undefined, pathParams, undefined);
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

// Tool: list-gateway-targets
server.registerTool(
  "list-gateway-targets",
  {
    description: "Lists all targets for a specific gateway. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: items]",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The identifier of the gateway to list targets for."),
    maxResults: z.number().int().min(1).max(1000).optional().describe("The maximum number of results to return in the response. If the total number of results is greater than this value, use the token returned in the response in the nextToken field when making another request to return the next batch of results."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("If the total number of results is greater than the maxResults value provided in the request, enter the token returned in the nextToken field in the response in this field to return the next batch of results."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
            };
      const queryParams = {
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
            };
      const result = await callApi("GET", "/gateways/{gatewayIdentifier}/targets/", undefined, pathParams, queryParams);
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

// Tool: synchronize-gateway-targets
server.registerTool(
  "synchronize-gateway-targets",
  {
    description: "The gateway targets.",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The gateway Identifier."),
    targetIdList: z.array(z.string().regex(new RegExp("^[0-9a-zA-Z]{10}$"))).describe("The target ID list."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
            };
      const body = {
              "targetIdList": params.targetIdList,
            };
      const result = await callApi("PUT", "/gateways/{gatewayIdentifier}/synchronizeTargets", body, pathParams, undefined);
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

// Tool: update-gateway-target
server.registerTool(
  "update-gateway-target",
  {
    description: "Updates an existing gateway target.",
    inputSchema: z.object({
    gatewayIdentifier: z.string().regex(new RegExp("^([0-9a-z][-]?){1,100}-[0-9a-z]{10}$")).describe("The unique identifier of the gateway associated with the target."),
    targetId: z.string().regex(new RegExp("^[0-9a-zA-Z]{10}$")).describe("The unique identifier of the gateway target to update."),
    name: z.string().regex(new RegExp("^([0-9a-zA-Z][-]?){1,100}$")).describe("The updated name for the gateway target."),
    description: z.string().min(1).max(200).optional().describe("The updated description for the gateway target."),
    targetConfiguration: z.union([z.object({ mcp: z.union([z.object({ openApiSchema: z.union([z.object({ s3: z.object({ uri: z.string().regex(new RegExp("^s3://.{1,2043}$")).optional(), bucketOwnerAccountId: z.string().regex(new RegExp("^[0-9]{12}$")).optional() }) }), z.object({ inlinePayload: z.string() })]) }), z.object({ smithyModel: z.union([z.object({ s3: z.object({ uri: z.string().regex(new RegExp("^s3://.{1,2043}$")).optional(), bucketOwnerAccountId: z.string().regex(new RegExp("^[0-9]{12}$")).optional() }) }), z.object({ inlinePayload: z.string() })]) }), z.object({ lambda: z.object({ lambdaArn: z.string().min(1).max(170).regex(new RegExp("^arn:(aws[a-zA-Z-]*)?:lambda:([a-z]{2}(-gov)?-[a-z]+-\\d{1}):(\\d{12}):function:([a-zA-Z0-9-_.]+)(:(\\$LATEST|[a-zA-Z0-9-]+))?$")), toolSchema: z.union([z.object({ s3: z.object({ uri: z.string().regex(new RegExp("^s3://.{1,2043}$")).optional(), bucketOwnerAccountId: z.string().regex(new RegExp("^[0-9]{12}$")).optional() }) }), z.object({ inlinePayload: z.array(z.object({ name: z.string(), description: z.string(), inputSchema: z.object({ type: z.enum(["string", "number", "object", "array", "boolean", "integer"]), properties: z.record(z.string(), z.unknown()).optional(), required: z.array(z.unknown()).optional(), items: z.unknown().optional(), description: z.string().optional() }), outputSchema: z.object({ type: z.enum(["string", "number", "object", "array", "boolean", "integer"]), properties: z.record(z.string(), z.unknown()).optional(), required: z.array(z.unknown()).optional(), items: z.unknown().optional(), description: z.string().optional() }).optional() })) })]) }) }), z.object({ mcpServer: z.object({ endpoint: z.string() }) }), z.object({ apiGateway: z.object({ restApiId: z.string(), stage: z.string(), apiGatewayToolConfiguration: z.object({ toolOverrides: z.array(z.object({ name: z.string(), description: z.string().optional(), path: z.string(), method: z.enum(["GET", "DELETE", "HEAD", "OPTIONS", "PATCH", "PUT", "POST"]) })).optional(), toolFilters: z.array(z.object({ filterPath: z.string(), methods: z.array(z.enum(["GET", "DELETE", "HEAD", "OPTIONS", "PATCH", "PUT", "POST"])) })) }) }) })]) })]),
    credentialProviderConfigurations: z.array(z.object({ credentialProviderType: z.enum(["GATEWAY_IAM_ROLE", "OAUTH", "API_KEY"]), credentialProvider: z.union([z.object({ oauthCredentialProvider: z.object({ providerArn: z.string().regex(new RegExp("^arn:([^:]*):([^:]*):([^:]*):([0-9]{12})?:(.+)$")), scopes: z.array(z.string().min(1).max(64)), customParameters: z.record(z.string(), z.string().min(1).max(2048)).optional(), grantType: z.enum(["CLIENT_CREDENTIALS", "AUTHORIZATION_CODE"]).optional(), defaultReturnUrl: z.string().min(1).max(2048).regex(new RegExp("^\\w+:(\\/?\\/?)[^\\s]+$")).optional() }) }), z.object({ apiKeyCredentialProvider: z.object({ providerArn: z.string().regex(new RegExp("^arn:([^:]*):([^:]*):([^:]*):([0-9]{12})?:(.+)$")), credentialParameterName: z.string().min(1).max(64).optional(), credentialPrefix: z.string().min(1).max(64).optional(), credentialLocation: z.enum(["HEADER", "QUERY_PARAMETER"]).optional() }) })]).optional() })).optional().describe("The updated credential provider configurations for the gateway target."),
    metadataConfiguration: z.object({ allowedRequestHeaders: z.array(z.string().min(1).max(100)).optional(), allowedQueryParameters: z.array(z.string().min(1).max(40)).optional(), allowedResponseHeaders: z.array(z.string().min(1).max(100)).optional() }).optional().describe("Configuration for HTTP header and query parameter propagation to the gateway target."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              gatewayIdentifier: String(params.gatewayIdentifier),
              targetId: String(params.targetId),
            };
      const body = {
              "name": params.name,
              "description": params.description,
              "targetConfiguration": params.targetConfiguration,
              "credentialProviderConfigurations": params.credentialProviderConfigurations,
              "metadataConfiguration": params.metadataConfiguration,
            };
      const result = await callApi("PUT", "/gateways/{gatewayIdentifier}/targets/{targetId}/", body, pathParams, undefined);
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

// Tool: create-memory
server.registerTool(
  "create-memory",
  {
    description: "Creates a new Amazon Bedrock AgentCore Memory resource.",
    inputSchema: z.object({
    clientToken: z.string().min(1).optional().describe("A unique, case-sensitive identifier to ensure that the operation completes no more than one time. If this token matches a previous request, Amazon Bedrock ignores the request but does not return an error."),
    name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the memory. The name must be unique within your account."),
    description: z.string().min(1).max(4096).optional().describe("The description of the memory."),
    encryptionKeyArn: z.string().regex(new RegExp("^arn:[a-z0-9-\\.]{1,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[^/].{0,1023}$")).optional().describe("The Amazon Resource Name (ARN) of the KMS key used to encrypt the memory data."),
    memoryExecutionRoleArn: z.string().regex(new RegExp("^arn:[a-z0-9-\\.]{1,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[^/].{0,1023}$")).optional().describe("The Amazon Resource Name (ARN) of the IAM role that provides permissions for the memory to access Amazon Web Services services."),
    eventExpiryDuration: z.number().int().describe("The duration after which memory events expire. Specified as an ISO 8601 duration."),
    memoryStrategies: z.array(z.union([z.object({ semanticMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }) }), z.object({ summaryMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }) }), z.object({ userPreferenceMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }) }), z.object({ customMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional(), configuration: z.union([z.object({ semanticOverride: z.object({ extraction: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional(), consolidation: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional() }) }), z.object({ summaryOverride: z.object({ consolidation: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional() }) }), z.object({ userPreferenceOverride: z.object({ extraction: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional(), consolidation: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional() }) }), z.object({ episodicOverride: z.object({ extraction: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional(), consolidation: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional(), reflection: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }).optional() }) }), z.object({ selfManagedConfiguration: z.object({ triggerConditions: z.array(z.union([z.object({ messageBasedTrigger: z.object({ messageCount: z.unknown().optional() }) }), z.object({ tokenBasedTrigger: z.object({ tokenCount: z.unknown().optional() }) }), z.object({ timeBasedTrigger: z.object({ idleSessionTimeout: z.unknown().optional() }) })])).optional(), invocationConfiguration: z.object({ topicArn: z.string().regex(new RegExp("^arn:[a-z0-9-\\.]{1,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[^/].{0,1023}$")), payloadDeliveryBucketName: z.string() }), historicalContextWindowSize: z.number().int().optional() }) })]).optional() }) }), z.object({ episodicMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional(), reflectionConfiguration: z.object({ namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))) }).optional() }) })])).optional().describe("The memory strategies to use for this memory. Strategies define how information is extracted, processed, and consolidated."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).optional().describe("A map of tag keys and values to assign to an AgentCore Memory. Tags enable you to categorize your resources in different ways, for example, by purpose, owner, or environment."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "clientToken": params.clientToken,
              "name": params.name,
              "description": params.description,
              "encryptionKeyArn": params.encryptionKeyArn,
              "memoryExecutionRoleArn": params.memoryExecutionRoleArn,
              "eventExpiryDuration": params.eventExpiryDuration,
              "memoryStrategies": params.memoryStrategies,
              "tags": params.tags,
            };
      const result = await callApi("POST", "/memories/create", body, undefined, undefined);
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

// Tool: get-memory
server.registerTool(
  "get-memory",
  {
    description: "Retrieve an existing Amazon Bedrock AgentCore Memory resource.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the memory to retrieve."),
    view: z.enum(["full", "without_decryption"]).optional().describe("The level of detail to return for the memory."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const queryParams = {
              "view": params.view !== undefined ? String(params.view) : undefined,
            };
      const result = await callApi("GET", "/memories/{memoryId}/details", undefined, pathParams, queryParams);
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

// Tool: update-memory
server.registerTool(
  "update-memory",
  {
    description: "Update an Amazon Bedrock AgentCore Memory resource memory.",
    inputSchema: z.object({
    clientToken: z.string().min(1).optional().describe("A client token is used for keeping track of idempotent requests. It can contain a session id which can be around 250 chars, combined with a unique AWS identifier."),
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the memory to update."),
    description: z.string().min(1).max(4096).optional().describe("The updated description of the AgentCore Memory resource."),
    eventExpiryDuration: z.number().int().optional().describe("The number of days after which memory events will expire, between 7 and 365 days."),
    memoryExecutionRoleArn: z.string().regex(new RegExp("^arn:[a-z0-9-\\.]{1,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[^/].{0,1023}$")).optional().describe("The ARN of the IAM role that provides permissions for the AgentCore Memory resource."),
    memoryStrategies: z.object({ addMemoryStrategies: z.array(z.union([z.object({ semanticMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }) }), z.object({ summaryMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }) }), z.object({ userPreferenceMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }) }), z.object({ customMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional(), configuration: z.union([z.object({ semanticOverride: z.object({ extraction: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional(), consolidation: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional() }) }), z.object({ summaryOverride: z.object({ consolidation: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional() }) }), z.object({ userPreferenceOverride: z.object({ extraction: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional(), consolidation: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional() }) }), z.object({ episodicOverride: z.object({ extraction: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional(), consolidation: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }).optional(), reflection: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }).optional() }) }), z.object({ selfManagedConfiguration: z.object({ triggerConditions: z.array(z.union([z.object({ messageBasedTrigger: z.unknown() }), z.object({ tokenBasedTrigger: z.unknown() }), z.object({ timeBasedTrigger: z.unknown() })])).optional(), invocationConfiguration: z.object({ topicArn: z.string().regex(new RegExp("^arn:[a-z0-9-\\.]{1,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[^/].{0,1023}$")), payloadDeliveryBucketName: z.string() }), historicalContextWindowSize: z.number().int().optional() }) })]).optional() }) }), z.object({ episodicMemoryStrategy: z.object({ name: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional(), reflectionConfiguration: z.object({ namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))) }).optional() }) })])).optional(), modifyMemoryStrategies: z.array(z.object({ memoryStrategyId: z.string(), description: z.string().min(1).max(4096).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional(), configuration: z.object({ extraction: z.union([z.object({ customExtractionConfiguration: z.union([z.object({ semanticExtractionOverride: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }) }), z.object({ userPreferenceExtractionOverride: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }) }), z.object({ episodicExtractionOverride: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }) })]) })]).optional(), consolidation: z.union([z.object({ customConsolidationConfiguration: z.union([z.object({ semanticConsolidationOverride: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }) }), z.object({ summaryConsolidationOverride: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }) }), z.object({ userPreferenceConsolidationOverride: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }) }), z.object({ episodicConsolidationOverride: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string() }) })]) })]).optional(), reflection: z.union([z.object({ episodicReflectionConfiguration: z.object({ namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))) }) }), z.object({ customReflectionConfiguration: z.union([z.object({ episodicReflectionOverride: z.object({ appendToPrompt: z.string().min(1).max(30000), modelId: z.string(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9\\-_\\/]*(\\{(actorId|sessionId|memoryStrategyId)\\}[a-zA-Z0-9\\-_\\/]*)*$"))).optional() }) })]) })]).optional(), selfManagedConfiguration: z.object({ triggerConditions: z.array(z.union([z.object({ messageBasedTrigger: z.object({ messageCount: z.number().int().optional() }) }), z.object({ tokenBasedTrigger: z.object({ tokenCount: z.number().int().optional() }) }), z.object({ timeBasedTrigger: z.object({ idleSessionTimeout: z.number().int().optional() }) })])).optional(), invocationConfiguration: z.object({ topicArn: z.string().regex(new RegExp("^arn:[a-z0-9-\\.]{1,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[a-z0-9-\\.]{0,63}:[^/].{0,1023}$")).optional(), payloadDeliveryBucketName: z.string().optional() }).optional(), historicalContextWindowSize: z.number().int().optional() }).optional() }).optional() })).optional(), deleteMemoryStrategies: z.array(z.object({ memoryStrategyId: z.string() })).optional() }).optional().describe("The memory strategies to add, modify, or delete."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              "clientToken": params.clientToken,
              "description": params.description,
              "eventExpiryDuration": params.eventExpiryDuration,
              "memoryExecutionRoleArn": params.memoryExecutionRoleArn,
              "memoryStrategies": params.memoryStrategies,
            };
      const result = await callApi("PUT", "/memories/{memoryId}/update", body, pathParams, undefined);
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

// Tool: delete-memory
server.registerTool(
  "delete-memory",
  {
    description: "Deletes an Amazon Bedrock AgentCore Memory resource.",
    inputSchema: z.object({
    clientToken: z.string().min(1).optional().describe("A client token is used for keeping track of idempotent requests. It can contain a session id which can be around 250 chars, combined with a unique AWS identifier."),
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the memory to delete."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const queryParams = {
              "clientToken": params.clientToken !== undefined ? String(params.clientToken) : undefined,
            };
      const result = await callApi("DELETE", "/memories/{memoryId}/delete", undefined, pathParams, queryParams);
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

// Tool: list-memories
server.registerTool(
  "list-memories",
  {
    description: "Lists the available Amazon Bedrock AgentCore Memory resources in the current Amazon Web Services Region. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: memories]",
    inputSchema: z.object({
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 10. The maximum value is 50."),
    nextToken: z.string().optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "maxResults": params.maxResults,
              "nextToken": params.nextToken,
            };
      const result = await callApi("POST", "/memories/", body, undefined, undefined);
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

// Tool: get-oauth2-credential-provider
server.registerTool(
  "get-oauth2-credential-provider",
  {
    description: "Retrieves information about an OAuth2 credential provider.",
    inputSchema: z.object({
    name: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).describe("The name of the OAuth2 credential provider to retrieve."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
            };
      const result = await callApi("POST", "/identities/GetOauth2CredentialProvider", body, undefined, undefined);
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

// Tool: update-oauth2-credential-provider
server.registerTool(
  "update-oauth2-credential-provider",
  {
    description: "Updates an existing OAuth2 credential provider.",
    inputSchema: z.object({
    name: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).describe("The name of the OAuth2 credential provider to update."),
    credentialProviderVendor: z.enum(["GoogleOauth2", "GithubOauth2", "SlackOauth2", "SalesforceOauth2", "MicrosoftOauth2", "CustomOauth2", "AtlassianOauth2", "LinkedinOauth2", "XOauth2", "OktaOauth2", "OneLoginOauth2", "PingOneOauth2", "FacebookOauth2", "YandexOauth2", "RedditOauth2", "ZoomOauth2", "TwitchOauth2", "SpotifyOauth2", "DropboxOauth2", "NotionOauth2", "HubspotOauth2", "CyberArkOauth2", "FusionAuthOauth2", "Auth0Oauth2", "CognitoOauth2"]).describe("The vendor of the OAuth2 credential provider."),
    oauth2ProviderConfigInput: z.union([z.object({ customOauth2ProviderConfig: z.object({ oauthDiscovery: z.union([z.object({ discoveryUrl: z.string().regex(new RegExp("^.+/\\.well-known/openid-configuration$")) }), z.object({ authorizationServerMetadata: z.object({ issuer: z.string(), authorizationEndpoint: z.string(), tokenEndpoint: z.string(), responseTypes: z.array(z.string()).optional(), tokenEndpointAuthMethods: z.array(z.string().regex(new RegExp("^(client_secret_post|client_secret_basic)$"))).optional() }) })]), clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048) }) }), z.object({ googleOauth2ProviderConfig: z.object({ clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048) }) }), z.object({ githubOauth2ProviderConfig: z.object({ clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048) }) }), z.object({ slackOauth2ProviderConfig: z.object({ clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048) }) }), z.object({ salesforceOauth2ProviderConfig: z.object({ clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048) }) }), z.object({ microsoftOauth2ProviderConfig: z.object({ clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048), tenantId: z.string().min(1).max(2048).optional() }) }), z.object({ atlassianOauth2ProviderConfig: z.object({ clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048) }) }), z.object({ linkedinOauth2ProviderConfig: z.object({ clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048) }) }), z.object({ includedOauth2ProviderConfig: z.object({ clientId: z.string().min(1).max(256), clientSecret: z.string().min(1).max(2048), issuer: z.string().optional(), authorizationEndpoint: z.string().optional(), tokenEndpoint: z.string().optional() }) })]).describe("The configuration input for the OAuth2 provider."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
              "credentialProviderVendor": params.credentialProviderVendor,
              "oauth2ProviderConfigInput": params.oauth2ProviderConfigInput,
            };
      const result = await callApi("POST", "/identities/UpdateOauth2CredentialProvider", body, undefined, undefined);
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

// Tool: delete-oauth2-credential-provider
server.registerTool(
  "delete-oauth2-credential-provider",
  {
    description: "Deletes an OAuth2 credential provider.",
    inputSchema: z.object({
    name: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).describe("The name of the OAuth2 credential provider to delete."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
            };
      const result = await callApi("POST", "/identities/DeleteOauth2CredentialProvider", body, undefined, undefined);
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

// Tool: list-oauth2-credential-providers
server.registerTool(
  "list-oauth2-credential-providers",
  {
    description: "Lists all OAuth2 credential providers in your account. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: credentialProviders]",
    inputSchema: z.object({
    nextToken: z.string().optional().describe("Pagination token."),
    maxResults: z.number().int().optional().describe("Maximum number of results to return."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "nextToken": params.nextToken,
              "maxResults": params.maxResults,
            };
      const result = await callApi("POST", "/identities/ListOauth2CredentialProviders", body, undefined, undefined);
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

// Tool: create-online-evaluation-config
server.registerTool(
  "create-online-evaluation-config",
  {
    description: "Creates an online evaluation configuration for continuous monitoring of agent performance. Online evaluation automatically samples live traffic from CloudWatch logs at specified rates and applies evaluators to assess agent quality in production.",
    inputSchema: z.object({
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If you don't specify this field, a value is randomly generated for you. If this token matches a previous request, the service ignores the request, but doesn't return an error. For more information, see Ensuring idempotency."),
    onlineEvaluationConfigName: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9_]{0,47}$")).describe("The name of the online evaluation configuration. Must be unique within your account."),
    description: z.string().min(1).max(200).regex(new RegExp("^.+$")).optional().describe("The description of the online evaluation configuration that explains its monitoring purpose and scope."),
    rule: z.object({ samplingConfig: z.object({ samplingPercentage: z.number().min(0.01).max(100) }), filters: z.array(z.object({ key: z.string(), operator: z.enum(["Equals", "NotEquals", "GreaterThan", "LessThan", "GreaterThanOrEqual", "LessThanOrEqual", "Contains", "NotContains"]), value: z.union([z.object({ stringValue: z.string() }), z.object({ doubleValue: z.number() }), z.object({ booleanValue: z.boolean() })]) })).optional(), sessionConfig: z.object({ sessionTimeoutMinutes: z.number().int() }).optional() }).describe("The evaluation rule that defines sampling configuration, filters, and session detection settings for the online evaluation."),
    dataSourceConfig: z.union([z.object({ cloudWatchLogs: z.object({ logGroupNames: z.array(z.string().min(1).max(512).regex(new RegExp("^[.\\-_/#A-Za-z0-9]+$"))), serviceNames: z.array(z.string().min(1).max(256).regex(new RegExp("^[a-zA-Z0-9._-]+$"))) }) })]).describe("The data source configuration that specifies CloudWatch log groups and service names to monitor for agent traces."),
    evaluators: z.array(z.union([z.object({ evaluatorId: z.string().regex(new RegExp("^(Builtin.[a-zA-Z0-9_-]+|[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10})$")) })])).describe("The list of evaluators to apply during online evaluation. Can include both built-in evaluators and custom evaluators created with CreateEvaluator."),
    evaluationExecutionRoleArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(-[^:]+)?:iam::([0-9]{12})?:role/.+$")).describe("The Amazon Resource Name (ARN) of the IAM role that grants permissions to read from CloudWatch logs, write evaluation results, and invoke Amazon Bedrock models for evaluation."),
    enableOnCreate: z.boolean().describe("Whether to enable the online evaluation configuration immediately upon creation. If true, evaluation begins automatically."),
    tags: z.record(z.string(), z.string().min(0).max(256).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$"))).optional().describe("A map of tag keys and values to assign to an AgentCore Online Evaluation Config. Tags enable you to categorize your resources in different ways, for example, by purpose, owner, or environment."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "clientToken": params.clientToken,
              "onlineEvaluationConfigName": params.onlineEvaluationConfigName,
              "description": params.description,
              "rule": params.rule,
              "dataSourceConfig": params.dataSourceConfig,
              "evaluators": params.evaluators,
              "evaluationExecutionRoleArn": params.evaluationExecutionRoleArn,
              "enableOnCreate": params.enableOnCreate,
              "tags": params.tags,
            };
      const result = await callApi("POST", "/online-evaluation-configs/create", body, undefined, undefined);
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

// Tool: get-online-evaluation-config
server.registerTool(
  "get-online-evaluation-config",
  {
    description: "Retrieves detailed information about an online evaluation configuration, including its rules, data sources, evaluators, and execution status.",
    inputSchema: z.object({
    onlineEvaluationConfigId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the online evaluation configuration to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              onlineEvaluationConfigId: String(params.onlineEvaluationConfigId),
            };
      const result = await callApi("GET", "/online-evaluation-configs/{onlineEvaluationConfigId}", undefined, pathParams, undefined);
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

// Tool: update-online-evaluation-config
server.registerTool(
  "update-online-evaluation-config",
  {
    description: "Updates an online evaluation configuration's settings, including rules, data sources, evaluators, and execution status. Changes take effect immediately for ongoing evaluations.",
    inputSchema: z.object({
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If you don't specify this field, a value is randomly generated for you. If this token matches a previous request, the service ignores the request, but doesn't return an error. For more information, see Ensuring idempotency."),
    onlineEvaluationConfigId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the online evaluation configuration to update."),
    description: z.string().min(1).max(200).regex(new RegExp("^.+$")).optional().describe("The updated description of the online evaluation configuration."),
    rule: z.object({ samplingConfig: z.object({ samplingPercentage: z.number().min(0.01).max(100) }), filters: z.array(z.object({ key: z.string(), operator: z.enum(["Equals", "NotEquals", "GreaterThan", "LessThan", "GreaterThanOrEqual", "LessThanOrEqual", "Contains", "NotContains"]), value: z.union([z.object({ stringValue: z.string() }), z.object({ doubleValue: z.number() }), z.object({ booleanValue: z.boolean() })]) })).optional(), sessionConfig: z.object({ sessionTimeoutMinutes: z.number().int() }).optional() }).optional().describe("The updated evaluation rule containing sampling configuration, filters, and session settings."),
    dataSourceConfig: z.union([z.object({ cloudWatchLogs: z.object({ logGroupNames: z.array(z.string().min(1).max(512).regex(new RegExp("^[.\\-_/#A-Za-z0-9]+$"))), serviceNames: z.array(z.string().min(1).max(256).regex(new RegExp("^[a-zA-Z0-9._-]+$"))) }) })]).optional().describe("The updated data source configuration specifying CloudWatch log groups and service names to monitor."),
    evaluators: z.array(z.union([z.object({ evaluatorId: z.string().regex(new RegExp("^(Builtin.[a-zA-Z0-9_-]+|[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10})$")) })])).optional().describe("The updated list of evaluators to apply during online evaluation."),
    evaluationExecutionRoleArn: z.string().min(1).max(2048).regex(new RegExp("^arn:aws(-[^:]+)?:iam::([0-9]{12})?:role/.+$")).optional().describe("The updated Amazon Resource Name (ARN) of the IAM role used for evaluation execution."),
    executionStatus: z.enum(["ENABLED", "DISABLED"]).optional().describe("The updated execution status to enable or disable the online evaluation."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              onlineEvaluationConfigId: String(params.onlineEvaluationConfigId),
            };
      const body = {
              "clientToken": params.clientToken,
              "description": params.description,
              "rule": params.rule,
              "dataSourceConfig": params.dataSourceConfig,
              "evaluators": params.evaluators,
              "evaluationExecutionRoleArn": params.evaluationExecutionRoleArn,
              "executionStatus": params.executionStatus,
            };
      const result = await callApi("PUT", "/online-evaluation-configs/{onlineEvaluationConfigId}", body, pathParams, undefined);
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

// Tool: delete-online-evaluation-config
server.registerTool(
  "delete-online-evaluation-config",
  {
    description: "Deletes an online evaluation configuration and stops any ongoing evaluation processes associated with it.",
    inputSchema: z.object({
    onlineEvaluationConfigId: z.string().regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the online evaluation configuration to delete."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              onlineEvaluationConfigId: String(params.onlineEvaluationConfigId),
            };
      const result = await callApi("DELETE", "/online-evaluation-configs/{onlineEvaluationConfigId}", undefined, pathParams, undefined);
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

// Tool: list-online-evaluation-configs
server.registerTool(
  "list-online-evaluation-configs",
  {
    description: "Lists all online evaluation configurations in the account, providing summary information about each configuration's status and settings. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: onlineEvaluationConfigs]",
    inputSchema: z.object({
    nextToken: z.string().optional().describe("The pagination token from a previous request to retrieve the next page of results."),
    maxResults: z.number().int().optional().describe("The maximum number of online evaluation configurations to return in a single response."),
  }),
  },
  async (params) => {
    try {
      const queryParams = {
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
            };
      const result = await callApi("POST", "/online-evaluation-configs", undefined, undefined, queryParams);
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

// Tool: create-policy-engine
server.registerTool(
  "create-policy-engine",
  {
    description: "Creates a new policy engine within the AgentCore Policy system. A policy engine is a collection of policies that evaluates and authorizes agent tool calls. When associated with Gateways (each Gateway can be associated with at most one policy engine, but multiple Gateways can be associated with the same engine), the policy engine intercepts all agent requests and determines whether to allow or deny each action based on the defined policies. This is an asynchronous operation. Use the GetPolicyEngine operation to poll the status field to track completion.",
    inputSchema: z.object({
    name: z.string().min(1).max(48).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*$")).describe("The customer-assigned immutable name for the policy engine. This name identifies the policy engine and cannot be changed after creation."),
    description: z.string().min(1).max(4096).optional().describe("A human-readable description of the policy engine's purpose and scope (1-4,096 characters). This helps administrators understand the policy engine's role in the overall governance strategy. Document which Gateway this engine will be associated with, what types of tools or workflows it governs, and the team or service responsible for maintaining it. Clear descriptions are essential when managing multiple policy engines across different services or environments."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier that you provide to ensure the idempotency of the request. If you retry a request with the same client token, the service returns the same response without creating a duplicate policy engine."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
              "description": params.description,
              "clientToken": params.clientToken,
            };
      const result = await callApi("POST", "/policy-engines", body, undefined, undefined);
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

// Tool: get-policy-engine
server.registerTool(
  "get-policy-engine",
  {
    description: "Retrieves detailed information about a specific policy engine within the AgentCore Policy system. This operation returns the complete policy engine configuration, metadata, and current status, allowing administrators to review and manage policy engine settings.",
    inputSchema: z.object({
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy engine to be retrieved. This must be a valid policy engine ID that exists within the account."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
            };
      const result = await callApi("GET", "/policy-engines/{policyEngineId}", undefined, pathParams, undefined);
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

// Tool: update-policy-engine
server.registerTool(
  "update-policy-engine",
  {
    description: "Updates an existing policy engine within the AgentCore Policy system. This operation allows modification of the policy engine description while maintaining its identity. This is an asynchronous operation. Use the GetPolicyEngine operation to poll the status field to track completion.",
    inputSchema: z.object({
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy engine to be updated."),
    description: z.string().min(1).max(4096).optional().describe("The new description for the policy engine."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
            };
      const body = {
              "description": params.description,
            };
      const result = await callApi("PUT", "/policy-engines/{policyEngineId}", body, pathParams, undefined);
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

// Tool: delete-policy-engine
server.registerTool(
  "delete-policy-engine",
  {
    description: "Deletes an existing policy engine from the AgentCore Policy system. The policy engine must not have any associated policies before deletion. Once deleted, the policy engine and all its configurations become unavailable for policy management and evaluation. This is an asynchronous operation. Use the GetPolicyEngine operation to poll the status field to track completion.",
    inputSchema: z.object({
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy engine to be deleted. This must be a valid policy engine ID that exists within the account."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
            };
      const result = await callApi("DELETE", "/policy-engines/{policyEngineId}", undefined, pathParams, undefined);
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

// Tool: list-policy-engines
server.registerTool(
  "list-policy-engines",
  {
    description: "Retrieves a list of policy engines within the AgentCore Policy system. This operation supports pagination to help administrators discover and manage policy engines across their account. Each policy engine serves as a container for related policies. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: policyEngines]",
    inputSchema: z.object({
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("A pagination token returned from a previous ListPolicyEngines call. Use this token to retrieve the next page of results when the response is paginated."),
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of policy engines to return in a single response. If not specified, the default is 10 policy engines per page, with a maximum of 100 per page."),
  }),
  },
  async (params) => {
    try {
      const queryParams = {
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
            };
      const result = await callApi("GET", "/policy-engines", undefined, undefined, queryParams);
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

// Tool: start-policy-generation
server.registerTool(
  "start-policy-generation",
  {
    description: "Initiates the AI-powered generation of Cedar policies from natural language descriptions within the AgentCore Policy system. This feature enables both technical and non-technical users to create policies by describing their authorization requirements in plain English, which is then automatically translated into formal Cedar policy statements. The generation process analyzes the natural language input along with the Gateway's tool context to produce validated policy options. Generated policy assets are automatically deleted after 7 days, so you should review and create policies from the generated assets within this timeframe. Once created, policies are permanent and not subject to this expiration. Generated policies should be reviewed and tested in log-only mode before deploying to production. Use this when you want to describe policy intent naturally rather than learning Cedar syntax, though generated policies may require refinement for complex scenarios.",
    inputSchema: z.object({
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The identifier of the policy engine that provides the context for policy generation. This engine's schema and tool context are used to ensure generated policies are valid and applicable."),
    resource: z.union([z.object({ arn: z.string().min(20).max(1011) })]).describe("The resource information that provides context for policy generation. This helps the AI understand the target resources and generate appropriate access control rules."),
    content: z.union([z.object({ rawText: z.string().min(1).max(2000) })]).describe("The natural language description of the desired policy behavior. This content is processed by AI to generate corresponding Cedar policy statements that match the described intent."),
    name: z.string().min(1).max(48).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*$")).describe("A customer-assigned name for the policy generation request. This helps track and identify generation operations, especially when running multiple generations simultaneously."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure the idempotency of the request. The AWS SDK automatically generates this token, so you don't need to provide it in most cases. If you retry a request with the same client token, the service returns the same response without starting a duplicate generation."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
            };
      const body = {
              "resource": params.resource,
              "content": params.content,
              "name": params.name,
              "clientToken": params.clientToken,
            };
      const result = await callApi("POST", "/policy-engines/{policyEngineId}/policy-generations", body, pathParams, undefined);
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

// Tool: get-policy-generation
server.registerTool(
  "get-policy-generation",
  {
    description: "Retrieves information about a policy generation request within the AgentCore Policy system. Policy generation converts natural language descriptions into Cedar policy statements using AI-powered translation, enabling non-technical users to create policies.",
    inputSchema: z.object({
    policyGenerationId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy generation request to be retrieved. This must be a valid generation ID from a previous StartPolicyGeneration call."),
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The identifier of the policy engine associated with the policy generation request. This provides the context for the generation operation and schema validation."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyGenerationId: String(params.policyGenerationId),
              policyEngineId: String(params.policyEngineId),
            };
      const result = await callApi("GET", "/policy-engines/{policyEngineId}/policy-generations/{policyGenerationId}", undefined, pathParams, undefined);
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

// Tool: list-policy-generations
server.registerTool(
  "list-policy-generations",
  {
    description: "Retrieves a list of policy generation requests within the AgentCore Policy system. This operation supports pagination and filtering to help track and manage AI-powered policy generation operations. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: policyGenerations]",
    inputSchema: z.object({
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("A pagination token for retrieving additional policy generations when results are paginated."),
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of policy generations to return in a single response."),
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The identifier of the policy engine whose policy generations to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
            };
      const queryParams = {
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
            };
      const result = await callApi("GET", "/policy-engines/{policyEngineId}/policy-generations", undefined, pathParams, queryParams);
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

// Tool: list-policy-generation-assets
server.registerTool(
  "list-policy-generation-assets",
  {
    description: "Retrieves a list of generated policy assets from a policy generation request within the AgentCore Policy system. This operation returns the actual Cedar policies and related artifacts produced by the AI-powered policy generation process, allowing users to review and select from multiple generated policy options. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: policyGenerationAssets]",
    inputSchema: z.object({
    policyGenerationId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy generation request whose assets are to be retrieved. This must be a valid generation ID from a previous StartPolicyGeneration call that has completed processing."),
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy engine associated with the policy generation request. This provides the context for the generation operation and ensures assets are retrieved from the correct policy engine."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("A pagination token returned from a previous ListPolicyGenerationAssets call. Use this token to retrieve the next page of assets when the response is paginated due to large numbers of generated policy options."),
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of policy generation assets to return in a single response. If not specified, the default is 10 assets per page, with a maximum of 100 per page. This helps control response size when dealing with policy generations that produce many alternative policy options."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyGenerationId: String(params.policyGenerationId),
              policyEngineId: String(params.policyEngineId),
            };
      const queryParams = {
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
            };
      const result = await callApi("GET", "/policy-engines/{policyEngineId}/policy-generations/{policyGenerationId}/assets", undefined, pathParams, queryParams);
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

// Tool: create-policy
server.registerTool(
  "create-policy",
  {
    description: "Creates a policy within the AgentCore Policy system. Policies provide real-time, deterministic control over agentic interactions with AgentCore Gateway. Using the Cedar policy language, you can define fine-grained policies that specify which interactions with Gateway tools are permitted based on input parameters and OAuth claims, ensuring agents operate within defined boundaries and business rules. The policy is validated during creation against the Cedar schema generated from the Gateway's tools' input schemas, which defines the available tools, their parameters, and expected data types. This is an asynchronous operation. Use the GetPolicy operation to poll the status field to track completion.",
    inputSchema: z.object({
    name: z.string().min(1).max(48).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*$")).describe("The customer-assigned immutable name for the policy. Must be unique within the account. This name is used for policy identification and cannot be changed after creation."),
    definition: z.union([z.object({ cedar: z.object({ statement: z.string().min(35).max(153600) }) })]).describe("The Cedar policy statement that defines the access control rules. This contains the actual policy logic written in Cedar policy language, specifying effect (permit or forbid), principals, actions, resources, and conditions for agent behavior control."),
    description: z.string().min(1).max(4096).optional().describe("A human-readable description of the policy's purpose and functionality (1-4,096 characters). This helps policy administrators understand the policy's intent, business rules, and operational scope. Use this field to document why the policy exists, what business requirement it addresses, and any special considerations for maintenance. Clear descriptions are essential for policy governance, auditing, and troubleshooting."),
    validationMode: z.enum(["FAIL_ON_ANY_FINDINGS", "IGNORE_ALL_FINDINGS"]).optional().describe("The validation mode for the policy creation. Determines how Cedar analyzer validation results are handled during policy creation. FAIL_ON_ANY_FINDINGS (default) runs the Cedar analyzer to validate the policy against the Cedar schema and tool context, failing creation if the analyzer detects any validation issues to ensure strict conformance. IGNORE_ALL_FINDINGS runs the Cedar analyzer but allows policy creation even if validation issues are detected, useful for testing or when the policy schema is evolving. Use FAIL_ON_ANY_FINDINGS for production policies to ensure correctness, and IGNORE_ALL_FINDINGS only when you understand and accept the analyzer findings."),
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The identifier of the policy engine which contains this policy. Policy engines group related policies and provide the execution context for policy evaluation."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure the idempotency of the request. The AWS SDK automatically generates this token, so you don't need to provide it in most cases. If you retry a request with the same client token, the service returns the same response without creating a duplicate policy."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
            };
      const body = {
              "name": params.name,
              "definition": params.definition,
              "description": params.description,
              "validationMode": params.validationMode,
              "clientToken": params.clientToken,
            };
      const result = await callApi("POST", "/policy-engines/{policyEngineId}/policies", body, pathParams, undefined);
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

// Tool: get-policy
server.registerTool(
  "get-policy",
  {
    description: "Retrieves detailed information about a specific policy within the AgentCore Policy system. This operation returns the complete policy definition, metadata, and current status, allowing administrators to review and manage policy configurations.",
    inputSchema: z.object({
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The identifier of the policy engine that manages the policy to be retrieved."),
    policyId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy to be retrieved. This must be a valid policy ID that exists within the specified policy engine."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
              policyId: String(params.policyId),
            };
      const result = await callApi("GET", "/policy-engines/{policyEngineId}/policies/{policyId}", undefined, pathParams, undefined);
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

// Tool: update-policy
server.registerTool(
  "update-policy",
  {
    description: "Updates an existing policy within the AgentCore Policy system. This operation allows modification of the policy description and definition while maintaining the policy's identity. The updated policy is validated against the Cedar schema before being applied. This is an asynchronous operation. Use the GetPolicy operation to poll the status field to track completion.",
    inputSchema: z.object({
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The identifier of the policy engine that manages the policy to be updated. This ensures the policy is updated within the correct policy engine context."),
    policyId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy to be updated. This must be a valid policy ID that exists within the specified policy engine."),
    description: z.string().min(1).max(4096).optional().describe("The new human-readable description for the policy. This optional field allows updating the policy's documentation while keeping the same policy logic."),
    definition: z.union([z.object({ cedar: z.object({ statement: z.string().min(35).max(153600) }) })]).describe("The new Cedar policy statement that defines the access control rules. This replaces the existing policy definition with new logic while maintaining the policy's identity."),
    validationMode: z.enum(["FAIL_ON_ANY_FINDINGS", "IGNORE_ALL_FINDINGS"]).optional().describe("The validation mode for the policy update. Determines how Cedar analyzer validation results are handled during policy updates. FAIL_ON_ANY_FINDINGS runs the Cedar analyzer and fails the update if validation issues are detected, ensuring the policy conforms to the Cedar schema and tool context. IGNORE_ALL_FINDINGS runs the Cedar analyzer but allows updates despite validation warnings. Use FAIL_ON_ANY_FINDINGS to ensure policy correctness during updates, especially when modifying policy logic or conditions."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
              policyId: String(params.policyId),
            };
      const body = {
              "description": params.description,
              "definition": params.definition,
              "validationMode": params.validationMode,
            };
      const result = await callApi("PUT", "/policy-engines/{policyEngineId}/policies/{policyId}", body, pathParams, undefined);
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

// Tool: delete-policy
server.registerTool(
  "delete-policy",
  {
    description: "Deletes an existing policy from the AgentCore Policy system. Once deleted, the policy can no longer be used for agent behavior control and all references to it become invalid. This is an asynchronous operation. Use the GetPolicy operation to poll the status field to track completion.",
    inputSchema: z.object({
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The identifier of the policy engine that manages the policy to be deleted. This ensures the policy is deleted from the correct policy engine context."),
    policyId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The unique identifier of the policy to be deleted. This must be a valid policy ID that exists within the specified policy engine."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
              policyId: String(params.policyId),
            };
      const result = await callApi("DELETE", "/policy-engines/{policyEngineId}/policies/{policyId}", undefined, pathParams, undefined);
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

// Tool: list-policies
server.registerTool(
  "list-policies",
  {
    description: "Retrieves a list of policies within the AgentCore Policy engine. This operation supports pagination and filtering to help administrators manage and discover policies across policy engines. Results can be filtered by policy engine or resource associations. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: policies]",
    inputSchema: z.object({
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("A pagination token returned from a previous ListPolicies call. Use this token to retrieve the next page of results when the response is paginated."),
    maxResults: z.number().int().min(1).max(100).optional().describe("The maximum number of policies to return in a single response. If not specified, the default is 10 policies per page, with a maximum of 100 per page."),
    policyEngineId: z.string().min(12).max(59).regex(new RegExp("^[A-Za-z][A-Za-z0-9_]*-[a-z0-9_]{10}$")).describe("The identifier of the policy engine whose policies to retrieve."),
    targetResourceScope: z.string().min(20).max(1011).optional().describe("Optional filter to list policies that apply to a specific resource scope or resource type. This helps narrow down policy results to those relevant for particular Amazon Web Services resources, agent tools, or operational contexts within the policy engine ecosystem."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              policyEngineId: String(params.policyEngineId),
            };
      const queryParams = {
              "nextToken": params.nextToken !== undefined ? String(params.nextToken) : undefined,
              "maxResults": params.maxResults !== undefined ? String(params.maxResults) : undefined,
              "targetResourceScope": params.targetResourceScope !== undefined ? String(params.targetResourceScope) : undefined,
            };
      const result = await callApi("GET", "/policy-engines/{policyEngineId}/policies", undefined, pathParams, queryParams);
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

// Tool: get-workload-identity
server.registerTool(
  "get-workload-identity",
  {
    description: "Retrieves information about a workload identity.",
    inputSchema: z.object({
    name: z.string().min(3).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")).describe("The name of the workload identity to retrieve."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
            };
      const result = await callApi("POST", "/identities/GetWorkloadIdentity", body, undefined, undefined);
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

// Tool: update-workload-identity
server.registerTool(
  "update-workload-identity",
  {
    description: "Updates an existing workload identity.",
    inputSchema: z.object({
    name: z.string().min(3).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")).describe("The name of the workload identity to update."),
    allowedResourceOauth2ReturnUrls: z.array(z.string().min(1).max(2048).regex(new RegExp("^\\w+:(\\/?\\/?)[^\\s]+$"))).optional().describe("The new list of allowed OAuth2 return URLs for resources associated with this workload identity. This list replaces the existing list."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
              "allowedResourceOauth2ReturnUrls": params.allowedResourceOauth2ReturnUrls,
            };
      const result = await callApi("POST", "/identities/UpdateWorkloadIdentity", body, undefined, undefined);
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

// Tool: delete-workload-identity
server.registerTool(
  "delete-workload-identity",
  {
    description: "Deletes a workload identity.",
    inputSchema: z.object({
    name: z.string().min(3).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")).describe("The name of the workload identity to delete."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "name": params.name,
            };
      const result = await callApi("POST", "/identities/DeleteWorkloadIdentity", body, undefined, undefined);
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

// Tool: list-workload-identities
server.registerTool(
  "list-workload-identities",
  {
    description: "Lists all workload identities in your account. [Paginated: inputToken: nextToken, outputToken: nextToken, pageSize: maxResults, items: workloadIdentities]",
    inputSchema: z.object({
    nextToken: z.string().optional().describe("Pagination token."),
    maxResults: z.number().int().optional().describe("Maximum number of results to return."),
  }),
  },
  async (params) => {
    try {
      const body = {
              "nextToken": params.nextToken,
              "maxResults": params.maxResults,
            };
      const result = await callApi("POST", "/identities/ListWorkloadIdentities", body, undefined, undefined);
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
