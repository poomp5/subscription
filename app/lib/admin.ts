import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "ds_admin";
const MAX_AGE = 60 * 60 * 8; // 8 ชม.

function getPassword(): string {
  return process.env.ADMIN_PASSWORD || "Admin@dsgen3";
}

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || getPassword();
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyPassword(input: string): boolean {
  if (typeof input !== "string" || input.length === 0) return false;
  return constantTimeEqual(input, getPassword());
}

export function makeSessionToken(): string {
  const issuedAt = Date.now().toString();
  const sig = sign(issuedAt);
  return `${issuedAt}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issuedAtStr, sig] = token.split(".");
  if (!issuedAtStr || !sig) return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > MAX_AGE * 1000) return false;
  const expected = sign(issuedAtStr);
  return constantTimeEqual(sig, expected);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE = MAX_AGE;
