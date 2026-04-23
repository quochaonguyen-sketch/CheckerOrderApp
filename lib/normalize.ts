export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function normalizeOptionalCell(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
