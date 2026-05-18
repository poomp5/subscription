import { NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, makeSessionToken, verifyPassword } from "../../../lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!verifyPassword(body.password ?? "")) {
    await new Promise((r) => setTimeout(r, 400)); // throttle brute force
    return Response.json({ ok: false, error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const token = makeSessionToken();
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    [
      `${ADMIN_COOKIE}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${ADMIN_COOKIE_MAX_AGE}`,
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; "),
  );
  return res;
}

export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
  return res;
}
