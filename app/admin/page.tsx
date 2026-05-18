import { redirect } from "next/navigation";
import { isAdmin } from "../lib/admin";
import { sql, type SubmissionRow } from "../lib/db";
import { ensureSchema } from "../lib/schema";
import { STUDENTS } from "../data/students";
import AdminDashboard from "../components/AdminDashboard";
import type { StudentPenaltyRow } from "../components/PenaltyManager";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; q?: string }>;

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const TOTAL_TARGET = 600;

function totalPenalty(count: number) {
  if (count <= 0) return 0;
  return count * 20 + (5 * count * (count - 1)) / 2;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  await ensureSchema();

  const { status: statusRaw, q: qRaw } = await searchParams;
  const status: StatusFilter = (STATUS_FILTERS as readonly string[]).includes(
    (statusRaw || "").toUpperCase(),
  )
    ? ((statusRaw || "ALL").toUpperCase() as StatusFilter)
    : "ALL";
  const q = (qRaw || "").trim();

  const [rowsRaw, counts, paidRaw, penaltiesRaw] = await Promise.all([
    status === "ALL" && !q
      ? sql`SELECT * FROM submissions ORDER BY created_at DESC LIMIT 500`
      : status === "ALL" && q
        ? sql`
            SELECT * FROM submissions
            WHERE student_id ILIKE ${"%" + q + "%"}
               OR nickname_th ILIKE ${"%" + q + "%"}
               OR nickname_en ILIKE ${"%" + q + "%"}
               OR full_name_th ILIKE ${"%" + q + "%"}
               OR full_name_en ILIKE ${"%" + q + "%"}
               OR ref ILIKE ${"%" + q + "%"}
            ORDER BY created_at DESC LIMIT 500
          `
        : !q
          ? sql`SELECT * FROM submissions WHERE status = ${status} ORDER BY created_at DESC LIMIT 500`
          : sql`
              SELECT * FROM submissions
              WHERE status = ${status}
                AND (
                  student_id ILIKE ${"%" + q + "%"}
                  OR nickname_th ILIKE ${"%" + q + "%"}
                  OR nickname_en ILIKE ${"%" + q + "%"}
                  OR full_name_th ILIKE ${"%" + q + "%"}
                  OR full_name_en ILIKE ${"%" + q + "%"}
                  OR ref ILIKE ${"%" + q + "%"}
                )
              ORDER BY created_at DESC LIMIT 500
            `,
    sql`SELECT status, COUNT(*)::int AS count FROM submissions GROUP BY status`,
    sql`SELECT student_id, COALESCE(SUM(amount),0)::numeric AS total FROM submissions WHERE status = 'APPROVED' GROUP BY student_id`,
    sql`SELECT student_id, count, COALESCE(reasons, '[]'::jsonb) AS reasons FROM penalties`,
  ]);

  const rows = rowsRaw as unknown as SubmissionRow[];
  const countArr = counts as unknown as Array<{ status: string; count: number }>;

  const summary = {
    ALL: rows.length,
    PENDING: countArr.find((c) => c.status === "PENDING")?.count ?? 0,
    APPROVED: countArr.find((c) => c.status === "APPROVED")?.count ?? 0,
    REJECTED: countArr.find((c) => c.status === "REJECTED")?.count ?? 0,
    TOTAL: countArr.reduce((s, c) => s + c.count, 0),
  };

  const paidMap = new Map(
    (paidRaw as unknown as Array<{ student_id: string; total: string }>).map((r) => [
      r.student_id,
      Number(r.total),
    ]),
  );
  const penaltyMap = new Map(
    (penaltiesRaw as unknown as Array<{ student_id: string; count: number; reasons: string[] }>).map((r) => [
      r.student_id,
      { count: r.count, reasons: r.reasons ?? [] },
    ]),
  );

  const penaltyRows: StudentPenaltyRow[] = STUDENTS.map((s) => {
    const paidTotal = paidMap.get(s.studentId) ?? 0;
    const pen = penaltyMap.get(s.studentId) ?? { count: 0, reasons: [] };
    return {
      no: s.no,
      studentId: s.studentId,
      nicknameTh: s.nicknameTh,
      fullNameTh: `${s.firstNameTh} ${s.lastNameTh}`,
      paidTotal,
      remaining: Math.max(0, TOTAL_TARGET - paidTotal),
      penaltyCount: pen.count,
      penaltyAmount: totalPenalty(pen.count),
      reasons: pen.reasons,
    };
  });

  return (
    <AdminDashboard
      rows={rows}
      status={status}
      q={q}
      summary={summary}
      penaltyRows={penaltyRows}
    />
  );
}
