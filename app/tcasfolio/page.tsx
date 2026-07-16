import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import TcasfolioForm from "../components/TcasfolioForm";
import { findStudent } from "../data/students";
import { sql } from "../lib/db";
import { ensureSchema } from "../lib/schema";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ id?: string }>;

export default async function TcasfolioPage({
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
    SELECT COALESCE(portfolio_url, '') AS portfolio_url
    FROM tcasfolio_links WHERE student_id = ${student.studentId} LIMIT 1
  `;
  const row = rows[0] as { portfolio_url: string } | undefined;
  const portfolioUrl = row?.portfolio_url ?? "";

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
            <ImageIcon className="h-3.5 w-3.5" />
            Doodee Future
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-violet-900 sm:text-3xl">
            สวัสดี {student.nicknameTh} (DEK70)
          </h1>
          <p className="mt-1 text-sm text-muted">
            อัปโหลดรูป Portfolio แล้วระบบจะสร้างลิงก์จาก Cloudflare R2 ให้
          </p>
        </section>

        <section className="mt-6 fade-up">
          <TcasfolioForm
            studentId={student.studentId}
            initialPortfolioUrl={portfolioUrl}
          />
        </section>
      </div>
    </main>
  );
}
