import { redirect } from "next/navigation";
import { isAdmin } from "../lib/admin";
import { sql, type SubmissionRow } from "../lib/db";
import { ensureSchema } from "../lib/schema";
import { STUDENTS, findStudent } from "../data/students";
import { DEPARTMENTS } from "../data/departments";
import { EXHIBITION_ROLES } from "../data/roles";
import {
  isDietaryId,
  isSeafoodItemId,
  type DietaryId,
  type SeafoodItemId,
} from "../data/dietary";
import { isFoodChoiceId, type FoodChoiceId } from "../data/food";
import AdminDashboard from "../components/AdminDashboard";
import type { StudentPenaltyRow } from "../components/PenaltyManager";
import type { ExhibitionChoiceRow } from "../components/ExhibitionManager";
import type { DietaryRow } from "../components/DietaryManager";
import type { FoodRow } from "../components/FoodManager";
import type { TcasfolioRow } from "../components/TcasfolioManager";

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

  const [rowsRaw, counts, paidRaw, penaltiesRaw, exhibitionRaw, dietaryRaw, foodRaw, tcasfolioRaw] = await Promise.all([
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
    sql`
      SELECT student_id, COALESCE(SUM(amount),0)::numeric AS total
      FROM submissions
      WHERE status = 'APPROVED'
        AND plan_id IN ('weekly', 'monthly', 'lifetime')
      GROUP BY student_id
    `,
    sql`SELECT student_id, count, COALESCE(reasons, '[]'::jsonb) AS reasons FROM penalties`,
    sql`
      SELECT student_id, student_no, nickname_th, full_name_th, department_id, created_at
      FROM exhibition_choices
      ORDER BY created_at ASC
    `,
    sql`
      SELECT student_id, COALESCE(restrictions, '[]'::jsonb) AS restrictions,
             COALESCE(other_note, '') AS other_note,
             COALESCE(seafood_items, '[]'::jsonb) AS seafood_items,
             COALESCE(seafood_other, '') AS seafood_other
      FROM dietary_choices
    `,
    sql`
      SELECT student_id, food_id, COALESCE(comment, '') AS comment
      FROM food_choices
    `,
    sql`
      SELECT student_id, COALESCE(portfolio_url, '') AS portfolio_url, updated_at
      FROM tcasfolio_links
    `,
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

  const exhibitionRows = (
    exhibitionRaw as unknown as Array<{
      student_id: string;
      student_no: number;
      nickname_th: string;
      full_name_th: string;
      department_id: string;
      created_at: string;
    }>
  ).map<ExhibitionChoiceRow>((r) => ({
    studentId: r.student_id,
    studentNo: r.student_no,
    nicknameTh: r.nickname_th,
    fullNameTh: r.full_name_th,
    departmentId: r.department_id,
    createdAt: r.created_at,
  }));

  const exhibitionDepts = DEPARTMENTS.map((d) => ({
    id: d.id,
    icon: d.icon,
    nameTh: d.nameTh,
    capacity: d.capacity,
  }));

  const exhibitionRoles = EXHIBITION_ROLES.map((r) => {
    const s = findStudent(r.studentId);
    return {
      studentId: r.studentId,
      title: r.title,
      icon: r.icon,
      nicknameTh: s?.nicknameTh ?? r.studentId,
      fullNameTh: s ? `${s.firstNameTh} ${s.lastNameTh}` : "",
    };
  });

  const dietaryMap = new Map(
    (
      dietaryRaw as unknown as Array<{
        student_id: string;
        restrictions: string[];
        other_note: string;
        seafood_items: string[];
        seafood_other: string;
      }>
    ).map((r) => [
      r.student_id,
      {
        restrictions: (r.restrictions ?? []).filter(isDietaryId) as DietaryId[],
        otherNote: r.other_note ?? "",
        seafoodItems: (r.seafood_items ?? []).filter(isSeafoodItemId) as SeafoodItemId[],
        seafoodOther: r.seafood_other ?? "",
      },
    ]),
  );

  const dietaryRows: DietaryRow[] = STUDENTS.map((s) => {
    const d = dietaryMap.get(s.studentId);
    return {
      studentId: s.studentId,
      studentNo: s.no,
      nicknameTh: s.nicknameTh,
      fullNameTh: `${s.firstNameTh} ${s.lastNameTh}`,
      restrictions: d ? d.restrictions : null,
      otherNote: d?.otherNote ?? "",
      seafoodItems: d?.seafoodItems ?? [],
      seafoodOther: d?.seafoodOther ?? "",
    };
  });

  const foodMap = new Map(
    (
      foodRaw as unknown as Array<{
        student_id: string;
        food_id: string;
        comment: string;
      }>
    )
      .filter((r) => isFoodChoiceId(r.food_id))
      .map((r) => [
        r.student_id,
        {
          foodId: r.food_id as FoodChoiceId,
          comment: r.comment ?? "",
        },
      ]),
  );

  const foodRows: FoodRow[] = STUDENTS.map((s) => {
    const food = foodMap.get(s.studentId);
    return {
      studentId: s.studentId,
      studentNo: s.no,
      nicknameTh: s.nicknameTh,
      fullNameTh: `${s.firstNameTh} ${s.lastNameTh}`,
      foodId: food?.foodId ?? null,
      comment: food?.comment ?? "",
    };
  });

  const tcasfolioMap = new Map(
    (
      tcasfolioRaw as unknown as Array<{
        student_id: string;
        portfolio_url: string;
        updated_at: string;
      }>
    ).map((r) => [
      r.student_id,
      {
        portfolioUrl: r.portfolio_url ?? "",
        updatedAt: r.updated_at,
      },
    ]),
  );

  const tcasfolioRows: TcasfolioRow[] = STUDENTS.map((s) => {
    const folio = tcasfolioMap.get(s.studentId);
    return {
      studentId: s.studentId,
      studentNo: s.no,
      nicknameTh: s.nicknameTh,
      fullNameTh: `${s.firstNameTh} ${s.lastNameTh}`,
      portfolioUrl: folio?.portfolioUrl ?? "",
      updatedAt: folio?.updatedAt ?? null,
    };
  });

  return (
    <AdminDashboard
      rows={rows}
      status={status}
      q={q}
      summary={summary}
      penaltyRows={penaltyRows}
      exhibitionRows={exhibitionRows}
      exhibitionDepts={exhibitionDepts}
      exhibitionRoles={exhibitionRoles}
      dietaryRows={dietaryRows}
      foodRows={foodRows}
      tcasfolioRows={tcasfolioRows}
    />
  );
}
