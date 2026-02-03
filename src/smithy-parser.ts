import { readFile } from "fs/promises";
import {
  SmithyModel,
  SmithyShape,
  ServiceShape,
  ResourceShape,
  OperationShape,
  StructureShape,
  ListShape,
  MapShape,
  UnionShape,
  EnumShape,
  MemberShape,
  getShapeName,
  HttpTrait,
} from "./smithy-types.js";

export interface PaginationConfig {
  inputToken?: string;  // Input field name for pagination token
  outputToken?: string; // Output field name for next page token
  pageSize?: string;    // Input field name for page size
  items?: string;       // Output field name containing the list items
}

export interface ParsedOperation {
  name: string;
  shapeId: string;
  documentation?: string;
  http?: HttpTrait;
  input?: ParsedStructure;
  output?: ParsedStructure;
  errors?: string[];
  pagination?: PaginationConfig;
}

export interface ParsedStructure {
  name: string;
  shapeId: string;
  documentation?: string;
  members: ParsedMember[];
  required: string[];
}

export interface HttpBinding {
  type: "label" | "query" | "header" | "prefixHeaders" | "payload" | "body";
  name?: string; // For query/header, the wire name
}

export interface ParsedMember {
  name: string;
  target: string;
  documentation?: string;
  required: boolean;
  jsonSchema: JsonSchema;
  httpBinding?: HttpBinding;
  jsonName?: string; // Wire name if different from member name (@jsonName trait)
}

export interface ParsedService {
  name: string;
  shapeId: string;
  version?: string;
  documentation?: string;
  operations: ParsedOperation[];
  protocol?: string;
  baseUrl?: string;
  endpointPrefix?: string;
  sigv4ServiceName?: string;
}

export type JsonSchema = {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  additionalProperties?: JsonSchema;
  required?: string[];
  enum?: (string | number)[];
  oneOf?: JsonSchema[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: unknown;
};

export class SmithyParser {
  private model: SmithyModel;
  private resolvedShapes: Map<string, JsonSchema> = new Map();

  constructor(model: SmithyModel) {
    this.model = model;
  }

  static async fromFile(filePath: string): Promise<SmithyParser> {
    const content = await readFile(filePath, "utf-8");
    const model = JSON.parse(content) as SmithyModel;
    return new SmithyParser(model);
  }

  static fromJson(json: SmithyModel): SmithyParser {
    return new SmithyParser(json);
  }

  parseServices(): ParsedService[] {
    const services: ParsedService[] = [];

    for (const [shapeId, shape] of Object.entries(this.model.shapes)) {
      if (shape.type === "service") {
        services.push(this.parseService(shapeId, shape as ServiceShape));
      }
    }

    return services;
  }

  private parseService(shapeId: string, shape: ServiceShape): ParsedService {
    const operations: ParsedOperation[] = [];

    // Parse direct operations on the service
    if (shape.operations) {
      for (const opRef of shape.operations) {
        const opShape = this.model.shapes[opRef.target];
        if (opShape && opShape.type === "operation") {
          operations.push(
            this.parseOperation(opRef.target, opShape as OperationShape)
          );
        }
      }
    }

    // Parse operations from resources (CRUD operations)
    if (shape.resources) {
      for (const resourceRef of shape.resources) {
        this.extractResourceOperations(resourceRef.target, operations);
      }
    }

    // Detect protocol from traits
    let protocol: string | undefined;
    let baseUrl: string | undefined;
    let endpointPrefix: string | undefined;
    let sigv4ServiceName: string | undefined;

    if (shape.traits) {
      if (shape.traits["aws.protocols#restJson1"]) {
        protocol = "restJson1";
      } else if (shape.traits["aws.protocols#restXml"]) {
        protocol = "restXml";
      } else if (shape.traits["aws.protocols#awsJson1_0"]) {
        protocol = "awsJson1_0";
      } else if (shape.traits["aws.protocols#awsJson1_1"]) {
        protocol = "awsJson1_1";
      } else if (shape.traits["smithy.api#httpBearerAuth"]) {
        protocol = "http";
      }

      // Check for endpoint trait
      const endpointTrait = shape.traits["smithy.api#endpoint"] as { hostPrefix?: string } | undefined;
      if (endpointTrait?.hostPrefix) {
        baseUrl = endpointTrait.hostPrefix;
      }

      // Extract AWS service endpoint prefix
      const awsServiceTrait = shape.traits["aws.api#service"] as { endpointPrefix?: string } | undefined;
      if (awsServiceTrait?.endpointPrefix) {
        endpointPrefix = awsServiceTrait.endpointPrefix;
      }

      // Extract SigV4 service name
      const sigv4Trait = shape.traits["aws.auth#sigv4"] as { name?: string } | undefined;
      if (sigv4Trait?.name) {
        sigv4ServiceName = sigv4Trait.name;
      }
    }

    return {
      name: getShapeName(shapeId),
      shapeId,
      version: shape.version,
      documentation: this.getDocumentation(shape.traits),
      operations,
      protocol,
      baseUrl,
      endpointPrefix,
      sigv4ServiceName,
    };
  }

  private extractResourceOperations(
    resourceShapeId: string,
    operations: ParsedOperation[]
  ): void {
    const resourceShape = this.model.shapes[resourceShapeId];
    if (!resourceShape || resourceShape.type !== "resource") {
      return;
    }

    const resource = resourceShape as ResourceShape;

    // Extract CRUD lifecycle operations
    const lifecycleOps = [
      resource.create,
      resource.read,
      resource.update,
      resource.delete,
      resource.list,
    ];

    for (const opRef of lifecycleOps) {
      if (opRef) {
        const opShape = this.model.shapes[opRef.target];
        if (opShape && opShape.type === "operation") {
          operations.push(
            this.parseOperation(opRef.target, opShape as OperationShape)
          );
        }
      }
    }

    // Extract additional operations on the resource
    if (resource.operations) {
      for (const opRef of resource.operations) {
        const opShape = this.model.shapes[opRef.target];
        if (opShape && opShape.type === "operation") {
          operations.push(
            this.parseOperation(opRef.target, opShape as OperationShape)
          );
        }
      }
    }

    // Extract collection operations
    if (resource.collectionOperations) {
      for (const opRef of resource.collectionOperations) {
        const opShape = this.model.shapes[opRef.target];
        if (opShape && opShape.type === "operation") {
          operations.push(
            this.parseOperation(opRef.target, opShape as OperationShape)
          );
        }
      }
    }

    // Recursively extract from nested resources
    if (resource.resources) {
      for (const nestedResourceRef of resource.resources) {
        this.extractResourceOperations(nestedResourceRef.target, operations);
      }
    }
  }

  private parseOperation(
    shapeId: string,
    shape: OperationShape
  ): ParsedOperation {
    const op: ParsedOperation = {
      name: getShapeName(shapeId),
      shapeId,
      documentation: this.getDocumentation(shape.traits),
    };

    // Get HTTP trait
    if (shape.traits?.["smithy.api#http"]) {
      op.http = shape.traits["smithy.api#http"] as HttpTrait;
    }

    // Get pagination trait
    const pagination = this.getPagination(shape.traits);
    if (pagination) {
      op.pagination = pagination;
    }

    // Parse input structure
    if (shape.input) {
      const inputShape = this.model.shapes[shape.input.target];
      if (inputShape && inputShape.type === "structure") {
        op.input = this.parseStructure(
          shape.input.target,
          inputShape as StructureShape
        );
      }
    }

    // Parse output structure
    if (shape.output) {
      const outputShape = this.model.shapes[shape.output.target];
      if (outputShape && outputShape.type === "structure") {
        op.output = this.parseStructure(
          shape.output.target,
          outputShape as StructureShape
        );
      }
    }

    // Parse errors
    if (shape.errors) {
      op.errors = shape.errors.map((e) => getShapeName(e.target));
    }

    return op;
  }

  private parseStructure(
    shapeId: string,
    shape: StructureShape
  ): ParsedStructure {
    const members: ParsedMember[] = [];
    const required: string[] = [];

    if (shape.members) {
      for (const [memberName, member] of Object.entries(shape.members)) {
        const isRequired = this.isRequired(member.traits);
        if (isRequired) {
          required.push(memberName);
        }

        members.push({
          name: memberName,
          target: member.target,
          documentation: this.getDocumentation(member.traits),
          required: isRequired,
          jsonSchema: this.shapeToJsonSchema(member.target),
          httpBinding: this.getHttpBinding(member.traits),
          jsonName: this.getJsonName(member.traits),
        });
      }
    }

    return {
      name: getShapeName(shapeId),
      shapeId,
      documentation: this.getDocumentation(shape.traits),
      members,
      required,
    };
  }

  private getHttpBinding(traits?: Record<string, unknown>): HttpBinding | undefined {
    if (!traits) return undefined;

    if (traits["smithy.api#httpLabel"] !== undefined) {
      return { type: "label" };
    }
    if (traits["smithy.api#httpQuery"] !== undefined) {
      return { type: "query", name: traits["smithy.api#httpQuery"] as string };
    }
    if (traits["smithy.api#httpHeader"] !== undefined) {
      return { type: "header", name: traits["smithy.api#httpHeader"] as string };
    }
    if (traits["smithy.api#httpPrefixHeaders"] !== undefined) {
      return { type: "prefixHeaders", name: traits["smithy.api#httpPrefixHeaders"] as string };
    }
    if (traits["smithy.api#httpPayload"] !== undefined) {
      return { type: "payload" };
    }

    return undefined; // Will go in body by default
  }

  private getJsonName(traits?: Record<string, unknown>): string | undefined {
    if (!traits) return undefined;
    return traits["smithy.api#jsonName"] as string | undefined;
  }

  private getPagination(traits?: Record<string, unknown>): PaginationConfig | undefined {
    if (!traits) return undefined;

    const paginatedTrait = traits["smithy.api#paginated"] as {
      inputToken?: string;
      outputToken?: string;
      pageSize?: string;
      items?: string;
    } | undefined;

    if (!paginatedTrait) return undefined;

    return {
      inputToken: paginatedTrait.inputToken,
      outputToken: paginatedTrait.outputToken,
      pageSize: paginatedTrait.pageSize,
      items: paginatedTrait.items,
    };
  }

  shapeToJsonSchema(shapeId: string): JsonSchema {
    // Check cache first
    if (this.resolvedShapes.has(shapeId)) {
      return this.resolvedShapes.get(shapeId)!;
    }

    // Handle Smithy prelude types
    const preludeSchema = this.preludeToJsonSchema(shapeId);
    if (preludeSchema) {
      return preludeSchema;
    }

    const shape = this.model.shapes[shapeId];
    if (!shape) {
      // Unknown shape, return generic object
      return { type: "object" };
    }

    // Placeholder to handle circular references
    const placeholder: JsonSchema = {};
    this.resolvedShapes.set(shapeId, placeholder);

    const schema = this.convertShapeToSchema(shapeId, shape);
    Object.assign(placeholder, schema);

    return placeholder;
  }

  private preludeToJsonSchema(shapeId: string): JsonSchema | null {
    const preludeTypes: Record<string, JsonSchema> = {
      "smithy.api#String": { type: "string" },
      "smithy.api#Blob": { type: "string", format: "base64" },
      "smithy.api#Boolean": { type: "boolean" },
      "smithy.api#Byte": { type: "integer", minimum: -128, maximum: 127 },
      "smithy.api#Short": { type: "integer", minimum: -32768, maximum: 32767 },
      "smithy.api#Integer": { type: "integer" },
      "smithy.api#Long": { type: "integer" },
      "smithy.api#Float": { type: "number" },
      "smithy.api#Double": { type: "number" },
      "smithy.api#BigInteger": { type: "string", format: "bigint" },
      "smithy.api#BigDecimal": { type: "string", format: "decimal" },
      "smithy.api#Timestamp": { type: "string", format: "date-time" },
      "smithy.api#Document": { type: "object" },
      "smithy.api#Unit": { type: "object" },
    };

    return preludeTypes[shapeId] || null;
  }

  private convertShapeToSchema(shapeId: string, shape: SmithyShape): JsonSchema {
    const documentation = this.getDocumentation(shape.traits);

    switch (shape.type) {
      case "string":
        return this.stringToSchema(shape, documentation);
      case "boolean":
        return this.booleanToSchema(shape, documentation);
      case "byte":
        return this.numberToSchema(shape, "integer", documentation, -128, 127);
      case "short":
        return this.numberToSchema(shape, "integer", documentation, -32768, 32767);
      case "integer":
      case "long":
        return this.numberToSchema(shape, "integer", documentation);
      case "float":
      case "double":
        return this.numberToSchema(shape, "number", documentation);
      case "bigInteger":
        return { type: "string", format: "bigint", description: documentation };
      case "bigDecimal":
        return { type: "string", format: "decimal", description: documentation };
      case "timestamp":
        return { type: "string", format: "date-time", description: documentation };
      case "blob":
        return { type: "string", format: "base64", description: documentation };
      case "document":
        return { type: "object", description: documentation };
      case "list":
        return this.listToSchema(shape as ListShape, documentation);
      case "map":
        return this.mapToSchema(shape as MapShape, documentation);
      case "structure":
        return this.structureToSchema(shape as StructureShape, documentation);
      case "union":
        return this.unionToSchema(shape as UnionShape, documentation);
      case "enum":
        return this.enumToSchema(shape as EnumShape, documentation);
      case "intEnum":
        return this.intEnumToSchema(shape, documentation);
      default:
        return { type: "object", description: documentation };
    }
  }

  private stringToSchema(shape: SmithyShape, documentation?: string): JsonSchema {
    const schema: JsonSchema = { type: "string", description: documentation };

    if (shape.traits) {
      const lengthTrait = shape.traits["smithy.api#length"] as { min?: number; max?: number } | undefined;
      if (lengthTrait) {
        if (lengthTrait.min !== undefined) schema.minLength = lengthTrait.min;
        if (lengthTrait.max !== undefined) schema.maxLength = lengthTrait.max;
      }

      const patternTrait = shape.traits["smithy.api#pattern"] as string | undefined;
      if (patternTrait) {
        schema.pattern = patternTrait;
      }

      const defaultTrait = shape.traits["smithy.api#default"];
      if (defaultTrait !== undefined) {
        schema.default = defaultTrait;
      }
    }

    return schema;
  }

  private booleanToSchema(shape: SmithyShape, documentation?: string): JsonSchema {
    const schema: JsonSchema = { type: "boolean", description: documentation };

    if (shape.traits) {
      const defaultTrait = shape.traits["smithy.api#default"];
      if (defaultTrait !== undefined) {
        schema.default = defaultTrait;
      }
    }

    return schema;
  }

  private numberToSchema(
    shape: SmithyShape,
    baseType: "integer" | "number",
    documentation?: string,
    defaultMin?: number,
    defaultMax?: number
  ): JsonSchema {
    const schema: JsonSchema = { type: baseType, description: documentation };

    // Apply default bounds for byte/short types
    if (defaultMin !== undefined) schema.minimum = defaultMin;
    if (defaultMax !== undefined) schema.maximum = defaultMax;

    if (shape.traits) {
      // @range trait overrides default bounds
      const rangeTrait = shape.traits["smithy.api#range"] as { min?: number; max?: number } | undefined;
      if (rangeTrait) {
        if (rangeTrait.min !== undefined) schema.minimum = rangeTrait.min;
        if (rangeTrait.max !== undefined) schema.maximum = rangeTrait.max;
      }

      const defaultTrait = shape.traits["smithy.api#default"];
      if (defaultTrait !== undefined) {
        schema.default = defaultTrait;
      }
    }

    return schema;
  }

  private listToSchema(shape: ListShape, documentation?: string): JsonSchema {
    return {
      type: "array",
      items: this.shapeToJsonSchema(shape.member.target),
      description: documentation,
    };
  }

  private mapToSchema(shape: MapShape, documentation?: string): JsonSchema {
    return {
      type: "object",
      additionalProperties: this.shapeToJsonSchema(shape.value.target),
      description: documentation,
    };
  }

  private structureToSchema(
    shape: StructureShape,
    documentation?: string
  ): JsonSchema {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    if (shape.members) {
      for (const [memberName, member] of Object.entries(shape.members)) {
        const memberSchema = this.shapeToJsonSchema(member.target);
        const memberDoc = this.getDocumentation(member.traits);

        properties[memberName] = memberDoc
          ? { ...memberSchema, description: memberDoc }
          : memberSchema;

        if (this.isRequired(member.traits)) {
          required.push(memberName);
        }
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
      description: documentation,
    };
  }

  private unionToSchema(shape: UnionShape, documentation?: string): JsonSchema {
    const oneOf: JsonSchema[] = [];

    for (const [memberName, member] of Object.entries(shape.members)) {
      oneOf.push({
        type: "object",
        properties: {
          [memberName]: this.shapeToJsonSchema(member.target),
        },
        required: [memberName],
      });
    }

    return {
      oneOf,
      description: documentation,
    };
  }

  private enumToSchema(shape: EnumShape, documentation?: string): JsonSchema {
    const enumValues: string[] = [];

    for (const [memberName, member] of Object.entries(shape.members)) {
      // Use the enumValue trait if present, otherwise use the member name
      const enumValue = member.traits?.["smithy.api#enumValue"] as string | undefined;
      enumValues.push(enumValue ?? memberName);
    }

    return {
      type: "string",
      enum: enumValues,
      description: documentation,
    };
  }

  private intEnumToSchema(
    shape: SmithyShape & { members: Record<string, { value: number }> },
    documentation?: string
  ): JsonSchema {
    const enumValues: number[] = [];

    for (const member of Object.values(shape.members)) {
      enumValues.push(member.value);
    }

    return {
      type: "integer",
      enum: enumValues,
      description: documentation,
    };
  }

  private getDocumentation(traits?: Record<string, unknown>): string | undefined {
    if (!traits) return undefined;
    return traits["smithy.api#documentation"] as string | undefined;
  }

  private isRequired(traits?: Record<string, unknown>): boolean {
    if (!traits) return false;
    return traits["smithy.api#required"] !== undefined;
  }
}
