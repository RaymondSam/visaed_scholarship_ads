export type Assurance = "aal1" | "aal2";

export type SessionPayload = {
  sub: string;
  aal: Assurance;
  exp: number;
};

const DEV_SECRET = "local-dev-only-auth-secret-not-for-production";

export function authSecret(): string {
  const configured = process.env.AUTH_SECRET;
  if (configured && configured.length >= 16) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set to at least 16 characters in production.");
  }
  return DEV_SECRET;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padding = (4 - (value.length % 4)) % 4;
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(padding);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function sealPayload(payload: SessionPayload): Promise<string> {
  const body = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await sign(body)}`;
}

export async function openPayload(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await sign(body);
  if (expected.length !== signature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  if (mismatch !== 0) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body))) as SessionPayload;
    if (!payload.sub || payload.exp < Date.now()) return null;
    if (payload.aal !== "aal1" && payload.aal !== "aal2") return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "visaed_session";
export const MFA_COOKIE = "visaed_mfa";
export const NOTICE_COOKIE = "visaed_notice";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function safeNextPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return fallback;
  }
  return value;
}
