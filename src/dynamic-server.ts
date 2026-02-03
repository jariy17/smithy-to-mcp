#!/usr/bin/env node
/**
 * Dynamic MCP Server that loads Smithy models at runtime
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@smithy/protocol-http";
import { SmithyParser, ParsedService, ParsedOperation, JsonSchema, WaiterConfig } from "./smithy-parser.js";

export interface DynamicServerOptions {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  region?: string;
}

export class DynamicMcpServer {
  private server: McpServer;
  private service: ParsedService;
  private options: DynamicServerOptions;
  private signer: SignatureV4 | null = null;

  constructor(service: ParsedService, options: DynamicServerOptions = {}) {
    this.service = service;
    this.options = {
      baseUrl: options.baseUrl || process.env.API_BASE_URL || this.getDefaultBaseUrl(),
      apiKey: options.apiKey || process.env.API_KEY,
      timeout: options.timeout || parseInt(process.env.API_TIMEOUT || "30000"),
      region: options.region || process.env.AWS_REGION || "us-east-1",
    };

    this.server = new McpServer({
      name: service.name,
      version: service.version || "1.0.0",
    });
  }

  private getDefaultBaseUrl(): string {
    if (this.service.endpointPrefix) {
      const region = process.env.AWS_REGION || "us-east-1";
      return `https://${this.service.endpointPrefix}.${region}.amazonaws.com`;
    }
    return "http://localhost:8080";
  }

  async initialize(): Promise<void> {
    // Initialize SigV4 signer if needed
    if (this.service.sigv4ServiceName) {
      this.signer = new SignatureV4({
        credentials: defaultProvider(),
        region: this.options.region!,
        service: this.service.sigv4ServiceName,
        sha256: Sha256,
      });
    }

    // Register tools for each operation
    for (const operation of this.service.operations) {
      if (operation.internal) {
        continue; // Skip internal operations
      }

      this.registerOperationTool(operation);

      // Register waiter tools
      if (operation.waiters) {
        for (const waiter of operation.waiters) {
          this.registerWaiterTool(operation, waiter);
        }
      }
    }
  }

  private registerOperationTool(operation: ParsedOperation): void {
    const toolName = this.operationToToolName(operation.name);
    const description = this.buildDescription(operation);
    const zodSchema = this.buildZodSchema(operation);

    this.server.registerTool(
      toolName,
      {
        description,
        inputSchema: zodSchema,
      },
      async (params) => {
        // Deprecation warning for operation
        if (operation.deprecated) {
          console.warn(`[DEPRECATED] Tool '${toolName}' is deprecated${operation.deprecated.since ? ` since ${operation.deprecated.since}` : ""}${operation.deprecated.message ? `: ${operation.deprecated.message}` : ""}`);
        }

        // Deprecation warnings for fields
        if (operation.input) {
          for (const member of operation.input.members) {
            if (member.deprecated && (params as Record<string, unknown>)[member.name] !== undefined) {
              console.warn(`[DEPRECATED] Field '${member.name}' in tool '${toolName}' is deprecated${member.deprecated.since ? ` since ${member.deprecated.since}` : ""}${member.deprecated.message ? `: ${member.deprecated.message}` : ""}`);
            }
          }
        }

        try {
          const result = await this.callApi(operation, params as Record<string, unknown>);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: "text" as const, text: `Error: ${message}` }],
            isError: true,
          };
        }
      }
    );
  }

  private registerWaiterTool(operation: ParsedOperation, waiter: WaiterConfig): void {
    const waiterToolName = `wait-for-${this.waiterNameToToolName(waiter.name)}`;
    const description = waiter.documentation || `Wait until ${waiter.name} condition is met by polling ${operation.name} (polls every ${waiter.minDelay}-${waiter.maxDelay}s)`;

    const baseSchema = this.buildZodSchema(operation);
    const waiterSchema = z.object({
      ...baseSchema.shape,
      maxWaitTime: z.number().int().optional().describe("Maximum time to wait in seconds (default: 300)"),
    });

    this.server.registerTool(
      waiterToolName,
      {
        description,
        inputSchema: waiterSchema,
      },
      async (params) => {
        const typedParams = params as Record<string, unknown>;
        const maxWaitTime = (typedParams.maxWaitTime as number) || 300;
        const startTime = Date.now();
        let delay = waiter.minDelay * 1000;
        const maxDelay = waiter.maxDelay * 1000;
        let attempts = 0;

        const checkAcceptors = (result: unknown): "success" | "failure" | "retry" => {
          for (const acceptor of waiter.acceptors) {
            if (acceptor.matcher.output) {
              const { path, expected, comparator } = acceptor.matcher.output;
              const value = this.getNestedValue(result, path);

              let matches = false;
              switch (comparator) {
                case "stringEquals":
                case "booleanEquals":
                  matches = value === expected;
                  break;
                case "allStringEquals":
                  matches = Array.isArray(value) && value.every((v) => v === expected);
                  break;
                case "anyStringEquals":
                  matches = Array.isArray(value) && value.some((v) => v === expected);
                  break;
                default:
                  matches = value === expected;
              }

              if (matches) {
                return acceptor.state as "success" | "failure";
              }
            }
          }
          return "retry";
        };

        while (true) {
          attempts++;
          try {
            const result = await this.callApi(operation, typedParams);
            const state = checkAcceptors(result);

            if (state === "success") {
              return {
                content: [{ type: "text" as const, text: JSON.stringify({ status: "success", attempts, result }, null, 2) }],
              };
            }
            if (state === "failure") {
              return {
                content: [{ type: "text" as const, text: JSON.stringify({ status: "failure", attempts, result }, null, 2) }],
                isError: true,
              };
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (Date.now() - startTime > maxWaitTime * 1000) {
              return {
                content: [{ type: "text" as const, text: `Waiter timed out after ${attempts} attempts: ${message}` }],
                isError: true,
              };
            }
          }

          if (Date.now() - startTime > maxWaitTime * 1000) {
            return {
              content: [{ type: "text" as const, text: `Waiter timed out after ${attempts} attempts` }],
              isError: true,
            };
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, maxDelay);
        }
      }
    );
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  private async callApi(operation: ParsedOperation, params: Record<string, unknown>): Promise<unknown> {
    const httpMethod = operation.http?.method || "POST";
    const httpUri = operation.http?.uri || `/${operation.name}`;

    // Classify members by HTTP binding
    const pathParams: Record<string, string> = {};
    const queryParams: Record<string, string> = {};
    const bodyParams: Record<string, unknown> = {};
    let payloadValue: unknown;

    const pathParamMatches = httpUri.match(/\{(\w+)\}/g) || [];
    const pathParamNames = new Set(pathParamMatches.map((m) => m.slice(1, -1)));

    if (operation.input) {
      for (const member of operation.input.members) {
        let value = params[member.name];

        // Auto-generate idempotency token if not provided
        if (member.idempotencyToken && value === undefined) {
          value = crypto.randomUUID();
        }

        if (value === undefined) continue;

        if (member.httpBinding) {
          switch (member.httpBinding.type) {
            case "label":
              pathParams[member.name] = String(value);
              break;
            case "query":
              queryParams[member.httpBinding.name || member.name] = String(value);
              break;
            case "queryParams":
              // Spread map to query params
              if (typeof value === "object" && value !== null) {
                for (const [k, v] of Object.entries(value)) {
                  if (v !== undefined && v !== null) {
                    queryParams[k] = String(v);
                  }
                }
              }
              break;
            case "payload":
              payloadValue = value;
              break;
            default:
              bodyParams[member.jsonName || member.name] = value;
          }
        } else if (pathParamNames.has(member.name)) {
          pathParams[member.name] = String(value);
        } else {
          bodyParams[member.jsonName || member.name] = value;
        }
      }
    }

    // Resolve path
    let resolvedPath = httpUri;
    for (const [key, value] of Object.entries(pathParams)) {
      resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
    }

    // Build URL
    const url = new URL(resolvedPath, this.options.baseUrl);
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }

    // Build body
    let body: string | undefined;
    if (payloadValue !== undefined) {
      body = JSON.stringify(payloadValue);
    } else if (Object.keys(bodyParams).length > 0 && ["POST", "PUT", "PATCH"].includes(httpMethod)) {
      body = JSON.stringify(bodyParams);
    }

    // Make request
    if (this.signer) {
      return this.callApiWithSigV4(httpMethod, url, body, queryParams);
    } else {
      return this.callApiStandard(httpMethod, url, body);
    }
  }

  private async callApiStandard(method: string, url: URL, body?: string): Promise<unknown> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.options.apiKey) {
      headers["Authorization"] = `Bearer ${this.options.apiKey}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(this.options.timeout!),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error ${response.status}: ${errorBody}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  private async callApiWithSigV4(method: string, url: URL, body?: string, query?: Record<string, string>): Promise<unknown> {
    if (!this.signer) {
      throw new Error("SigV4 signer not initialized");
    }

    const request = new HttpRequest({
      method,
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : undefined,
      path: url.pathname,
      query: query && Object.keys(query).length > 0 ? query : undefined,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        host: url.hostname,
      },
      body,
    });

    const signedRequest = await this.signer.sign(request);

    const response = await fetch(url.toString(), {
      method,
      headers: signedRequest.headers as Record<string, string>,
      body,
      signal: AbortSignal.timeout(this.options.timeout!),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error ${response.status}: ${errorBody}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  private buildDescription(operation: ParsedOperation): string {
    let description = this.stripHtml(operation.documentation || `Execute ${operation.name} operation`);

    if (operation.deprecated) {
      const parts: string[] = ["DEPRECATED"];
      if (operation.deprecated.since) parts.push(`since ${operation.deprecated.since}`);
      if (operation.deprecated.message) parts.push(operation.deprecated.message);
      description = `[${parts.join(": ")}] ${description}`;
    }

    if (operation.unstable) description = `[UNSTABLE] ${description}`;

    const characteristics: string[] = [];
    if (operation.idempotent) characteristics.push("idempotent");
    if (operation.readonly) characteristics.push("read-only");
    if (characteristics.length > 0) description += ` [${characteristics.join(", ")}]`;

    if (operation.pagination) {
      const parts: string[] = [];
      if (operation.pagination.inputToken) parts.push(`inputToken: ${operation.pagination.inputToken}`);
      if (operation.pagination.outputToken) parts.push(`outputToken: ${operation.pagination.outputToken}`);
      if (operation.pagination.pageSize) parts.push(`pageSize: ${operation.pagination.pageSize}`);
      if (operation.pagination.items) parts.push(`items: ${operation.pagination.items}`);
      if (parts.length > 0) description += ` [Paginated: ${parts.join(", ")}]`;
    }

    if (operation.tags && operation.tags.length > 0) {
      description += ` [Tags: ${operation.tags.join(", ")}]`;
    }

    return description;
  }

  private buildZodSchema(operation: ParsedOperation): z.ZodObject<Record<string, z.ZodTypeAny>> {
    if (!operation.input || operation.input.members.length === 0) {
      return z.object({});
    }

    const shape: Record<string, z.ZodTypeAny> = {};

    for (const member of operation.input.members) {
      let zodType = this.jsonSchemaToZod(member.jsonSchema);

      if (!member.required || member.idempotencyToken) {
        zodType = zodType.optional();
      }

      // Build description with markers
      let description = member.documentation || "";
      const markers: string[] = [];

      if (member.deprecated) {
        let d = "DEPRECATED";
        if (member.deprecated.since) d += ` since ${member.deprecated.since}`;
        if (member.deprecated.message) d += `: ${member.deprecated.message}`;
        markers.push(d);
      }
      if (member.sensitive) markers.push("SENSITIVE");
      if (member.idempotencyToken) markers.push("Auto-generated UUID if not provided");
      if (member.streaming) markers.push("STREAMING");

      if (markers.length > 0) {
        const markerStr = `[${markers.join("] [")}]`;
        description = description ? `${markerStr} ${description}` : markerStr;
      }

      if (description) {
        zodType = zodType.describe(description);
      }

      shape[member.name] = zodType;
    }

    return z.object(shape);
  }

  private jsonSchemaToZod(schema: JsonSchema, depth = 0): z.ZodTypeAny {
    if (depth > 10) return z.unknown();

    if (!schema.type) {
      if (schema.enum) {
        return z.enum(schema.enum as [string, ...string[]]);
      }
      return z.unknown();
    }

    switch (schema.type) {
      case "string": {
        let base: z.ZodTypeAny = z.string();
        if (schema.enum) {
          base = z.enum(schema.enum as [string, ...string[]]);
        }
        if (schema.minLength !== undefined) base = (base as z.ZodString).min(schema.minLength);
        if (schema.maxLength !== undefined) base = (base as z.ZodString).max(schema.maxLength);
        if (schema.default !== undefined) base = base.default(schema.default);
        return base;
      }
      case "integer": {
        let base: z.ZodTypeAny = z.number().int();
        if (schema.minimum !== undefined) base = (base as z.ZodNumber).min(schema.minimum);
        if (schema.maximum !== undefined) base = (base as z.ZodNumber).max(schema.maximum);
        if (schema.default !== undefined) base = base.default(schema.default);
        return base;
      }
      case "number": {
        let base: z.ZodTypeAny = z.number();
        if (schema.minimum !== undefined) base = (base as z.ZodNumber).min(schema.minimum);
        if (schema.maximum !== undefined) base = (base as z.ZodNumber).max(schema.maximum);
        if (schema.default !== undefined) base = base.default(schema.default);
        return base;
      }
      case "boolean":
        return schema.default !== undefined ? z.boolean().default(schema.default as boolean) : z.boolean();
      case "array":
        return z.array(this.jsonSchemaToZod(schema.items || {}, depth + 1));
      case "object":
        if (schema.additionalProperties) {
          return z.record(z.string(), this.jsonSchemaToZod(schema.additionalProperties, depth + 1));
        }
        if (!schema.properties) {
          return z.object({}).passthrough();
        }
        const props: Record<string, z.ZodTypeAny> = {};
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const isRequired = schema.required?.includes(key);
          const zodType = this.jsonSchemaToZod(propSchema, depth + 1);
          props[key] = isRequired ? zodType : zodType.optional();
        }
        return z.object(props);
      default:
        return z.unknown();
    }
  }

  private stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  private operationToToolName(name: string): string {
    return name.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
  }

  private waiterNameToToolName(name: string): string {
    return name.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${this.service.name} MCP server running on stdio`);
  }
}

/**
 * Create and start a dynamic MCP server from a Smithy model file
 */
export async function serveSmithy(
  smithyPath: string,
  options: DynamicServerOptions = {}
): Promise<void> {
  const parser = await SmithyParser.fromFile(smithyPath);
  const services = parser.parseServices();

  if (services.length === 0) {
    throw new Error("No services found in Smithy model");
  }

  const service = services[0];
  console.error(`Loading service: ${service.name} (${service.operations.length} operations)`);

  const server = new DynamicMcpServer(service, options);
  await server.initialize();
  await server.start();
}
