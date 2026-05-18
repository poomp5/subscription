import { NextRequest } from "next/server";
import { isAdmin } from "../../../../lib/admin";
import { sql } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "approve" | "reject" | "reset" | "delete";

const STATUS_BY_ACTION: Record<Exclude<Action, "delete">, "APPROVED" | "REJECTED" | "PENDING"> = {
  approve: "APPROVED",
  reject: "REJECTED",
  reset: "PENDING",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const submissionId = Number(id);
  if (!Number.isFinite(submissionId)) {
    return Response.json({ ok: false, error: "ID ไม่ถูกต้อง" }, { status: 400 });
  }

  let body: { action?: Action };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const action = body.action;
  if (!action || !(action === "approve" || action === "reject" || action === "reset" || action === "delete")) {
    return Response.json({ ok: false, error: "action ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    if (action === "delete") {
      await sql`DELETE FROM submissions WHERE id = ${submissionId}`;
    } else {
      const status = STATUS_BY_ACTION[action];
      const reviewedAt = status === "PENDING" ? null : new Date().toISOString();
      await sql`
        UPDATE submissions
        SET status = ${status}, reviewed_at = ${reviewedAt}
        WHERE id = ${submissionId}
      `;
      // อนุมัติ penalty submission → reset ค่าปรับเป็น 0
      if (action === "approve") {
        await sql`
          UPDATE penalties
          SET count = 0, reasons = '[]', updated_at = NOW()
          WHERE student_id = (
            SELECT student_id FROM submissions WHERE id = ${submissionId} AND plan_id = 'penalty'
          )
        `;
      }
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[admin/submissions PATCH] failed:", err);
    return Response.json({ ok: false, error: "ทำรายการไม่สำเร็จ" }, { status: 500 });
  }
}
