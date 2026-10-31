/*
 * sanitize.ts
 * Provides sanitizeForLog (recursive sensitive-key redaction for safe logging) and
 * getNestedValue (dot-notation path traversal used for configurable token extraction).
 */
const SENSITIVE = new Set([
  'password', 'token', 'access_token', 'accessToken',
  'authorization', 'cookie', 'jwt', 'secret',
]);

export function sanitizeForLog(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForLog);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = SENSITIVE.has(k.toLowerCase()) ? '[REDACTED]' : sanitizeForLog(v);
  }
  return out;
}

export function getNestedValue(obj: unknown, path: string): unknown {
  // Used by auth.service to extract the token at the path configured in FINANVO_TOKEN_PATH
  return path.split('.').reduce<unknown>((curr, key) => {
    if (curr !== null && typeof curr === 'object' && key in (curr as object)) {
      return (curr as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
