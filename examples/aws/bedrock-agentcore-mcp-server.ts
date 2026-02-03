#!/usr/bin/env node
/**
 * MCP Server generated from Smithy model
 * Service: AmazonBedrockAgentCore
 * Generated at: 2026-02-03T02:41:45.709Z
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
  baseUrl: process.env.API_BASE_URL || `https://bedrock-agentcore.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`,
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
  name: "AmazonBedrockAgentCore",
  version: "2024-02-28",
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

  // Build URL with query parameters
  const url = new URL(resolvedPath, CONFIG.baseUrl);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
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
    path: url.pathname + url.search,
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

// Tool: complete-resource-token-auth
server.registerTool(
  "complete-resource-token-auth",
  {
    description: "Confirms the user authentication session for obtaining OAuth2.0 tokens for a resource.",
    inputSchema: z.object({
    userIdentifier: z.union([z.object({ userToken: z.string().min(1).max(131072).regex(new RegExp("^[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+$")) }), z.object({ userId: z.string().min(1).max(128) })]).describe("The OAuth2.0 token or user ID that was used to generate the workload access token used for initiating the user authorization flow to retrieve OAuth2.0 tokens."),
    sessionUri: z.string().min(1).max(1024).regex(new RegExp("^urn:ietf:params:oauth:request_uri:[a-zA-Z0-9-._~]+$")).describe("Unique identifier for the user's authentication session for retrieving OAuth2 tokens. This ID tracks the authorization flow state across multiple requests and responses during the OAuth2 authentication process."),
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
    description: "Retrieves the API key associated with an API key credential provider.",
    inputSchema: z.object({
    workloadIdentityToken: z.string().min(1).max(131072).describe("The identity token of the workload from which you want to retrieve the API key."),
    resourceCredentialProviderName: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).describe("The credential provider name for the resource from which you are retrieving the API key."),
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
    description: "Returns the OAuth 2.0 token of the provided resource.",
    inputSchema: z.object({
    workloadIdentityToken: z.string().min(1).max(131072).describe("The identity token of the workload from which you want to retrieve the OAuth2 token."),
    resourceCredentialProviderName: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\-_]+$")).describe("The name of the resource's credential provider."),
    scopes: z.array(z.string().min(1).max(128)).describe("The OAuth scopes being requested."),
    oauth2Flow: z.enum(["USER_FEDERATION", "M2M"]).describe("The type of flow to be performed."),
    sessionUri: z.string().min(1).max(1024).regex(new RegExp("^urn:ietf:params:oauth:request_uri:[a-zA-Z0-9-._~]+$")).optional().describe("Unique identifier for the user's authentication session for retrieving OAuth2 tokens. This ID tracks the authorization flow state across multiple requests and responses during the OAuth2 authentication process."),
    resourceOauth2ReturnUrl: z.string().min(1).max(2048).regex(new RegExp("^\\w+:(\\/?\\/?)[^\\s]+$")).optional().describe("The callback URL to redirect to after the OAuth 2.0 token retrieval is complete. This URL must be one of the provided URLs configured for the workload identity."),
    forceAuthentication: z.boolean().optional().describe("Indicates whether to always initiate a new three-legged OAuth (3LO) flow, regardless of any existing session."),
    customParameters: z.record(z.string(), z.string().min(1).max(2048)).optional().describe("A map of custom parameters to include in the authorization request to the resource credential provider. These parameters are in addition to the standard OAuth 2.0 flow parameters, and will not override them."),
    customState: z.string().min(1).max(4096).optional().describe("An opaque string that will be sent back to the callback URL provided in resourceOauth2ReturnUrl. This state should be used to protect the callback URL of your application against CSRF attacks by ensuring the response corresponds to the original request."),
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
    description: "Obtains a workload access token for agentic workloads not acting on behalf of a user.",
    inputSchema: z.object({
    workloadName: z.string().min(3).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")).describe("The unique identifier for the registered workload."),
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
    description: "Obtains a workload access token for agentic workloads acting on behalf of a user, using a JWT token.",
    inputSchema: z.object({
    workloadName: z.string().min(3).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")).describe("The unique identifier for the registered workload."),
    userToken: z.string().min(1).max(131072).regex(new RegExp("^[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+.[A-Za-z0-9-_=]+$")).describe("The OAuth 2.0 token issued by the user's identity provider."),
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
    description: "Obtains a workload access token for agentic workloads acting on behalf of a user, using the user's ID.",
    inputSchema: z.object({
    workloadName: z.string().min(3).max(255).regex(new RegExp("^[A-Za-z0-9_.-]+$")).describe("The name of the workload from which you want to retrieve the access token."),
    userId: z.string().min(1).max(128).describe("The ID of the user for whom you are retrieving the access token."),
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
    description: "Executes code within an active code interpreter session in Amazon Bedrock. This operation processes the provided code, runs it in a secure environment, and returns the execution results including output, errors, and generated visualizations. To execute code, you must specify the code interpreter identifier, session ID, and the code to run in the arguments parameter. The operation returns a stream containing the execution results, which can include text output, error messages, and data visualizations. This operation is subject to request rate limiting based on your account's service quotas. The following operations are related to InvokeCodeInterpreter: StartCodeInterpreterSession GetCodeInterpreterSession",
    inputSchema: z.object({
    codeInterpreterIdentifier: z.string().describe("The unique identifier of the code interpreter associated with the session. This must match the identifier used when creating the session with StartCodeInterpreterSession."),
    sessionId: z.string().regex(new RegExp("^[0-9a-zA-Z]{1,40}$")).optional().describe("The unique identifier of the code interpreter session to use. This must be an active session created with StartCodeInterpreterSession. If the session has expired or been stopped, the request will fail."),
    traceId: z.string().optional().describe("The trace identifier for request tracking."),
    traceParent: z.string().optional().describe("The parent trace information for distributed tracing."),
    name: z.enum(["executeCode", "executeCommand", "readFiles", "listFiles", "removeFiles", "writeFiles", "startCommandExecution", "getTask", "stopTask"]).describe("The name of the code interpreter to invoke."),
    arguments: z.object({ code: z.string().max(100000000).optional(), language: z.enum(["python", "javascript", "typescript"]).optional(), clearContext: z.boolean().optional(), command: z.string().max(100000000).optional(), path: z.string().max(100000000).optional(), paths: z.array(z.string().max(100000000)).optional(), content: z.array(z.object({ path: z.string().max(100000000), text: z.string().max(100000000).optional(), blob: z.string().optional() })).optional(), directoryPath: z.string().max(100000000).optional(), taskId: z.string().max(100000000).optional() }).optional().describe("The arguments for the code interpreter. This includes the code to execute and any additional parameters such as the programming language, whether to clear the execution context, and other execution options. The structure of this parameter depends on the specific code interpreter being used."),
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

// Tool: get-agent-card
server.registerTool(
  "get-agent-card",
  {
    description: "Retrieves the A2A agent card associated with an AgentCore Runtime agent.",
    inputSchema: z.object({
    runtimeSessionId: z.string().min(33).max(256).optional().describe("The session ID that the AgentCore Runtime agent is using."),
    agentRuntimeArn: z.string().describe("The ARN of the AgentCore Runtime agent for which you want to get the A2A agent card."),
    qualifier: z.string().optional().describe("Optional qualifier to specify an agent alias, such as prodcode&gt; or dev. If you don't provide a value, the DEFAULT alias is used."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeArn: String(params.agentRuntimeArn),
            };
      const queryParams = {
              "qualifier": params.qualifier !== undefined ? String(params.qualifier) : undefined,
            };
      const result = await callApi("GET", "/runtimes/{agentRuntimeArn}/invocations/.well-known/agent-card.json", undefined, pathParams, queryParams);
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

// Tool: invoke-agent-runtime
server.registerTool(
  "invoke-agent-runtime",
  {
    description: "Sends a request to an agent or tool hosted in an Amazon Bedrock AgentCore Runtime and receives responses in real-time. To invoke an agent you must specify the AgentCore Runtime ARN and provide a payload containing your request. You can optionally specify a qualifier to target a specific version or endpoint of the agent. This operation supports streaming responses, allowing you to receive partial responses as they become available. We recommend using pagination to ensure that the operation returns quickly and successfully when processing large responses. For example code, see Invoke an AgentCore Runtime agent. If you're integrating your agent with OAuth, you can't use the Amazon Web Services SDK to call InvokeAgentRuntime. Instead, make a HTTPS request to InvokeAgentRuntime. For an example, see Authenticate and authorize with Inbound Auth and Outbound Auth. To use this operation, you must have the bedrock-agentcore:InvokeAgentRuntime permission. If you are making a call to InvokeAgentRuntime on behalf of a user ID with the X-Amzn-Bedrock-AgentCore-Runtime-User-Id header, You require permissions to both actions (bedrock-agentcore:InvokeAgentRuntime and bedrock-agentcore:InvokeAgentRuntimeForUser).",
    inputSchema: z.object({
    contentType: z.string().min(1).max(256).optional().describe("The MIME type of the input data in the payload. This tells the agent runtime how to interpret the payload data. Common values include application/json for JSON data."),
    accept: z.string().min(1).max(256).optional().describe("The desired MIME type for the response from the agent runtime. This tells the agent runtime what format to use for the response data. Common values include application/json for JSON data."),
    mcpSessionId: z.string().min(1).max(1024).optional().describe("The identifier of the MCP session."),
    runtimeSessionId: z.string().min(33).max(256).optional().describe("The identifier of the runtime session."),
    mcpProtocolVersion: z.string().min(1).max(1024).optional().describe("The version of the MCP protocol being used."),
    runtimeUserId: z.string().min(1).max(1024).optional().describe("The identifier of the runtime user."),
    traceId: z.string().optional().describe("The trace identifier for request tracking."),
    traceParent: z.string().optional().describe("The parent trace information for distributed tracing."),
    traceState: z.string().optional().describe("The trace state information for distributed tracing."),
    baggage: z.string().optional().describe("Additional context information for distributed tracing."),
    agentRuntimeArn: z.string().describe("The Amazon Web Services Resource Name (ARN) of the agent runtime to invoke. The ARN uniquely identifies the agent runtime resource in Amazon Bedrock."),
    qualifier: z.string().optional().describe("The qualifier to use for the agent runtime. This can be a version number or an endpoint name that points to a specific version. If not specified, Amazon Bedrock uses the default version of the agent runtime."),
    accountId: z.string().optional().describe("The identifier of the Amazon Web Services account for the agent runtime resource."),
    payload: z.string().describe("The input data to send to the agent runtime. The format of this data depends on the specific agent configuration and must match the specified content type. For most agents, this is a JSON object containing the user's request."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeArn: String(params.agentRuntimeArn),
            };
      const queryParams = {
              "qualifier": params.qualifier !== undefined ? String(params.qualifier) : undefined,
              "accountId": params.accountId !== undefined ? String(params.accountId) : undefined,
            };
      const result = await callApi("POST", "/runtimes/{agentRuntimeArn}/invocations", params.payload, pathParams, queryParams);
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

// Tool: stop-runtime-session
server.registerTool(
  "stop-runtime-session",
  {
    description: "Stops a session that is running in an running AgentCore Runtime agent.",
    inputSchema: z.object({
    runtimeSessionId: z.string().min(33).max(256).describe("The ID of the session that you want to stop."),
    agentRuntimeArn: z.string().describe("The ARN of the agent that contains the session that you want to stop."),
    qualifier: z.string().optional().describe("Optional qualifier to specify an agent alias, such as prodcode&gt; or dev. If you don't provide a value, the DEFAULT alias is used."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("Idempotent token used to identify the request. If you use the same token with multiple requests, the same response is returned. Use ClientToken to prevent the same request from being processed more than once."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              agentRuntimeArn: String(params.agentRuntimeArn),
            };
      const queryParams = {
              "qualifier": params.qualifier !== undefined ? String(params.qualifier) : undefined,
            };
      const body = {
              clientToken: params.clientToken,
            };
      const result = await callApi("POST", "/runtimes/{agentRuntimeArn}/stopruntimesession", body, pathParams, queryParams);
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

// Tool: get-browser-session
server.registerTool(
  "get-browser-session",
  {
    description: "Retrieves detailed information about a specific browser session in Amazon Bedrock. This operation returns the session's configuration, current status, associated streams, and metadata. To get a browser session, you must specify both the browser identifier and the session ID. The response includes information about the session's viewport configuration, timeout settings, and stream endpoints. The following operations are related to GetBrowserSession: StartBrowserSession ListBrowserSessions StopBrowserSession",
    inputSchema: z.object({
    browserIdentifier: z.string().describe("The unique identifier of the browser associated with the session."),
    sessionId: z.string().regex(new RegExp("^[0-9a-zA-Z]{1,40}$")).describe("The unique identifier of the browser session to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              browserIdentifier: String(params.browserIdentifier),
            };
      const queryParams = {
              "sessionId": params.sessionId !== undefined ? String(params.sessionId) : undefined,
            };
      const result = await callApi("GET", "/browsers/{browserIdentifier}/sessions/get", undefined, pathParams, queryParams);
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

// Tool: list-browser-sessions
server.registerTool(
  "list-browser-sessions",
  {
    description: "Retrieves a list of browser sessions in Amazon Bedrock that match the specified criteria. This operation returns summary information about each session, including identifiers, status, and timestamps. You can filter the results by browser identifier and session status. The operation supports pagination to handle large result sets efficiently. We recommend using pagination to ensure that the operation returns quickly and successfully when retrieving large numbers of sessions. The following operations are related to ListBrowserSessions: StartBrowserSession GetBrowserSession",
    inputSchema: z.object({
    browserIdentifier: z.string().describe("The unique identifier of the browser to list sessions for. If specified, only sessions for this browser are returned. If not specified, sessions for all browsers are returned."),
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 10. Valid values range from 1 to 100. To retrieve the remaining results, make another call with the returned nextToken value."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results. If not specified, Amazon Bedrock returns the first page of results."),
    status: z.enum(["READY", "TERMINATED"]).optional().describe("The status of the browser sessions to list. Valid values include ACTIVE, STOPPING, and STOPPED. If not specified, sessions with any status are returned."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              browserIdentifier: String(params.browserIdentifier),
            };
      const body = {
              maxResults: params.maxResults,
              nextToken: params.nextToken,
              status: params.status,
            };
      const result = await callApi("POST", "/browsers/{browserIdentifier}/sessions/list", body, pathParams, undefined);
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

// Tool: start-browser-session
server.registerTool(
  "start-browser-session",
  {
    description: "Creates and initializes a browser session in Amazon Bedrock. The session enables agents to navigate and interact with web content, extract information from websites, and perform web-based tasks as part of their response generation. To create a session, you must specify a browser identifier and a name. You can also configure the viewport dimensions to control the visible area of web content. The session remains active until it times out or you explicitly stop it using the StopBrowserSession operation. The following operations are related to StartBrowserSession: GetBrowserSession UpdateBrowserStream StopBrowserSession",
    inputSchema: z.object({
    traceId: z.string().optional().describe("The trace identifier for request tracking."),
    traceParent: z.string().optional().describe("The parent trace information for distributed tracing."),
    browserIdentifier: z.string().describe("The unique identifier of the browser to use for this session. This identifier specifies which browser environment to initialize for the session."),
    name: z.string().min(1).max(100).optional().describe("The name of the browser session. This name helps you identify and manage the session. The name does not need to be unique."),
    sessionTimeoutSeconds: z.number().int().optional().describe("The time in seconds after which the session automatically terminates if there is no activity. The default value is 3600 seconds (1 hour). The minimum allowed value is 60 seconds, and the maximum allowed value is 28800 seconds (8 hours)."),
    viewPort: z.object({ width: z.number().int(), height: z.number().int() }).optional().describe("The dimensions of the browser viewport for this session. This determines the visible area of the web content and affects how web pages are rendered. If not specified, Amazon Bedrock uses a default viewport size."),
    extensions: z.array(z.object({ location: z.union([z.object({ s3: z.object({ bucket: z.string(), prefix: z.string(), versionId: z.string().optional() }) })]) })).optional().describe("A list of browser extensions to load into the browser session."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If this token matches a previous request, Amazon Bedrock ignores the request, but does not return an error. This parameter helps prevent the creation of duplicate sessions if there are temporary network issues."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              browserIdentifier: String(params.browserIdentifier),
            };
      const body = {
              name: params.name,
              sessionTimeoutSeconds: params.sessionTimeoutSeconds,
              viewPort: params.viewPort,
              extensions: params.extensions,
              clientToken: params.clientToken,
            };
      const result = await callApi("PUT", "/browsers/{browserIdentifier}/sessions/start", body, pathParams, undefined);
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

// Tool: stop-browser-session
server.registerTool(
  "stop-browser-session",
  {
    description: "Terminates an active browser session in Amazon Bedrock. This operation stops the session, releases associated resources, and makes the session unavailable for further use. To stop a browser session, you must specify both the browser identifier and the session ID. Once stopped, a session cannot be restarted; you must create a new session using StartBrowserSession. The following operations are related to StopBrowserSession: StartBrowserSession GetBrowserSession",
    inputSchema: z.object({
    traceId: z.string().optional().describe("The trace identifier for request tracking."),
    traceParent: z.string().optional().describe("The parent trace information for distributed tracing."),
    browserIdentifier: z.string().describe("The unique identifier of the browser associated with the session."),
    sessionId: z.string().regex(new RegExp("^[0-9a-zA-Z]{1,40}$")).describe("The unique identifier of the browser session to stop."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If this token matches a previous request, Amazon Bedrock ignores the request, but does not return an error."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              browserIdentifier: String(params.browserIdentifier),
            };
      const queryParams = {
              "sessionId": params.sessionId !== undefined ? String(params.sessionId) : undefined,
            };
      const body = {
              clientToken: params.clientToken,
            };
      const result = await callApi("PUT", "/browsers/{browserIdentifier}/sessions/stop", body, pathParams, queryParams);
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

// Tool: update-browser-stream
server.registerTool(
  "update-browser-stream",
  {
    description: "Updates a browser stream. To use this operation, you must have permissions to perform the bedrock:UpdateBrowserStream action.",
    inputSchema: z.object({
    browserIdentifier: z.string().describe("The identifier of the browser."),
    sessionId: z.string().regex(new RegExp("^[0-9a-zA-Z]{1,40}$")).describe("The identifier of the browser session."),
    streamUpdate: z.union([z.object({ automationStreamUpdate: z.object({ streamStatus: z.enum(["ENABLED", "DISABLED"]).optional() }) })]).describe("The update to apply to the browser stream."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the operation completes no more than one time. If this token matches a previous request, Amazon Bedrock ignores the request, but does not return an error."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              browserIdentifier: String(params.browserIdentifier),
            };
      const queryParams = {
              "sessionId": params.sessionId !== undefined ? String(params.sessionId) : undefined,
            };
      const body = {
              streamUpdate: params.streamUpdate,
              clientToken: params.clientToken,
            };
      const result = await callApi("PUT", "/browsers/{browserIdentifier}/sessions/streams/update", body, pathParams, queryParams);
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

// Tool: get-code-interpreter-session
server.registerTool(
  "get-code-interpreter-session",
  {
    description: "Retrieves detailed information about a specific code interpreter session in Amazon Bedrock. This operation returns the session's configuration, current status, and metadata. To get a code interpreter session, you must specify both the code interpreter identifier and the session ID. The response includes information about the session's timeout settings and current status. The following operations are related to GetCodeInterpreterSession: StartCodeInterpreterSession ListCodeInterpreterSessions StopCodeInterpreterSession",
    inputSchema: z.object({
    codeInterpreterIdentifier: z.string().describe("The unique identifier of the code interpreter associated with the session."),
    sessionId: z.string().regex(new RegExp("^[0-9a-zA-Z]{1,40}$")).describe("The unique identifier of the code interpreter session to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              codeInterpreterIdentifier: String(params.codeInterpreterIdentifier),
            };
      const queryParams = {
              "sessionId": params.sessionId !== undefined ? String(params.sessionId) : undefined,
            };
      const result = await callApi("GET", "/code-interpreters/{codeInterpreterIdentifier}/sessions/get", undefined, pathParams, queryParams);
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

// Tool: list-code-interpreter-sessions
server.registerTool(
  "list-code-interpreter-sessions",
  {
    description: "Retrieves a list of code interpreter sessions in Amazon Bedrock that match the specified criteria. This operation returns summary information about each session, including identifiers, status, and timestamps. You can filter the results by code interpreter identifier and session status. The operation supports pagination to handle large result sets efficiently. We recommend using pagination to ensure that the operation returns quickly and successfully when retrieving large numbers of sessions. The following operations are related to ListCodeInterpreterSessions: StartCodeInterpreterSession GetCodeInterpreterSession",
    inputSchema: z.object({
    codeInterpreterIdentifier: z.string().describe("The unique identifier of the code interpreter to list sessions for. If specified, only sessions for this code interpreter are returned. If not specified, sessions for all code interpreters are returned."),
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 10. Valid values range from 1 to 100. To retrieve the remaining results, make another call with the returned nextToken value."),
    nextToken: z.string().min(1).max(2048).regex(new RegExp("^\\S*$")).optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results. If not specified, Amazon Bedrock returns the first page of results."),
    status: z.enum(["READY", "TERMINATED"]).optional().describe("The status of the code interpreter sessions to list. Valid values include ACTIVE, STOPPING, and STOPPED. If not specified, sessions with any status are returned."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              codeInterpreterIdentifier: String(params.codeInterpreterIdentifier),
            };
      const body = {
              maxResults: params.maxResults,
              nextToken: params.nextToken,
              status: params.status,
            };
      const result = await callApi("POST", "/code-interpreters/{codeInterpreterIdentifier}/sessions/list", body, pathParams, undefined);
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

// Tool: start-code-interpreter-session
server.registerTool(
  "start-code-interpreter-session",
  {
    description: "Creates and initializes a code interpreter session in Amazon Bedrock. The session enables agents to execute code as part of their response generation, supporting programming languages such as Python for data analysis, visualization, and computation tasks. To create a session, you must specify a code interpreter identifier and a name. The session remains active until it times out or you explicitly stop it using the StopCodeInterpreterSession operation. The following operations are related to StartCodeInterpreterSession: InvokeCodeInterpreter GetCodeInterpreterSession StopCodeInterpreterSession",
    inputSchema: z.object({
    traceId: z.string().optional().describe("The trace identifier for request tracking."),
    traceParent: z.string().optional().describe("The parent trace information for distributed tracing."),
    codeInterpreterIdentifier: z.string().describe("The unique identifier of the code interpreter to use for this session. This identifier specifies which code interpreter environment to initialize for the session."),
    name: z.string().min(1).max(100).optional().describe("The name of the code interpreter session. This name helps you identify and manage the session. The name does not need to be unique."),
    sessionTimeoutSeconds: z.number().int().optional().describe("The time in seconds after which the session automatically terminates if there is no activity. The default value is 900 seconds (15 minutes). The minimum allowed value is 60 seconds, and the maximum allowed value is 28800 seconds (8 hours)."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If this token matches a previous request, Amazon Bedrock ignores the request, but does not return an error. This parameter helps prevent the creation of duplicate sessions if there are temporary network issues."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              codeInterpreterIdentifier: String(params.codeInterpreterIdentifier),
            };
      const body = {
              name: params.name,
              sessionTimeoutSeconds: params.sessionTimeoutSeconds,
              clientToken: params.clientToken,
            };
      const result = await callApi("PUT", "/code-interpreters/{codeInterpreterIdentifier}/sessions/start", body, pathParams, undefined);
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

// Tool: stop-code-interpreter-session
server.registerTool(
  "stop-code-interpreter-session",
  {
    description: "Terminates an active code interpreter session in Amazon Bedrock. This operation stops the session, releases associated resources, and makes the session unavailable for further use. To stop a code interpreter session, you must specify both the code interpreter identifier and the session ID. Once stopped, a session cannot be restarted; you must create a new session using StartCodeInterpreterSession. The following operations are related to StopCodeInterpreterSession: StartCodeInterpreterSession GetCodeInterpreterSession",
    inputSchema: z.object({
    traceId: z.string().optional().describe("The trace identifier for request tracking."),
    traceParent: z.string().optional().describe("The parent trace information for distributed tracing."),
    codeInterpreterIdentifier: z.string().describe("The unique identifier of the code interpreter associated with the session."),
    sessionId: z.string().regex(new RegExp("^[0-9a-zA-Z]{1,40}$")).describe("The unique identifier of the code interpreter session to stop."),
    clientToken: z.string().min(33).max(256).regex(new RegExp("^[a-zA-Z0-9](-*[a-zA-Z0-9]){0,256}$")).optional().describe("A unique, case-sensitive identifier to ensure that the API request completes no more than one time. If this token matches a previous request, Amazon Bedrock ignores the request, but does not return an error."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              codeInterpreterIdentifier: String(params.codeInterpreterIdentifier),
            };
      const queryParams = {
              "sessionId": params.sessionId !== undefined ? String(params.sessionId) : undefined,
            };
      const body = {
              clientToken: params.clientToken,
            };
      const result = await callApi("PUT", "/code-interpreters/{codeInterpreterIdentifier}/sessions/stop", body, pathParams, queryParams);
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

// Tool: evaluate
server.registerTool(
  "evaluate",
  {
    description: "Performs on-demand evaluation of agent traces using a specified evaluator. This synchronous API accepts traces in OpenTelemetry format and returns immediate scoring results with detailed explanations.",
    inputSchema: z.object({
    evaluatorId: z.string().regex(new RegExp("^(Builtin.[a-zA-Z0-9_-]+|[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10})$")).describe("The unique identifier of the evaluator to use for scoring. Can be a built-in evaluator (e.g., Builtin.Helpfulness, Builtin.Correctness) or a custom evaluator ARN created through the control plane API."),
    evaluationInput: z.union([z.object({ sessionSpans: z.array(z.object({}).passthrough()) })]).describe("The input data containing agent session spans to be evaluated. Includes a list of spans in OpenTelemetry format from supported frameworks like Strands (AgentCore Runtime) or LangGraph with OpenInference instrumentation."),
    evaluationTarget: z.union([z.object({ spanIds: z.array(z.string().min(16).max(16)) }), z.object({ traceIds: z.array(z.string().min(32).max(32)) })]).optional().describe("The specific trace or span IDs to evaluate within the provided input. Allows targeting evaluation at different levels: individual tool calls, single request-response interactions (traces), or entire conversation sessions."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              evaluatorId: String(params.evaluatorId),
            };
      const body = {
              evaluationInput: params.evaluationInput,
              evaluationTarget: params.evaluationTarget,
            };
      const result = await callApi("POST", "/evaluations/evaluate/{evaluatorId}", body, pathParams, undefined);
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

// Tool: batch-create-memory-records
server.registerTool(
  "batch-create-memory-records",
  {
    description: "Creates multiple memory records in a single batch operation for the specified memory with custom content.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique ID of the memory resource where records will be created."),
    records: z.array(z.object({ requestIdentifier: z.string().min(1).max(80).regex(new RegExp("^[a-zA-Z0-9_-]+$")), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9/*][a-zA-Z0-9-_/*]*(?::[a-zA-Z0-9-_/*]+)*[a-zA-Z0-9-_/*]*$"))), content: z.union([z.object({ text: z.string() })]), timestamp: z.string().datetime(), memoryStrategyId: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")).optional() })).describe("A list of memory record creation inputs to be processed in the batch operation."),
    clientToken: z.string().optional().describe("A unique, case-sensitive identifier to ensure idempotent processing of the batch request."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              records: params.records,
              clientToken: params.clientToken,
            };
      const result = await callApi("POST", "/memories/{memoryId}/memoryRecords/batchCreate", body, pathParams, undefined);
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

// Tool: batch-delete-memory-records
server.registerTool(
  "batch-delete-memory-records",
  {
    description: "Deletes multiple memory records in a single batch operation from the specified memory.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique ID of the memory resource where records will be deleted."),
    records: z.array(z.object({ memoryRecordId: z.string().min(40).max(50).regex(new RegExp("^mem-[a-zA-Z0-9-_]*$")) })).describe("A list of memory record deletion inputs to be processed in the batch operation."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              records: params.records,
            };
      const result = await callApi("POST", "/memories/{memoryId}/memoryRecords/batchDelete", body, pathParams, undefined);
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

// Tool: batch-update-memory-records
server.registerTool(
  "batch-update-memory-records",
  {
    description: "Updates multiple memory records with custom content in a single batch operation within the specified memory.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique ID of the memory resource where records will be updated."),
    records: z.array(z.object({ memoryRecordId: z.string().min(40).max(50).regex(new RegExp("^mem-[a-zA-Z0-9-_]*$")), timestamp: z.string().datetime(), content: z.union([z.object({ text: z.string() })]).optional(), namespaces: z.array(z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9/*][a-zA-Z0-9-_/*]*(?::[a-zA-Z0-9-_/*]+)*[a-zA-Z0-9-_/*]*$"))).optional(), memoryStrategyId: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")).optional() })).describe("A list of memory record update inputs to be processed in the batch operation."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              records: params.records,
            };
      const result = await callApi("POST", "/memories/{memoryId}/memoryRecords/batchUpdate", body, pathParams, undefined);
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

// Tool: create-event
server.registerTool(
  "create-event",
  {
    description: "Creates an event in an AgentCore Memory resource. Events represent interactions or activities that occur within a session and are associated with specific actors. To use this operation, you must have the bedrock-agentcore:CreateEvent permission. This operation is subject to request rate limiting.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource in which to create the event."),
    actorId: z.string().min(1).max(255).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_/]*(?::[a-zA-Z0-9-_/]+)*[a-zA-Z0-9-_/]*$")).describe("The identifier of the actor associated with this event. An actor represents an entity that participates in sessions and generates events."),
    sessionId: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")).optional().describe("The identifier of the session in which this event occurs. A session represents a sequence of related events."),
    eventTimestamp: z.string().datetime().describe("The timestamp when the event occurred. If not specified, the current time is used."),
    payload: z.array(z.union([z.object({ conversational: z.object({ content: z.union([z.object({ text: z.string() })]), role: z.enum(["ASSISTANT", "USER", "TOOL", "OTHER"]) }) }), z.object({ blob: z.object({}).passthrough() })])).describe("The content payload of the event. This can include conversational data or binary content."),
    branch: z.object({ rootEventId: z.string().regex(new RegExp("^[0-9]+#[a-fA-F0-9]+$")).optional(), name: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")) }).optional().describe("The branch information for this event. Branches allow for organizing events into different conversation threads or paths."),
    clientToken: z.string().optional().describe("A unique, case-sensitive identifier to ensure that the operation completes no more than one time. If this token matches a previous request, AgentCore ignores the request, but does not return an error."),
    metadata: z.record(z.string(), z.union([z.object({ stringValue: z.string() })])).optional().describe("The key-value metadata to attach to the event."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              actorId: params.actorId,
              sessionId: params.sessionId,
              eventTimestamp: params.eventTimestamp,
              payload: params.payload,
              branch: params.branch,
              clientToken: params.clientToken,
              metadata: params.metadata,
            };
      const result = await callApi("POST", "/memories/{memoryId}/events", body, pathParams, undefined);
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

// Tool: delete-event
server.registerTool(
  "delete-event",
  {
    description: "Deletes an event from an AgentCore Memory resource. When you delete an event, it is permanently removed. To use this operation, you must have the bedrock-agentcore:DeleteEvent permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource from which to delete the event."),
    sessionId: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")).describe("The identifier of the session containing the event to delete."),
    eventId: z.string().regex(new RegExp("^[0-9]+#[a-fA-F0-9]+$")).describe("The identifier of the event to delete."),
    actorId: z.string().min(1).max(255).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_/]*(?::[a-zA-Z0-9-_/]+)*[a-zA-Z0-9-_/]*$")).describe("The identifier of the actor associated with the event to delete."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
              sessionId: String(params.sessionId),
              eventId: String(params.eventId),
              actorId: String(params.actorId),
            };
      const result = await callApi("DELETE", "/memories/{memoryId}/actor/{actorId}/sessions/{sessionId}/events/{eventId}", undefined, pathParams, undefined);
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

// Tool: delete-memory-record
server.registerTool(
  "delete-memory-record",
  {
    description: "Deletes a memory record from an AgentCore Memory resource. When you delete a memory record, it is permanently removed. To use this operation, you must have the bedrock-agentcore:DeleteMemoryRecord permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource from which to delete the memory record."),
    memoryRecordId: z.string().min(40).max(50).regex(new RegExp("^mem-[a-zA-Z0-9-_]*$")).describe("The identifier of the memory record to delete."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
              memoryRecordId: String(params.memoryRecordId),
            };
      const result = await callApi("DELETE", "/memories/{memoryId}/memoryRecords/{memoryRecordId}", undefined, pathParams, undefined);
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

// Tool: get-event
server.registerTool(
  "get-event",
  {
    description: "Retrieves information about a specific event in an AgentCore Memory resource. To use this operation, you must have the bedrock-agentcore:GetEvent permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource containing the event."),
    sessionId: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")).describe("The identifier of the session containing the event."),
    actorId: z.string().min(1).max(255).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_/]*(?::[a-zA-Z0-9-_/]+)*[a-zA-Z0-9-_/]*$")).describe("The identifier of the actor associated with the event."),
    eventId: z.string().regex(new RegExp("^[0-9]+#[a-fA-F0-9]+$")).describe("The identifier of the event to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
              sessionId: String(params.sessionId),
              actorId: String(params.actorId),
              eventId: String(params.eventId),
            };
      const result = await callApi("GET", "/memories/{memoryId}/actor/{actorId}/sessions/{sessionId}/events/{eventId}", undefined, pathParams, undefined);
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

// Tool: get-memory-record
server.registerTool(
  "get-memory-record",
  {
    description: "Retrieves a specific memory record from an AgentCore Memory resource. To use this operation, you must have the bedrock-agentcore:GetMemoryRecord permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource containing the memory record."),
    memoryRecordId: z.string().min(40).max(50).regex(new RegExp("^mem-[a-zA-Z0-9-_]*$")).describe("The identifier of the memory record to retrieve."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
              memoryRecordId: String(params.memoryRecordId),
            };
      const result = await callApi("GET", "/memories/{memoryId}/memoryRecord/{memoryRecordId}", undefined, pathParams, undefined);
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

// Tool: list-actors
server.registerTool(
  "list-actors",
  {
    description: "Lists all actors in an AgentCore Memory resource. We recommend using pagination to ensure that the operation returns quickly and successfully. To use this operation, you must have the bedrock-agentcore:ListActors permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource for which to list actors."),
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 20."),
    nextToken: z.string().optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              maxResults: params.maxResults,
              nextToken: params.nextToken,
            };
      const result = await callApi("POST", "/memories/{memoryId}/actors", body, pathParams, undefined);
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

// Tool: list-events
server.registerTool(
  "list-events",
  {
    description: "Lists events in an AgentCore Memory resource based on specified criteria. We recommend using pagination to ensure that the operation returns quickly and successfully. To use this operation, you must have the bedrock-agentcore:ListEvents permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource for which to list events."),
    sessionId: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")).describe("The identifier of the session for which to list events."),
    actorId: z.string().min(1).max(255).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_/]*(?::[a-zA-Z0-9-_/]+)*[a-zA-Z0-9-_/]*$")).describe("The identifier of the actor for which to list events."),
    includePayloads: z.boolean().optional().describe("Specifies whether to include event payloads in the response. Set to true to include payloads, or false to exclude them."),
    filter: z.object({ branch: z.object({ name: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")), includeParentBranches: z.boolean().optional() }).optional(), eventMetadata: z.array(z.object({ left: z.union([z.object({ metadataKey: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$")) })]), operator: z.enum(["EQUALS_TO", "EXISTS", "NOT_EXISTS"]), right: z.union([z.object({ metadataValue: z.union([z.object({ stringValue: z.string() })]) })]).optional() })).optional() }).optional().describe("Filter criteria to apply when listing events."),
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 20."),
    nextToken: z.string().optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
              sessionId: String(params.sessionId),
              actorId: String(params.actorId),
            };
      const body = {
              includePayloads: params.includePayloads,
              filter: params.filter,
              maxResults: params.maxResults,
              nextToken: params.nextToken,
            };
      const result = await callApi("POST", "/memories/{memoryId}/actor/{actorId}/sessions/{sessionId}", body, pathParams, undefined);
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

// Tool: list-memory-extraction-jobs
server.registerTool(
  "list-memory-extraction-jobs",
  {
    description: "Lists all long-term memory extraction jobs that are eligible to be started with optional filtering. To use this operation, you must have the bedrock-agentcore:ListMemoryExtractionJobs permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the memory to list extraction jobs for."),
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 20."),
    filter: z.object({ strategyId: z.string().optional(), sessionId: z.string().optional(), actorId: z.string().optional(), status: z.enum(["FAILED"]).optional() }).optional().describe("Filter criteria to apply when listing extraction jobs."),
    nextToken: z.string().optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              maxResults: params.maxResults,
              filter: params.filter,
              nextToken: params.nextToken,
            };
      const result = await callApi("POST", "/memories/{memoryId}/extractionJobs", body, pathParams, undefined);
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

// Tool: list-memory-records
server.registerTool(
  "list-memory-records",
  {
    description: "Lists memory records in an AgentCore Memory resource based on specified criteria. We recommend using pagination to ensure that the operation returns quickly and successfully. To use this operation, you must have the bedrock-agentcore:ListMemoryRecords permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource for which to list memory records."),
    namespace: z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9/*][a-zA-Z0-9-_/*]*(?::[a-zA-Z0-9-_/*]+)*[a-zA-Z0-9-_/*]*$")).describe("The namespace to filter memory records by. If specified, only memory records in this namespace are returned."),
    memoryStrategyId: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")).optional().describe("The memory strategy identifier to filter memory records by. If specified, only memory records with this strategy ID are returned."),
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 20."),
    nextToken: z.string().optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              namespace: params.namespace,
              memoryStrategyId: params.memoryStrategyId,
              maxResults: params.maxResults,
              nextToken: params.nextToken,
            };
      const result = await callApi("POST", "/memories/{memoryId}/memoryRecords", body, pathParams, undefined);
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

// Tool: list-sessions
server.registerTool(
  "list-sessions",
  {
    description: "Lists sessions in an AgentCore Memory resource based on specified criteria. We recommend using pagination to ensure that the operation returns quickly and successfully. To use this operation, you must have the bedrock-agentcore:ListSessions permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource for which to list sessions."),
    actorId: z.string().min(1).max(255).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_/]*(?::[a-zA-Z0-9-_/]+)*[a-zA-Z0-9-_/]*$")).describe("The identifier of the actor for which to list sessions."),
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 20."),
    nextToken: z.string().optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
              actorId: String(params.actorId),
            };
      const body = {
              maxResults: params.maxResults,
              nextToken: params.nextToken,
            };
      const result = await callApi("POST", "/memories/{memoryId}/actor/{actorId}/sessions", body, pathParams, undefined);
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

// Tool: retrieve-memory-records
server.registerTool(
  "retrieve-memory-records",
  {
    description: "Searches for and retrieves memory records from an AgentCore Memory resource based on specified search criteria. We recommend using pagination to ensure that the operation returns quickly and successfully. To use this operation, you must have the bedrock-agentcore:RetrieveMemoryRecords permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The identifier of the AgentCore Memory resource from which to retrieve memory records."),
    namespace: z.string().min(1).max(1024).regex(new RegExp("^[a-zA-Z0-9/*][a-zA-Z0-9-_/*]*(?::[a-zA-Z0-9-_/*]+)*[a-zA-Z0-9-_/*]*$")).describe("The namespace to filter memory records by."),
    searchCriteria: z.object({ searchQuery: z.string(), memoryStrategyId: z.string().min(1).max(100).regex(new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-_]*$")).optional(), topK: z.number().int().optional(), metadataFilters: z.array(z.object({ left: z.union([z.object({ metadataKey: z.string().min(1).max(128).regex(new RegExp("^[a-zA-Z0-9\\s._:/=+@-]*$")) })]), operator: z.enum(["EQUALS_TO", "EXISTS", "NOT_EXISTS"]), right: z.union([z.object({ metadataValue: z.union([z.object({ stringValue: z.string() })]) })]).optional() })).optional() }).describe("The search criteria to use for finding relevant memory records. This includes the search query, memory strategy ID, and other search parameters."),
    nextToken: z.string().optional().describe("The token for the next set of results. Use the value returned in the previous response in the next request to retrieve the next set of results."),
    maxResults: z.number().int().optional().describe("The maximum number of results to return in a single call. The default value is 20."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              namespace: params.namespace,
              searchCriteria: params.searchCriteria,
              nextToken: params.nextToken,
              maxResults: params.maxResults,
            };
      const result = await callApi("POST", "/memories/{memoryId}/retrieve", body, pathParams, undefined);
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

// Tool: start-memory-extraction-job
server.registerTool(
  "start-memory-extraction-job",
  {
    description: "Starts a memory extraction job that processes events that failed extraction previously in an AgentCore Memory resource and produces structured memory records. When earlier extraction attempts have left events unprocessed, this job will pick up and extract those as well. To use this operation, you must have the bedrock-agentcore:StartMemoryExtractionJob permission.",
    inputSchema: z.object({
    memoryId: z.string().min(12).regex(new RegExp("^[a-zA-Z][a-zA-Z0-9-_]{0,99}-[a-zA-Z0-9]{10}$")).describe("The unique identifier of the memory for which to start extraction jobs."),
    extractionJob: z.object({ jobId: z.string() }).describe("Extraction job to start in this operation."),
    clientToken: z.string().optional().describe("A unique, case-sensitive identifier to ensure idempotent processing of the request."),
  }),
  },
  async (params) => {
    try {
      const pathParams = {
              memoryId: String(params.memoryId),
            };
      const body = {
              extractionJob: params.extractionJob,
              clientToken: params.clientToken,
            };
      const result = await callApi("POST", "/memories/{memoryId}/extractionJobs/start", body, pathParams, undefined);
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
