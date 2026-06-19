import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { findStudent } from "../data/students";
import { isDietaryId, type DietaryId } from "../data/dietary";
import { sql } from "../lib/db";
import { ensureSchema } from "../lib/schema";
import DietaryForm from "../components/DietaryForm";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ id?: string }>;

export default async function DietaryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id } = await searchParams;
  if (!id) notFound();
  const student = findStudent(id);
  if (!student) notFound();

  await ensureSchema();

  const rows = await sql`
    SELECT restrictions, other_note FROM dietary_choices WHERE student_id = ${student.studentId} LIMIT 1
  `;
  const row = rows[0] as { restrictions: string[]; other_note: string } | undefined;
  const saved = !!row;
  const restrictions = ((row?.restrictions ?? []) as string[]).filter(isDietaryId) as DietaryId[];
  const otherNote = row?.other_note ?? "";

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-5 sm:py-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Link>

        <section className="mt-5 fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-xs font-medium text-violet-700">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            ข้อมูลด้านอาหาร
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-violet-900 sm:text-3xl">
            สวัสดี {student.nicknameTh}
          </h1>
          <p className="mt-1 text-sm text-muted">
            เลือกข้อจำกัดด้านอาหารของคุณ — เลือกได้มากกว่าหนึ่งข้อ หากไม่มีให้ติ๊ก “ไม่แพ้อะไร”
          </p>
        </section>

        <section className="mt-6 fade-up">
          <DietaryForm
            studentId={student.studentId}
            initialRestrictions={restrictions}
            initialOtherNote={otherNote}
            initialSaved={saved}
          />
        </section>
      </div>
    </main>
  );
}
