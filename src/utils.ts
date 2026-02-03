/**
 * Shared utilities for smithy-to-mcp
 */

/**
 * Convert PascalCase operation name to kebab-case tool name
 */
export function operationToToolName(operationName: string): string {
  return operationName
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

/**
 * Convert PascalCase waiter name to kebab-case
 */
export function waiterNameToToolName(waiterName: string): string {
  return waiterName
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

/**
 * Strip HTML tags and normalize whitespace
 */
export function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Escape a string for use in JavaScript code generation
 */
export function escapeStringForJs(str: string): string {
  return JSON.stringify(stripHtml(str));
}
