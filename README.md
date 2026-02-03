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

- Service operations
- Resource CRUD operations (create, read, update, delete, list)
- HTTP bindings (httpLabel, httpQuery, httpHeader, httpPayload)
- Structures, lists, maps, unions, enums
- String constraints (length, pattern)
- Number constraints (min, max)
- Documentation traits

## Pre-generated examples

See the `examples/` directory:
- `weather-mcp-server.ts` - Simple weather API example
- `aws/bedrock-agentcore-mcp-server.ts` - AWS Bedrock AgentCore (35 operations)
- `aws/bedrock-agentcore-control-mcp-server.ts` - AWS Bedrock AgentCore Control (79 operations)
