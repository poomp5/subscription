import { NextRequest } from "next/server";
import { isAdmin } from "../../lib/admin";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/penalties?id=<studentId>
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "id required" }, { status: 400 });

  await ensureSchema();
  const rows = await sql`SELECT count, reasons FROM penalties WHERE student_id = ${id}`;
  const row = rows[0] as { count: number; reasons: string[] } | undefined;
  return Response.json({ ok: true, count: row?.count ?? 0, reasons: row?.reasons ?? [] });
}

// POST /api/penalties  { studentId, count, reasons }  — admin only
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    studentId?: string;
    count?: number;
    reasons?: string[];
  };
  if (!body.studentId || typeof body.count !== "number") {
    return Response.json({ ok: false, error: "studentId and count required" }, { status: 400 });
  }
  const reasons = body.reasons ?? [];
  await ensureSchema();
  await sql`
    INSERT INTO penalties (student_id, count, reasons, updated_at)
    VALUES (${body.studentId}, ${body.count}, ${JSON.stringify(reasons)}, NOW())
    ON CONFLICT (student_id) DO UPDATE
      SET count = EXCLUDED.count, reasons = EXCLUDED.reasons, updated_at = NOW()
  `;
  return Response.json({ ok: true });
}
