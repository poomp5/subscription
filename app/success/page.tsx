import { findStudent } from "../data/students";
import { findPlan } from "../data/plans";
import { sql } from "../lib/db";
import { ensureSchema } from "../lib/schema";
import SuccessPoller from "../components/SuccessPoller";

type SearchParams = Promise<{ ref?: string; id?: string; plan?: string }>;

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ref, id, plan: planId } = await searchParams;
  const student = id ? findStudent(id) : undefined;
  const plan = planId ? findPlan(planId) : undefined;

  let initialStatus: "PENDING" | "APPROVED" | "REJECTED" = "PENDING";
  if (ref) {
    try {
      await ensureSchema();
      const rows = await sql`SELECT status FROM submissions WHERE ref = ${ref} LIMIT 1`;
      const s = (rows[0] as { status: string } | undefined)?.status;
      if (s === "APPROVED" || s === "REJECTED") initialStatus = s;
    } catch {
      /* ถ้า DB error ก็แสดง PENDING ไปก่อน */
    }
  }

  return (
    <SuccessPoller
      ref_={ref ?? null}
      studentName={student?.nicknameTh ?? null}
      studentFullName={student ? `${student.firstNameTh} ${student.lastNameTh}` : null}
      planLabel={plan ? `${plan.nameTh} (฿${plan.priceLabel})` : null}
      initialStatus={initialStatus}
    />
  );
}
