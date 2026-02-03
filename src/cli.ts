#!/usr/bin/env node
import { Command } from "commander";
import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, basename, join } from "path";
import { SmithyParser } from "./smithy-parser.js";
import { generateMcpServer, GeneratorOptions } from "./mcp-generator.js";

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
  });

program.parse();
