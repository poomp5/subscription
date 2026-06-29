import { NextRequest } from "next/server";
import { findStudent } from "../../data/students";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim();
  const student = id ? findStudent(id) : undefined;
  if (!student) {
    return Response.json({ ok: false, error: "ไม่พบนักเรียน" }, { status: 400 });
  }

  await ensureSchema();

  const rows = await sql`
    SELECT status
    FROM submissions
    WHERE student_id = ${student.studentId}
      AND plan_id = 'wai-kru'
      AND status IN ('PENDING', 'APPROVED')
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = rows[0] as { status: "PENDING" | "APPROVED" } | undefined;

  return Response.json({
    ok: true,
    paid: !!row,
    status: row?.status ?? null,
  });
}
