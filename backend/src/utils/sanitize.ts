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
  return path.split('.').reduce<unknown>((curr, key) => {
    if (curr !== null && typeof curr === 'object' && key in (curr as object)) {
      return (curr as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
