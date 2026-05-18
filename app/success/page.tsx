import Link from "next/link";
import { findStudent } from "../data/students";
import { findPlan } from "../data/plans";

type SearchParams = Promise<{ ref?: string; id?: string; plan?: string }>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ref, id, plan: planId } = await searchParams;
  const student = id ? findStudent(id) : undefined;
  const plan = planId ? findPlan(planId) : undefined;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-5">
      <div className="w-full max-w-md fade-up">
        <div className="card p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <svg className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408l2.796 2.796 6.796-6.796a1 1 0 011.408 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-violet-900 sm:text-3xl">
            ส่งข้อมูลแล้ว
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            ขอบคุณ{student ? `${student.nicknameTh}`: ""}แอดมินจะตรวจสอบให้ทันที
          </p>

          <div className="mt-5 card-soft p-4 text-left text-sm space-y-2">
            {ref && <Row label="หมายเลขอ้างอิง" value={ref} mono />}
            {plan && <Row label="แพ็กเกจ" value={`${plan.nameTh} (฿${plan.priceLabel})`} />}
            {student && (
              <Row
                label="ผู้สมัคร"
                value={`${student.firstNameTh} ${student.lastNameTh}`}
              />
            )}
          </div>

          <Link
            href="/"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={`text-foreground ${mono ? "font-mono text-xs tracking-wider" : ""}`}>
        {value}
      </span>
    </div>
  );
}
