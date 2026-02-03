/**
 * TypeScript types for Smithy JSON AST
 * Based on the Smithy 2.0 specification
 */

export interface SmithyModel {
  smithy: string;
  metadata?: Record<string, unknown>;
  shapes: Record<string, SmithyShape>;
}

export type SmithyShape =
  | ServiceShape
  | ResourceShape
  | OperationShape
  | StructureShape
  | ListShape
  | MapShape
  | UnionShape
  | EnumShape
  | IntEnumShape
  | SimpleShape;

export interface BaseShape {
  type: string;
  traits?: Record<string, unknown>;
}

export interface ServiceShape extends BaseShape {
  type: "service";
  version?: string;
  operations?: ShapeReference[];
  resources?: ShapeReference[];
  errors?: ShapeReference[];
  rename?: Record<string, string>;
}

export interface ResourceShape extends BaseShape {
  type: "resource";
  identifiers?: Record<string, ShapeReference>;
  create?: ShapeReference;
  read?: ShapeReference;
  update?: ShapeReference;
  delete?: ShapeReference;
  list?: ShapeReference;
  operations?: ShapeReference[];
  collectionOperations?: ShapeReference[];
  resources?: ShapeReference[];
}

export interface OperationShape extends BaseShape {
  type: "operation";
  input?: ShapeReference;
  output?: ShapeReference;
  errors?: ShapeReference[];
}

export interface StructureShape extends BaseShape {
  type: "structure";
  members?: Record<string, MemberShape>;
}

export interface MemberShape {
  target: string;
  traits?: Record<string, unknown>;
}

export interface ListShape extends BaseShape {
  type: "list";
  member: MemberShape;
}

export interface MapShape extends BaseShape {
  type: "map";
  key: MemberShape;
  value: MemberShape;
}

export interface UnionShape extends BaseShape {
  type: "union";
  members: Record<string, MemberShape>;
}

export interface EnumShape extends BaseShape {
  type: "enum";
  members: Record<string, { traits?: Record<string, unknown> }>;
}

export interface IntEnumShape extends BaseShape {
  type: "intEnum";
  members: Record<string, { value: number; traits?: Record<string, unknown> }>;
}

export interface SimpleShape extends BaseShape {
  type:
    | "blob"
    | "boolean"
    | "string"
    | "byte"
    | "short"
    | "integer"
    | "long"
    | "float"
    | "double"
    | "bigInteger"
    | "bigDecimal"
    | "timestamp"
    | "document";
}

export interface ShapeReference {
  target: string;
}

// Common Smithy traits
export interface HttpTrait {
  method: string;
  uri: string;
  code?: number;
}

export interface DocumentationTrait {
  value: string;
}

// Helper type to extract shape name from fully qualified name
export function getShapeName(shapeId: string): string {
  const parts = shapeId.split("#");
  return parts.length > 1 ? parts[1] : shapeId;
}

export function getNamespace(shapeId: string): string {
  const parts = shapeId.split("#");
  return parts.length > 1 ? parts[0] : "";
}
