import { NextRequest } from "next/server";
import { isAdmin } from "../../../lib/admin";
import { sql } from "../../../lib/db";
import { findDepartment } from "../../../data/departments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  action?: "remove" | "move";
  studentId?: string;
  departmentId?: string;
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
    if (body.action === "remove") {
      await sql`DELETE FROM exhibition_choices WHERE student_id = ${studentId}`;
      return Response.json({ ok: true });
    }

    if (body.action === "move") {
      const dept = body.departmentId ? findDepartment(body.departmentId) : undefined;
      if (!dept) {
        return Response.json({ ok: false, error: "ไม่พบฝ่าย" }, { status: 400 });
      }
      // ย้ายโดยไม่บังคับ capacity (เป็นการจัดสรรโดยแอดมิน)
      const updated = await sql`
        UPDATE exhibition_choices
        SET department_id = ${dept.id}, created_at = NOW()
        WHERE student_id = ${studentId}
        RETURNING id
      `;
      if (updated.length === 0) {
        return Response.json(
          { ok: false, error: "นักเรียนคนนี้ยังไม่ได้เลือกฝ่าย" },
          { status: 404 },
        );
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (err) {
    console.error("[admin/exhibition PATCH] failed:", err);
    return Response.json({ ok: false, error: "ทำรายการไม่สำเร็จ" }, { status: 500 });
  }
}
