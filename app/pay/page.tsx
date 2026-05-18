import Link from "next/link";
import { notFound } from "next/navigation";
import { findStudent } from "../data/students";
import { findPlan, promptpayUrl } from "../data/plans";
import PaymentClient from "../components/PaymentClient";

type SearchParams = Promise<{ id?: string; plan?: string }>;

export default async function PayPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { id, plan: planId } = await searchParams;
  if (!id || !planId) notFound();
  const student = findStudent(id);
  const plan = findPlan(planId);
  if (!student || !plan) notFound();

  const qrUrl = promptpayUrl(plan.price);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-5 sm:py-12">
      <div className="w-full max-w-3xl">
        <Link
          href={`/verify?id=${student.studentId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          เปลี่ยนแพ็กเกจ
        </Link>

        <div className="mt-5 fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-violet-900 sm:text-3xl">
            {plan.nameTh}
            <span className="ml-2 font-normal text-foreground">— ฿{plan.priceLabel}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            สแกน QR ด้วยแอปธนาคาร — ยอดเงินถูกล็อกไว้แล้ว
          </p>
        </div>

        <PaymentClient
          student={{
            studentId: student.studentId,
            nicknameTh: student.nicknameTh,
            nickname: student.nickname,
            firstNameTh: student.firstNameTh,
            lastNameTh: student.lastNameTh,
          }}
          plan={{
            id: plan.id,
            nameTh: plan.nameTh,
            price: plan.price,
            priceLabel: plan.priceLabel,
          }}
          qrUrl={qrUrl}
        />
      </div>
    </main>
  );
}
