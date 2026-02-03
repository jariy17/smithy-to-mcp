import { ParsedService, ParsedOperation, JsonSchema, ParsedMember } from "./smithy-parser.js";

export interface GeneratorOptions {
  serverName?: string;
  serverVersion?: string;
  baseUrl?: string;
  outputFormat?: "typescript" | "javascript";
}

export class McpGenerator {
  private services: ParsedService[];
  private options: GeneratorOptions;

  constructor(services: ParsedService[], options: GeneratorOptions = {}) {
    this.services = services;
    this.options = options;
  }

  generate(): string {
    const service = this.services[0];
    if (!service) {
      throw new Error("No service found in Smithy model");
    }

    const serverName = this.options.serverName || service.name;
    const serverVersion = this.options.serverVersion || service.version || "1.0.0";

    // Determine base URL: explicit option > endpoint prefix > localhost fallback
    let baseUrlCode: string;
    if (this.options.baseUrl) {
      baseUrlCode = `process.env.API_BASE_URL || "${this.options.baseUrl}"`;
    } else if (service.endpointPrefix) {
      // AWS service - construct URL from endpoint prefix and region
      baseUrlCode = `process.env.API_BASE_URL || \`https://${service.endpointPrefix}.\${process.env.AWS_REGION || "us-east-1"}.amazonaws.com\``;
    } else {
      baseUrlCode = `process.env.API_BASE_URL || "http://localhost:8080"`;
    }

    return `#!/usr/bin/env node
/**
 * MCP Server generated from Smithy model
 * Service: ${serverName}
 * Generated at: ${new Date().toISOString()}
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

// Configuration
const CONFIG = {
  baseUrl: ${baseUrlCode},
  apiKey: process.env.API_KEY,
  timeout: parseInt(process.env.API_TIMEOUT || "30000"),
};

// Create MCP server
const server = new McpServer({
  name: "${serverName}",
  version: "${serverVersion}",
});

// HTTP client helper
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
      resolvedPath = resolvedPath.replace(\`{\${key}}\`, encodeURIComponent(value));
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
    headers["Authorization"] = \`Bearer \${CONFIG.apiKey}\`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(CONFIG.timeout),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(\`API error \${response.status}: \${errorBody}\`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}

${this.generateTools(service)}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${serverName} MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
`;
  }

  private generateTools(service: ParsedService): string {
    const tools: string[] = [];

    for (const operation of service.operations) {
      tools.push(this.generateTool(operation));
    }

    return tools.join("\n\n");
  }

  private generateTool(operation: ParsedOperation): string {
    const toolName = this.operationToToolName(operation.name);
    const rawDescription = operation.documentation || `Execute ${operation.name} operation`;
    const description = this.stripHtml(rawDescription);

    const zodSchema = this.generateZodSchema(operation);
    const apiCall = this.generateApiCall(operation);

    return `// Tool: ${toolName}
server.registerTool(
  "${toolName}",
  {
    description: ${JSON.stringify(description)},
    inputSchema: ${zodSchema},
  },
  async (params) => {
    try {
      ${apiCall}
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: \`Error: \${message}\` }],
        isError: true,
      };
    }
  }
);`;
  }

  private operationToToolName(operationName: string): string {
    // Convert PascalCase to kebab-case
    return operationName
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, "");
  }

  private generateZodSchema(operation: ParsedOperation): string {
    if (!operation.input || operation.input.members.length === 0) {
      return "z.object({})";
    }

    const schemaLines: string[] = ["z.object({"];

    for (const member of operation.input.members) {
      let zodType = this.jsonSchemaToZod(member.jsonSchema);

      // Add .optional() for non-required fields
      if (!member.required) {
        zodType = `${zodType}.optional()`;
      }

      // Add description if available (always last)
      if (member.documentation) {
        const desc = this.escapeStringForJs(member.documentation);
        zodType = `${zodType}.describe(${desc})`;
      }

      schemaLines.push(`    ${member.name}: ${zodType},`);
    }

    schemaLines.push("  })");
    return schemaLines.join("\n");
  }

  private stripHtml(str: string): string {
    return str
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/\s+/g, " ")    // Normalize whitespace
      .trim();
  }

  private escapeStringForJs(str: string): string {
    return JSON.stringify(this.stripHtml(str));
  }

  private jsonSchemaToZod(schema: JsonSchema, depth: number = 0): string {
    // Prevent infinite recursion - limit nesting depth
    const MAX_DEPTH = 10;
    if (depth > MAX_DEPTH) {
      return "z.unknown()";
    }

    if (!schema.type) {
      if (schema.oneOf) {
        // Union type
        const options = schema.oneOf.map((s) => this.jsonSchemaToZod(s, depth + 1));
        return `z.union([${options.join(", ")}])`;
      }
      if (schema.enum) {
        return `z.enum([${schema.enum.map((v) => JSON.stringify(v)).join(", ")}])`;
      }
      return "z.unknown()";
    }

    switch (schema.type) {
      case "string":
        return this.stringToZod(schema);
      case "integer":
        return this.integerToZod(schema);
      case "number":
        return this.numberToZod(schema);
      case "boolean":
        return "z.boolean()";
      case "array":
        return `z.array(${this.jsonSchemaToZod(schema.items || {}, depth + 1)})`;
      case "object":
        return this.objectToZod(schema, depth);
      default:
        return "z.unknown()";
    }
  }

  private stringToZod(schema: JsonSchema): string {
    let base = "z.string()";

    if (schema.enum) {
      return `z.enum([${schema.enum.map((v) => JSON.stringify(v)).join(", ")}])`;
    }

    const constraints: string[] = [];
    if (schema.minLength !== undefined) {
      constraints.push(`.min(${schema.minLength})`);
    }
    if (schema.maxLength !== undefined) {
      constraints.push(`.max(${schema.maxLength})`);
    }
    if (schema.pattern) {
      // Use new RegExp() to avoid template literal issues with patterns containing ${ or }
      constraints.push(`.regex(new RegExp(${JSON.stringify(schema.pattern)}))`);
    }
    if (schema.format === "date-time") {
      constraints.push(`.datetime()`);
    }

    return base + constraints.join("");
  }

  private integerToZod(schema: JsonSchema): string {
    let base = "z.number().int()";

    if (schema.enum) {
      return `z.enum([${schema.enum.join(", ")}])`;
    }

    const constraints: string[] = [];
    if (schema.minimum !== undefined) {
      constraints.push(`.min(${schema.minimum})`);
    }
    if (schema.maximum !== undefined) {
      constraints.push(`.max(${schema.maximum})`);
    }

    return base + constraints.join("");
  }

  private numberToZod(schema: JsonSchema): string {
    let base = "z.number()";

    const constraints: string[] = [];
    if (schema.minimum !== undefined) {
      constraints.push(`.min(${schema.minimum})`);
    }
    if (schema.maximum !== undefined) {
      constraints.push(`.max(${schema.maximum})`);
    }

    return base + constraints.join("");
  }

  private objectToZod(schema: JsonSchema, depth: number): string {
    if (schema.additionalProperties) {
      return `z.record(z.string(), ${this.jsonSchemaToZod(schema.additionalProperties, depth + 1)})`;
    }

    if (!schema.properties) {
      return "z.object({}).passthrough()";
    }

    const props: string[] = [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(key);
      const zodType = this.jsonSchemaToZod(propSchema, depth + 1);
      props.push(`${key}: ${isRequired ? zodType : `${zodType}.optional()`}`);
    }

    return `z.object({ ${props.join(", ")} })`;
  }

  private generateApiCall(operation: ParsedOperation): string {
    const httpMethod = operation.http?.method || "POST";
    const httpUri = operation.http?.uri || `/${operation.name}`;

    // Classify members by their HTTP binding
    const pathParams: ParsedMember[] = [];
    const queryParams: ParsedMember[] = [];
    const headerParams: ParsedMember[] = [];
    const bodyParams: ParsedMember[] = [];
    let payloadParam: ParsedMember | undefined;

    // Extract path parameters from URI for fallback detection
    const pathParamMatches = httpUri.match(/\{(\w+)\}/g) || [];
    const pathParamNames = new Set(pathParamMatches.map((m) => m.slice(1, -1)));

    if (operation.input) {
      for (const member of operation.input.members) {
        if (member.httpBinding) {
          switch (member.httpBinding.type) {
            case "label":
              pathParams.push(member);
              break;
            case "query":
              queryParams.push(member);
              break;
            case "header":
            case "prefixHeaders":
              headerParams.push(member);
              break;
            case "payload":
              payloadParam = member;
              break;
            default:
              bodyParams.push(member);
          }
        } else if (pathParamNames.has(member.name)) {
          // Fallback: if member name matches a path param, treat as label
          pathParams.push(member);
        } else {
          // Default to body for non-annotated params
          bodyParams.push(member);
        }
      }
    }

    // Generate the API call
    const lines: string[] = [];

    // Build path params object
    if (pathParams.length > 0) {
      lines.push(`const pathParams = {`);
      for (const p of pathParams) {
        lines.push(`        ${p.name}: String(params.${p.name}),`);
      }
      lines.push(`      };`);
    }

    // Build query params object
    if (queryParams.length > 0) {
      lines.push(`const queryParams = {`);
      for (const p of queryParams) {
        const wireName = p.httpBinding?.name || p.name;
        lines.push(`        "${wireName}": params.${p.name} !== undefined ? String(params.${p.name}) : undefined,`);
      }
      lines.push(`      };`);
    }

    // Build body
    let bodyArg = "undefined";
    if (payloadParam) {
      // httpPayload - the entire value is the body
      bodyArg = `params.${payloadParam.name}`;
    } else if (bodyParams.length > 0 && (httpMethod === "POST" || httpMethod === "PUT" || httpMethod === "PATCH")) {
      lines.push(`const body = {`);
      for (const p of bodyParams) {
        lines.push(`        ${p.name}: params.${p.name},`);
      }
      lines.push(`      };`);
      bodyArg = "body";
    }

    const pathArg = pathParams.length > 0 ? "pathParams" : "undefined";
    const queryArg = queryParams.length > 0 ? "queryParams" : "undefined";

    lines.push(
      `const result = await callApi("${httpMethod}", "${httpUri}", ${bodyArg}, ${pathArg}, ${queryArg});`
    );

    return lines.join("\n      ");
  }
}

export function generateMcpServer(
  services: ParsedService[],
  options?: GeneratorOptions
): string {
  const generator = new McpGenerator(services, options);
  return generator.generate();
}
