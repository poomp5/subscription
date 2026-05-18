import Link from "next/link";
import { notFound } from "next/navigation";
import { findStudent } from "../data/students";
import { PLANS } from "../data/plans";
import PlanGrid from "../components/PlanGrid";

type SearchParams = Promise<{ id?: string }>;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id } = await searchParams;
  if (!id) notFound();
  const student = findStudent(id);
  if (!student) notFound();

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
          <p className="mt-1 text-sm text-muted">
            เลือกแพ็กเกจที่ต้องการได้เลย
          </p>
        </section>

        <section className="mt-4 card rounded-2xl p-4 fade-up sm:p-5">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Info label="เลขประจำตัว" value={student.studentId} mono />
            <Info
              label="ชื่อ"
              value={`${student.firstNameTh} ${student.lastNameTh}`}
            />
          </div>
        </section>

        <section className="mt-8 fade-up">
          <h2 className="text-lg font-semibold text-violet-900 sm:text-xl">
            เลือกแพ็กเกจ
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            จ่ายผ่าน PromptPay · เริ่มใช้งานทันทีหลังยืนยัน
          </p>
          <PlanGrid studentId={student.studentId} plans={PLANS} />
        </section>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted">{label}</span>
      <span
        className={`text-sm font-medium text-foreground ${
          mono ? "font-mono tracking-wider" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
