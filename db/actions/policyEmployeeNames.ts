export function normalizeEmployeeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
