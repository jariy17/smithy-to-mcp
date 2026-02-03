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
    const usesSigV4 = !!service.sigv4ServiceName;

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

    const imports = usesSigV4 ? this.generateSigV4Imports() : this.generateStandardImports();
    const config = usesSigV4
      ? this.generateSigV4Config(baseUrlCode, service.sigv4ServiceName!)
      : this.generateStandardConfig(baseUrlCode);
    const httpClient = usesSigV4 ? this.generateSigV4HttpClient() : this.generateStandardHttpClient();

    return `#!/usr/bin/env node
/**
 * MCP Server generated from Smithy model
 * Service: ${serverName}
 * Generated at: ${new Date().toISOString()}
 */

${imports}

${config}

// Create MCP server
const server = new McpServer({
  name: "${serverName}",
  version: "${serverVersion}",
});

${httpClient}

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

  private generateStandardImports(): string {
    return `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";`;
  }

  private generateSigV4Imports(): string {
    return `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@smithy/protocol-http";`;
  }

  private generateStandardConfig(baseUrlCode: string): string {
    return `// Configuration
const CONFIG = {
  baseUrl: ${baseUrlCode},
  apiKey: process.env.API_KEY,
  timeout: parseInt(process.env.API_TIMEOUT || "30000"),
};`;
  }

  private generateSigV4Config(baseUrlCode: string, sigv4ServiceName: string): string {
    return `// Configuration
const CONFIG = {
  baseUrl: ${baseUrlCode},
  region: process.env.AWS_REGION || "us-east-1",
  service: "${sigv4ServiceName}",
  timeout: parseInt(process.env.API_TIMEOUT || "30000"),
};

// AWS SigV4 signer
const signer = new SignatureV4({
  credentials: defaultProvider(),
  region: CONFIG.region,
  service: CONFIG.service,
  sha256: Sha256,
});`;
  }

  private generateStandardHttpClient(): string {
    return `// HTTP client helper
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
}`;
  }

  private generateSigV4HttpClient(): string {
    return `// HTTP client helper with AWS SigV4 signing
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
    throw new Error(\`API error \${response.status}: \${errorBody}\`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}`;
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
    let description = this.stripHtml(rawDescription);

    // Add pagination info to description if applicable
    if (operation.pagination) {
      const paginationParts: string[] = [];
      if (operation.pagination.inputToken) {
        paginationParts.push(`inputToken: ${operation.pagination.inputToken}`);
      }
      if (operation.pagination.outputToken) {
        paginationParts.push(`outputToken: ${operation.pagination.outputToken}`);
      }
      if (operation.pagination.pageSize) {
        paginationParts.push(`pageSize: ${operation.pagination.pageSize}`);
      }
      if (operation.pagination.items) {
        paginationParts.push(`items: ${operation.pagination.items}`);
      }
      if (paginationParts.length > 0) {
        description += ` [Paginated: ${paginationParts.join(", ")}]`;
      }
    }

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
        return this.booleanToZod(schema);
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
      const enumBase = `z.enum([${schema.enum.map((v) => JSON.stringify(v)).join(", ")}])`;
      if (schema.default !== undefined) {
        return `${enumBase}.default(${JSON.stringify(schema.default)})`;
      }
      return enumBase;
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
    if (schema.default !== undefined) {
      constraints.push(`.default(${JSON.stringify(schema.default)})`);
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
    if (schema.default !== undefined) {
      constraints.push(`.default(${schema.default})`);
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
    if (schema.default !== undefined) {
      constraints.push(`.default(${schema.default})`);
    }

    return base + constraints.join("");
  }

  private booleanToZod(schema: JsonSchema): string {
    if (schema.default !== undefined) {
      return `z.boolean().default(${schema.default})`;
    }
    return "z.boolean()";
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
        // Use jsonName for wire format if specified, otherwise use member name
        const wireName = p.jsonName || p.name;
        lines.push(`        "${wireName}": params.${p.name},`);
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
