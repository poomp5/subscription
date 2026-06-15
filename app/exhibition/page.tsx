import Link from "next/link";
import { notFound } from "next/navigation";
import { findStudent } from "../data/students";
import { DEPARTMENTS } from "../data/departments";
import { sql } from "../lib/db";
import { ensureSchema } from "../lib/schema";
import ExhibitionPicker from "../components/ExhibitionPicker";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ id?: string }>;

export default async function ExhibitionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id } = await searchParams;
  if (!id) notFound();
  const student = findStudent(id);
  if (!student) notFound();

  await ensureSchema();

  const [countRows, choiceRows] = await Promise.all([
    sql`
      SELECT department_id, COUNT(*)::int AS n
      FROM exhibition_choices
      GROUP BY department_id
    `,
    sql`
      SELECT department_id FROM exhibition_choices
      WHERE student_id = ${student.studentId} LIMIT 1
    `,
  ]);

  const counts: Record<string, number> = {};
  for (const d of DEPARTMENTS) counts[d.id] = 0;
  for (const r of countRows as { department_id: string; n: number }[]) {
    counts[r.department_id] = r.n;
  }

  const choice =
    (choiceRows[0] as { department_id: string } | undefined)?.department_id ?? null;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-5 sm:py-12">
      <div className="w-full max-w-2xl">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-xs font-medium text-violet-700">
            🎪 จัดนิทรรศการ
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-violet-900 sm:text-3xl">
            สวัสดี {student.nicknameTh} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            เลือกฝ่ายที่ต้องการเข้าร่วม — เลือกได้คนละหนึ่งฝ่าย และเลือกแล้วเปลี่ยนไม่ได้
          </p>
        </section>

        <section className="mt-6 fade-up">
          <ExhibitionPicker
            studentId={student.studentId}
            initialCounts={counts}
            initialChoice={choice}
          />
        </section>
      </div>
    </main>
  );
}
