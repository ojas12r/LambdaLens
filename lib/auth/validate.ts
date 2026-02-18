import { createHmac, timingSafeEqual } from "crypto";

/**
 * Validates webhook signatures for the ingest endpoint.
 */
export function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * Simple bearer token auth for the chat endpoint.
 * In production, use NextAuth.js or Clerk.
 */
export function validateBearerToken(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  // In production, validate JWT / session token here
  const token = authHeader.slice(7);
  return token.length > 0;
}