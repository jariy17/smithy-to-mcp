# smithy-to-mcp

Generate MCP (Model Context Protocol) servers from Smithy API models.

## What it does

This tool parses Smithy JSON AST files and generates TypeScript MCP servers with:
- Tools for each API operation
- Zod schemas with validation and descriptions
- HTTP client with path/query/body parameter handling
- Auto-detected AWS endpoints from Smithy traits
- AWS SigV4 authentication (auto-detected from Smithy model)

## Installation

```bash
npm install
npm run build
```

## Usage

### Generate an MCP server

```bash
node dist/cli.js generate <smithy-model.json> -o <output.ts>
```

Options:
- `-o, --output <file>` - Output file path (default: stdout)
- `--base-url <url>` - Override base URL (auto-detected for AWS services)
- `--name <name>` - Override server name
- `--version <version>` - Override server version

### Inspect a Smithy model

```bash
node dist/cli.js inspect <smithy-model.json>
```

Shows service info, operations, and input/output shapes.

### Create an example Smithy model

```bash
node dist/cli.js init
```

Creates `example-service.json` as a starting point.

## Examples

### Generate from AWS Smithy model

```bash
# Download a Smithy model from AWS
curl -o bedrock.json https://raw.githubusercontent.com/aws/api-models-aws/main/models/bedrock-agentcore.json

# Generate MCP server
node dist/cli.js generate bedrock.json -o bedrock-mcp-server.ts

# Run the server
npx tsx bedrock-mcp-server.ts
```

### Environment variables

The generated server supports:

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Override the base URL |
| `AWS_REGION` | AWS region for AWS services (default: us-east-1) |
| `API_KEY` | API key for Authorization header (non-AWS) |
| `API_TIMEOUT` | Request timeout in ms (default: 30000) |

### AWS SigV4 Authentication

For AWS services, the generator automatically detects SigV4 requirements from the Smithy model and generates code that:
- Uses `@smithy/signature-v4` for request signing
- Uses `@aws-sdk/credential-provider-node` for AWS credentials
- Reads credentials from environment, ~/.aws/credentials, IAM roles, etc.

Required dependencies for AWS services:
```bash
npm install @smithy/signature-v4 @smithy/protocol-http @aws-crypto/sha256-js @aws-sdk/credential-provider-node
```

## Generated output

The generated MCP server includes:

```typescript
// Each Smithy operation becomes an MCP tool
server.registerTool(
  "create-agent-runtime",
  {
    description: "Creates an Amazon Bedrock AgentCore Runtime.",
    inputSchema: z.object({
      agentRuntimeName: z.string()
        .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,47}$/)
        .describe("The name of the AgentCore Runtime."),
      description: z.string()
        .optional()
        .describe("The description of the AgentCore Runtime."),
    }),
  },
  async (params) => {
    // HTTP call to the API
  }
);
```

## Supported Smithy features

### Shapes
- `service` - with operations and resources
- `resource` - CRUD lifecycle (create, read, update, delete, list) + operations + collectionOperations + nested resources
- `operation` - with input/output/errors
- `structure`, `list`, `map`, `union`, `enum`, `intEnum`
- Primitive types: `string`, `boolean`, `byte`, `short`, `integer`, `long`, `float`, `double`, `bigInteger`, `bigDecimal`, `timestamp`, `blob`, `document`

### Traits
| Trait | Purpose |
|-------|---------|
| `@documentation` | Descriptions for tools and fields |
| `@required` | Required fields in Zod schemas |
| `@http` | HTTP method and URI template |
| `@httpLabel` | Path parameters |
| `@httpQuery` | Query string parameters |
| `@httpHeader` | Request headers |
| `@httpPrefixHeaders` | Header prefix mapping |
| `@httpPayload` | Request body payload |
| `@length` | String min/max length validation |
| `@pattern` | String regex validation |
| `@range` | Number min/max validation |
| `@default` | Default values in Zod schemas |
| `@jsonName` | Wire name for JSON serialization |
| `@paginated` | Pagination config (shown in tool description) |
| `@enumValue` | Enum wire values |
| `aws.api#service` | AWS endpoint prefix detection |
| `aws.auth#sigv4` | AWS SigV4 signing detection |
| `aws.protocols#restJson1` | Protocol detection |

## Not yet supported

The following Smithy features are not yet parsed:

### Traits
| Trait | Purpose |
|-------|---------|
| `@sensitive` | Mark sensitive data (could redact in logs) |
| `@deprecated` | Deprecation warnings |
| `@idempotencyToken` | Auto-generate UUID tokens |
| `@streaming` | Streaming request/response bodies |
| `@httpQueryParams` | Sparse map to query params |
| `@httpResponseCode` | Response code binding |
| `@hostLabel` | Custom endpoint hostnames |
| `@httpChecksum` | Checksum requirements |
| `@xmlName`, `@xmlAttribute`, `@xmlNamespace` | XML formatting |
| `@mediaType` | Content type hints |
| `@eventPayload`, `@eventHeader` | Event streams |
| `@waiters` | Polling/waiter configurations |
| `@retryable` | Retry hints |
| `@examples` | Usage examples |
| `@externalDocumentation` | External doc links |
| `@tags` | Resource tagging |
| `@unstable`, `@internal` | Stability markers |

### Features
- Mixins (shape composition)
- Apply statements (external trait application)
- Auto-pagination (currently just shows pagination fields in description)
- Streaming bodies
- Event streams
- Waiters

## Pre-generated examples

See the `examples/` directory:
- `weather-mcp-server.ts` - Simple weather API example
- `aws/bedrock-agentcore-mcp-server.ts` - AWS Bedrock AgentCore (35 operations)
- `aws/bedrock-agentcore-control-mcp-server.ts` - AWS Bedrock AgentCore Control (79 operations)
