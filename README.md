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

### Run directly (dynamic server)

The fastest way to run an MCP server from a Smithy model - no code generation needed:

```bash
# From a local file
npx smithy-to-mcp serve ./my-model.json

# Auto-download AWS service models
npx smithy-to-mcp serve aws:bedrock-agent-runtime
npx smithy-to-mcp serve aws:s3
```

Options:
- `-u, --base-url <url>` - Base URL for API calls (default: from model or `API_BASE_URL` env)
- `-k, --api-key <key>` - API key for authentication (default: `API_KEY` env)
- `-t, --timeout <ms>` - Request timeout in milliseconds (default: 30000)
- `-r, --region <region>` - AWS region for SigV4 signing (default: `AWS_REGION` env or us-east-1)
- `--no-cache` - Skip cache and re-download AWS models

### Generate an MCP server

Generate a standalone TypeScript MCP server:

```bash
npx smithy-to-mcp generate <smithy-model.json> -o <output.ts>
```

Options:
- `-o, --output <file>` - Output file path (default: mcp-server.ts)
- `-u, --base-url <url>` - Override base URL (auto-detected for AWS services)
- `-n, --name <name>` - Override server name
- `-v, --version <version>` - Override server version
- `--stdout` - Output to stdout instead of file

### Inspect a Smithy model

```bash
npx smithy-to-mcp inspect <smithy-model.json>
```

Shows service info, operations, and input/output shapes.

### Create an example Smithy model

```bash
npx smithy-to-mcp init
```

Creates `weather-service.json` as a starting point.

## Examples

### Quick Start: AWS Bedrock AgentCore

1. **Configure AWS credentials** (if not already set up)
   ```bash
   aws configure
   # Or set environment variables:
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   export AWS_REGION=us-east-1
   ```

2. **Run the MCP server** (auto-downloads and caches the model)
   ```bash
   npx smithy-to-mcp serve aws:bedrock-agent-runtime
   ```

3. **Add to Claude Desktop** (optional)

   Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "bedrock-agentcore": {
         "command": "npx",
         "args": ["smithy-to-mcp", "serve", "aws:bedrock-agent-runtime"]
       }
     }
   }
   ```

### Other AWS Services

Use `aws:<service-name>` to auto-download any AWS service model:

```bash
npx smithy-to-mcp serve aws:s3
npx smithy-to-mcp serve aws:dynamodb
npx smithy-to-mcp serve aws:lambda
npx smithy-to-mcp serve aws:ec2
```

Models are downloaded from [aws/api-models-aws](https://github.com/aws/api-models-aws) and cached in `~/.smithy-to-mcp/cache/`.

### Generate a standalone MCP server

If you prefer generated code over dynamic serving:

```bash
# Generate TypeScript MCP server
npx smithy-to-mcp generate bedrock-agentcore.json -o bedrock-mcp-server.ts

# Run the generated server
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

For AWS services, the tool automatically detects SigV4 requirements from the Smithy model and:
- Uses `@smithy/signature-v4` for request signing
- Uses `@aws-sdk/credential-provider-node` for AWS credentials
- Reads credentials from environment, ~/.aws/credentials, IAM roles, etc.

All AWS dependencies are included - no extra installation needed.

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
| `@httpQueryParams` | Sparse map spread to query params |
| `@httpHeader` | Request headers |
| `@httpPrefixHeaders` | Header prefix mapping |
| `@httpPayload` | Request body payload |
| `@httpChecksum` | Checksum requirements (shown in tool description) |
| `@length` | String min/max length validation |
| `@pattern` | String regex validation |
| `@range` | Number min/max validation |
| `@default` | Default values in Zod schemas |
| `@jsonName` | Wire name for JSON serialization |
| `@paginated` | Pagination config (shown in tool description) |
| `@waitable` | Generates `wait-for-*` polling tools |
| `@enumValue` | Enum wire values |
| `@sensitive` | Mark sensitive fields (shown in field description) |
| `@deprecated` | Deprecation warnings in tool/field description |
| `@idempotencyToken` | Auto-generate UUID if not provided |
| `@streaming` | Streaming bodies (noted in field description) |
| `@hostLabel` | Host label fields (parsed) |
| `@mediaType` | Content type hints in field description |
| `@examples` | Usage examples (shown in tool description) |
| `@externalDocumentation` | External doc links in tool description |
| `@tags` | Resource tags (shown in tool description) |
| `@unstable` | Unstable API marker |
| `@internal` | Internal API marker |
| `@idempotent` | Idempotent operation marker |
| `@readonly` | Read-only operation marker |
| `aws.api#service` | AWS endpoint prefix detection |
| `aws.auth#sigv4` | AWS SigV4 signing detection |
| `aws.protocols#restJson1` | Protocol detection |

## Not yet supported

The following Smithy features are not yet parsed:

### Traits
| Trait | Purpose |
|-------|---------|
| `@httpResponseCode` | Response code binding |
| `@xmlName`, `@xmlAttribute`, `@xmlNamespace` | XML formatting |
| `@eventPayload`, `@eventHeader` | Event streams |
| `@retryable` | Retry hints (parsed but not used in generated code) |

### Features
- Mixins (shape composition)
- Apply statements (external trait application)
- Auto-pagination (currently just shows pagination fields in description)
- Streaming bodies (currently just shown as marker in description)
- Event streams

## Pre-generated examples

See the `examples/` directory:
- `weather-mcp-server.ts` - Simple weather API example
- `aws/bedrock-agentcore-mcp-server.ts` - AWS Bedrock AgentCore (35 operations)
- `aws/bedrock-agentcore-control-mcp-server.ts` - AWS Bedrock AgentCore Control (79 operations)
