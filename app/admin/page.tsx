import { redirect } from "next/navigation";
import { isAdmin } from "../lib/admin";
import { sql, type SubmissionRow } from "../lib/db";
import { ensureSchema } from "../lib/schema";
import AdminDashboard from "../components/AdminDashboard";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; q?: string }>;

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

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

  const rowsRaw =
    status === "ALL" && !q
      ? await sql`
          SELECT * FROM submissions
          ORDER BY created_at DESC
          LIMIT 500
        `
      : status === "ALL" && q
        ? await sql`
            SELECT * FROM submissions
            WHERE student_id ILIKE ${"%" + q + "%"}
               OR nickname_th ILIKE ${"%" + q + "%"}
               OR nickname_en ILIKE ${"%" + q + "%"}
               OR full_name_th ILIKE ${"%" + q + "%"}
               OR full_name_en ILIKE ${"%" + q + "%"}
               OR ref ILIKE ${"%" + q + "%"}
            ORDER BY created_at DESC
            LIMIT 500
          `
        : !q
          ? await sql`
              SELECT * FROM submissions
              WHERE status = ${status}
              ORDER BY created_at DESC
              LIMIT 500
            `
          : await sql`
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
              ORDER BY created_at DESC
              LIMIT 500
            `;

  const rows = rowsRaw as unknown as SubmissionRow[];

  const counts = (await sql`
    SELECT status, COUNT(*)::int AS count FROM submissions GROUP BY status
  `) as unknown as Array<{ status: string; count: number }>;

  const summary = {
    ALL: rows.length,
    PENDING: counts.find((c) => c.status === "PENDING")?.count ?? 0,
    APPROVED: counts.find((c) => c.status === "APPROVED")?.count ?? 0,
    REJECTED: counts.find((c) => c.status === "REJECTED")?.count ?? 0,
    TOTAL: counts.reduce((sum, c) => sum + c.count, 0),
  };

  return <AdminDashboard rows={rows} status={status} q={q} summary={summary} />;
}
