import { NextRequest } from "next/server";
import { isAdmin } from "../../../lib/admin";
import { sql } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  action?: "clear";
  studentId?: string;
};

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ ok: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const studentId = body.studentId?.trim();
  if (!studentId) {
    return Response.json({ ok: false, error: "ไม่พบเลขประจำตัว" }, { status: 400 });
  }

  try {
    if (body.action === "clear") {
      await sql`DELETE FROM food_choices WHERE student_id = ${studentId}`;
      return Response.json({ ok: true });
    }
    return Response.json({ ok: false, error: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (err) {
    console.error("[admin/food PATCH] failed:", err);
    return Response.json({ ok: false, error: "ทำรายการไม่สำเร็จ" }, { status: 500 });
  }
}
