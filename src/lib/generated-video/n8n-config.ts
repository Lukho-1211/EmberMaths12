import { timingSafeEqual } from "crypto";

export function appBaseUrl(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function n8nWebhookUrl(): string | null {
  const url = process.env.N8N_WEBHOOK_URL?.trim();
  return url || null;
}

export function n8nWebhookSecret(): string | null {
  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  return secret || null;
}

const LOCALHOST_CALLBACK_ERROR =
  "n8n cloud cannot reach localhost. Generate from production (embermaths12.com), or open admin through a public tunnel and generate there so the callback Host is reachable.";

/**
 * Resolve the public base URL n8n should call back to, from the request that
 * handled Generate. Never falls back to APP_URL when Host is localhost — that
 * silently pointed n8n at production while the admin UI was local.
 */
export function callbackBaseUrl(request: Request): { ok: true; baseUrl: string } | { ok: false; error: string } {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostHeader = request.headers.get("host")?.trim();
  const host = forwardedHost || hostHeader || "";

  if (!host) {
    return { ok: false, error: LOCALHOST_CALLBACK_ERROR };
  }

  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return { ok: false, error: LOCALHOST_CALLBACK_ERROR };
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : "https";

  return { ok: true, baseUrl: `${proto}://${host}`.replace(/\/$/, "") };
}

/** Constant-time compare for the shared n8n ↔ Ember secret. */
export function verifyN8nSecret(headerValue: string | null): boolean {
  const expected = n8nWebhookSecret();
  if (!expected || !headerValue) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(headerValue);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
