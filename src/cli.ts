#!/usr/bin/env node
import { Command } from "commander";
import { readFile, writeFile, mkdir, access } from "fs/promises";
import { dirname, basename, join } from "path";
import { homedir } from "os";
import { SmithyParser } from "./smithy-parser.js";
import { generateMcpServer, GeneratorOptions } from "./mcp-generator.js";
import { serveSmithy } from "./dynamic-server.js";

// AWS model source - api-models-aws repo
const AWS_MODELS_API = "https://api.github.com/repos/aws/api-models-aws/contents/models";

async function resolveAwsModel(serviceName: string): Promise<string> {
  const cacheDir = join(homedir(), ".smithy-to-mcp", "cache");
  const cachePath = join(cacheDir, `${serviceName}.json`);

  // Check cache first
  try {
    await access(cachePath);
    console.error(`Using cached model: ${cachePath}`);
    return cachePath;
  } catch {
    // Not cached, need to download
  }

  console.error(`Resolving AWS model: ${serviceName}`);

  // Step 1: List versions in service directory
  const serviceUrl = `${AWS_MODELS_API}/${serviceName}/service`;
  const serviceResp = await fetch(serviceUrl);
  if (!serviceResp.ok) {
    throw new Error(`Could not find AWS model for service: ${serviceName}`);
  }
  const versions = await serviceResp.json() as Array<{ name: string }>;
  if (!versions.length) {
    throw new Error(`No versions found for service: ${serviceName}`);
  }

  // Get latest version (last in alphabetical order for date-based versions)
  const latestVersion = versions.sort((a, b) => b.name.localeCompare(a.name))[0].name;

  // Step 2: Get model file from version directory
  const versionUrl = `${AWS_MODELS_API}/${serviceName}/service/${latestVersion}`;
  const versionResp = await fetch(versionUrl);
  if (!versionResp.ok) {
    throw new Error(`Could not list version directory for: ${serviceName}/${latestVersion}`);
  }
  const files = await versionResp.json() as Array<{ name: string; download_url: string }>;
  const modelFile = files.find(f => f.name.endsWith('.json'));
  if (!modelFile) {
    throw new Error(`No model file found for: ${serviceName}/${latestVersion}`);
  }

  // Step 3: Download the model
  console.error(`Downloading: ${modelFile.download_url}`);
  const modelResp = await fetch(modelFile.download_url);
  if (!modelResp.ok) {
    throw new Error(`Failed to download model: ${modelFile.download_url}`);
  }
  const content = await modelResp.text();

  // Cache it
  await mkdir(cacheDir, { recursive: true });
  await writeFile(cachePath, content, "utf-8");
  console.error(`Cached: ${cachePath}`);
  return cachePath;
}

async function resolveInput(input: string): Promise<string> {
  if (input.startsWith("aws:")) {
    const serviceName = input.slice(4);
    return resolveAwsModel(serviceName);
  }
  return input;
}

const program = new Command();

program
  .name("smithy-to-mcp")
  .description("Generate MCP servers from Smithy models")
  .version("1.0.0");

program
  .command("generate")
  .description("Generate an MCP server from a Smithy JSON AST file")
  .argument("<input>", "Path to Smithy JSON AST file")
  .option("-o, --output <path>", "Output file path", "mcp-server.ts")
  .option("-n, --name <name>", "Server name (defaults to service name)")
  .option("-v, --version <version>", "Server version")
  .option("-u, --base-url <url>", "Base URL for API calls")
  .option("--stdout", "Output to stdout instead of file")
  .action(async (input: string, options) => {
    try {
      console.error(`Parsing Smithy model from ${input}...`);

      const parser = await SmithyParser.fromFile(input);
      const services = parser.parseServices();

      if (services.length === 0) {
        console.error("Error: No services found in Smithy model");
        process.exit(1);
      }

      console.error(`Found ${services.length} service(s):`);
      for (const service of services) {
        console.error(`  - ${service.name} (${service.operations.length} operations)`);
      }

      const generatorOptions: GeneratorOptions = {
        serverName: options.name,
        serverVersion: options.version,
        baseUrl: options.baseUrl,
      };

      const code = generateMcpServer(services, generatorOptions);

      if (options.stdout) {
        console.log(code);
      } else {
        await mkdir(dirname(options.output), { recursive: true });
        await writeFile(options.output, code, "utf-8");
        console.error(`Generated MCP server written to ${options.output}`);
        console.error("\nTo run the server:");
        console.error(`  npx tsx ${options.output}`);
        console.error("\nOr compile and run:");
        console.error(`  npx tsc ${options.output}`);
        console.error(`  node ${options.output.replace(".ts", ".js")}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("inspect")
  .description("Inspect a Smithy JSON AST file and show its structure")
  .argument("<input>", "Path to Smithy JSON AST file")
  .option("--json", "Output as JSON")
  .action(async (input: string, options) => {
    try {
      const parser = await SmithyParser.fromFile(input);
      const services = parser.parseServices();

      if (options.json) {
        console.log(JSON.stringify(services, null, 2));
        return;
      }

      for (const service of services) {
        console.log(`\nService: ${service.name}`);
        console.log(`  Version: ${service.version || "N/A"}`);
        console.log(`  Protocol: ${service.protocol || "N/A"}`);
        if (service.documentation) {
          console.log(`  Description: ${service.documentation.slice(0, 100)}...`);
        }
        console.log(`  Operations (${service.operations.length}):`);

        for (const op of service.operations) {
          const httpInfo = op.http
            ? ` [${op.http.method} ${op.http.uri}]`
            : "";
          console.log(`    - ${op.name}${httpInfo}`);

          if (op.input && op.input.members.length > 0) {
            console.log(`      Input:`);
            for (const member of op.input.members) {
              const req = member.required ? " (required)" : "";
              console.log(`        - ${member.name}: ${member.jsonSchema.type || "object"}${req}`);
            }
          }

          if (op.output && op.output.members.length > 0) {
            console.log(`      Output:`);
            for (const member of op.output.members) {
              console.log(`        - ${member.name}: ${member.jsonSchema.type || "object"}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Create an example Smithy model to get started")
  .option("-o, --output <path>", "Output directory", ".")
  .action(async (options) => {
    const exampleModel = {
      smithy: "2.0",
      metadata: {},
      shapes: {
        "example.weather#WeatherService": {
          type: "service",
          version: "2024-01-01",
          operations: [
            { target: "example.weather#GetCurrentWeather" },
            { target: "example.weather#GetForecast" },
          ],
          traits: {
            "smithy.api#documentation": "A simple weather service API",
          },
        },
        "example.weather#GetCurrentWeather": {
          type: "operation",
          input: { target: "example.weather#GetCurrentWeatherInput" },
          output: { target: "example.weather#GetCurrentWeatherOutput" },
          traits: {
            "smithy.api#documentation": "Get current weather for a location",
            "smithy.api#http": {
              method: "GET",
              uri: "/weather/{city}",
            },
          },
        },
        "example.weather#GetCurrentWeatherInput": {
          type: "structure",
          members: {
            city: {
              target: "smithy.api#String",
              traits: {
                "smithy.api#required": {},
                "smithy.api#httpLabel": {},
                "smithy.api#documentation": "The city name",
              },
            },
            units: {
              target: "example.weather#TemperatureUnits",
              traits: {
                "smithy.api#httpQuery": "units",
                "smithy.api#documentation": "Temperature units (celsius or fahrenheit)",
              },
            },
          },
        },
        "example.weather#GetCurrentWeatherOutput": {
          type: "structure",
          members: {
            city: {
              target: "smithy.api#String",
              traits: {
                "smithy.api#required": {},
              },
            },
            temperature: {
              target: "smithy.api#Float",
              traits: {
                "smithy.api#required": {},
              },
            },
            units: {
              target: "example.weather#TemperatureUnits",
              traits: {
                "smithy.api#required": {},
              },
            },
            conditions: {
              target: "smithy.api#String",
            },
            humidity: {
              target: "smithy.api#Integer",
            },
          },
        },
        "example.weather#GetForecast": {
          type: "operation",
          input: { target: "example.weather#GetForecastInput" },
          output: { target: "example.weather#GetForecastOutput" },
          traits: {
            "smithy.api#documentation": "Get weather forecast for a location",
            "smithy.api#http": {
              method: "GET",
              uri: "/forecast/{city}",
            },
          },
        },
        "example.weather#GetForecastInput": {
          type: "structure",
          members: {
            city: {
              target: "smithy.api#String",
              traits: {
                "smithy.api#required": {},
                "smithy.api#httpLabel": {},
              },
            },
            days: {
              target: "smithy.api#Integer",
              traits: {
                "smithy.api#httpQuery": "days",
                "smithy.api#documentation": "Number of days to forecast (1-14)",
              },
            },
          },
        },
        "example.weather#GetForecastOutput": {
          type: "structure",
          members: {
            city: {
              target: "smithy.api#String",
              traits: {
                "smithy.api#required": {},
              },
            },
            forecasts: {
              target: "example.weather#ForecastList",
              traits: {
                "smithy.api#required": {},
              },
            },
          },
        },
        "example.weather#ForecastList": {
          type: "list",
          member: {
            target: "example.weather#DailyForecast",
          },
        },
        "example.weather#DailyForecast": {
          type: "structure",
          members: {
            date: {
              target: "smithy.api#String",
              traits: {
                "smithy.api#required": {},
              },
            },
            high: {
              target: "smithy.api#Float",
            },
            low: {
              target: "smithy.api#Float",
            },
            conditions: {
              target: "smithy.api#String",
            },
          },
        },
        "example.weather#TemperatureUnits": {
          type: "enum",
          members: {
            CELSIUS: {
              traits: {
                "smithy.api#enumValue": "celsius",
              },
            },
            FAHRENHEIT: {
              traits: {
                "smithy.api#enumValue": "fahrenheit",
              },
            },
          },
        },
      },
    };

    const outputPath = join(options.output, "weather-service.json");
    await mkdir(options.output, { recursive: true });
    await writeFile(outputPath, JSON.stringify(exampleModel, null, 2), "utf-8");

    console.log(`Created example Smithy model at ${outputPath}`);
    console.log("\nNext steps:");
    console.log(`  1. Inspect the model:    npx smithy-to-mcp inspect ${outputPath}`);
    console.log(`  2. Generate MCP server:  npx smithy-to-mcp generate ${outputPath} -o weather-mcp-server.ts`);
    console.log(`  3. Run directly:         npx smithy-to-mcp serve ${outputPath}`);
  });

program
  .command("serve")
  .description("Run a dynamic MCP server directly from a Smithy JSON AST file or AWS service (aws:service-name)")
  .argument("<input>", "Path to Smithy JSON AST file, or aws:<service-name> to auto-download")
  .option("-u, --base-url <url>", "Base URL for API calls (default: from model or API_BASE_URL env)")
  .option("-k, --api-key <key>", "API key for target API authentication (default: API_KEY env)")
  .option("-t, --timeout <ms>", "Request timeout in milliseconds", "30000")
  .option("-r, --region <region>", "AWS region for SigV4 signing (default: AWS_REGION env or us-east-1)")
  .option("--http", "Run as HTTP server instead of stdio (for browser agents)")
  .option("--port <port>", "HTTP server port", "3000")
  .option("--host <host>", "HTTP server host (default: 127.0.0.1 for security)", "127.0.0.1")
  .option("--http-api-key <key>", "API key required for HTTP clients (Bearer token)")
  .option("--no-cache", "Skip cache and re-download AWS models")
  .action(async (input: string, options) => {
    try {
      const resolvedPath = await resolveInput(input);
      console.error(`Starting dynamic MCP server from ${resolvedPath}...`);
      await serveSmithy(resolvedPath, {
        baseUrl: options.baseUrl,
        apiKey: options.apiKey,
        timeout: parseInt(options.timeout),
        region: options.region,
        http: options.http,
        port: parseInt(options.port),
        host: options.host,
        httpApiKey: options.httpApiKey,
      });
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
