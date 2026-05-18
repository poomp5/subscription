import { NextRequest } from "next/server";
import { sql } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) return Response.json({ status: "PENDING" });

  const rows = await sql`SELECT status FROM submissions WHERE ref = ${ref} LIMIT 1`;
  const status = (rows[0] as { status: string } | undefined)?.status ?? "PENDING";
  return Response.json({ status });
}
