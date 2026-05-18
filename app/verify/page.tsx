import Link from "next/link";
import { notFound } from "next/navigation";
import { findStudent } from "../data/students";
import { PLANS } from "../data/plans";
import { sql } from "../lib/db";
import { ensureSchema } from "../lib/schema";
import { promptpayUrl } from "../data/plans";
import PlanGrid from "../components/PlanGrid";
import PenaltyQR from "../components/PenaltyQR";
import PendingBanner from "../components/PendingBanner";

type SearchParams = Promise<{ id?: string }>;

/** ค่าปรับรวม n ครั้ง: 20+25+30+... = n×20 + 5×n(n-1)/2 */
function totalPenalty(count: number): number {
  if (count <= 0) return 0;
  return count * 20 + (5 * count * (count - 1)) / 2;
}

/** ยอดรวมที่ควรจ่ายครบทุกแพ็กเกจ (ทุก plan รวม ฿600) */
const TOTAL_TARGET = 600;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id } = await searchParams;
  if (!id) notFound();
  const student = findStudent(id);
  if (!student) notFound();

  await ensureSchema();

  const [submissionRows, penaltyRows, pendingPenaltyRows, latestSubRows] = await Promise.all([
    sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total
      FROM submissions
      WHERE student_id = ${student.studentId} AND status = 'APPROVED'
        AND plan_id != 'penalty'
    `,
    sql`
      SELECT count, reasons FROM penalties WHERE student_id = ${student.studentId}
    `,
    sql`
      SELECT ref FROM submissions
      WHERE student_id = ${student.studentId}
        AND plan_id = 'penalty' AND status = 'PENDING'
      LIMIT 1
    `,
    sql`
      SELECT ref, status, plan_name_th FROM submissions
      WHERE student_id = ${student.studentId}
        AND plan_id != 'penalty'
        AND status IN ('PENDING', 'REJECTED')
      ORDER BY created_at DESC
      LIMIT 1
    `,
  ]);

  const paidTotal = Number((submissionRows[0] as { total: string }).total);
  const remaining = Math.max(0, TOTAL_TARGET - paidTotal);
  const penaltyRow = penaltyRows[0] as { count: number; reasons: string[] } | undefined;
  const penaltyCount = penaltyRow?.count ?? 0;
  const penaltyReasons: string[] = penaltyRow?.reasons ?? [];
  const penaltyAmount = totalPenalty(penaltyCount);
  const penaltyQrUrl = penaltyAmount > 0 ? promptpayUrl(penaltyAmount) : null;
  const penaltyPendingRef = (pendingPenaltyRows[0] as { ref: string } | undefined)?.ref ?? null;
  const latestSub = latestSubRows[0] as { ref: string; status: string; plan_name_th: string } | undefined;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-5 sm:py-12">
      <div className="w-full max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          กลับ
        </Link>

        <section className="mt-5 fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-violet-900 sm:text-3xl">
            สวัสดี {student.nicknameTh} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">เลือกแพ็กเกจที่ต้องการได้เลย</p>
        </section>

        {/* สรุปยอด */}
        <section className="mt-4 grid grid-cols-2 gap-3 fade-up sm:grid-cols-3">
          <StatCard
            label="จ่ายไปแล้ว"
            value={`฿${paidTotal.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            sub={`จากทั้งหมด ฿${TOTAL_TARGET}`}
            color="green"
          />
          <StatCard
            label="ขาดอีก"
            value={remaining > 0 ? `฿${remaining.toLocaleString("th-TH")}` : "ครบแล้ว ✓"}
            sub={remaining > 0 ? "ยังไม่ครบ" : "จ่ายครบทุกงวด"}
            color={remaining > 0 ? "amber" : "green"}
          />
          <StatCard
            label="โดนปรับในห้อง"
            value={`${penaltyCount} ครั้ง`}
            sub={penaltyAmount > 0 ? `รวม ฿${penaltyAmount}` : "ไม่มีค้างชำระ"}
            color={penaltyCount > 0 ? "rose" : "neutral"}
            className="col-span-2 sm:col-span-1"
          />
        </section>

        {/* ยอดค้างชำระ (โทษ) */}
        {penaltyAmount > 0 && penaltyQrUrl && (
          <section className="mt-4 fade-up">
            <PenaltyQR
              studentId={student.studentId}
              amount={penaltyAmount}
              count={penaltyCount}
              reasons={penaltyReasons}
              qrUrl={penaltyQrUrl}
              pendingRef={penaltyPendingRef}
            />
          </section>
        )}

        {/* สถานะสลิปล่าสุด */}
        {latestSub && (
          <section className="mt-6 fade-up">
            <PendingBanner
              status={latestSub.status as "PENDING" | "REJECTED"}
              ref_={latestSub.ref}
              planName={latestSub.plan_name_th}
            />
          </section>
        )}

        {/* เลือกแพ็กเกจ */}
        <section className="mt-8 fade-up">
          <h2 className="text-lg font-semibold text-violet-900 sm:text-xl">เลือกแพ็กเกจ</h2>
          <p className="mt-0.5 text-sm text-muted">
            จ่ายผ่าน PromptPay · เริ่มใช้งานทันทีหลังยืนยัน
          </p>
          <PlanGrid studentId={student.studentId} plans={PLANS} />
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  className = "",
}: {
  label: string;
  value: string;
  sub: string;
  color: "green" | "amber" | "rose" | "neutral";
  className?: string;
}) {
  const colors = {
    green: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    rose: "bg-rose-50 border-rose-200 text-rose-800",
    neutral: "bg-violet-50 border-violet-200 text-violet-800",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]} ${className}`}>
      <div className="text-[11px] font-medium uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 text-xl font-bold sm:text-2xl">{value}</div>
      <div className="mt-0.5 text-[11px] opacity-60">{sub}</div>
    </div>
  );
}
