// Simple in-memory rate limiter factory. On Vercel each serverless instance
// has its own map, so real ceilings are somewhat higher than configured —
// acceptable at our size. Upgrade to Vercel KV if abuse ever appears.
export function makeRateLimiter(maxHits: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function limited(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
    if (recent.length >= maxHits) return true;
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return false;
  };
}

/** The visitor's IP as seen through Vercel's proxy headers. */
export function requestIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
