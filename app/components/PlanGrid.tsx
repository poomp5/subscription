"use client";

import Link from "next/link";
import type { Plan } from "../data/plans";

export default function PlanGrid({
  studentId,
  plans,
}: {
  studentId: string;
  plans: Plan[];
}) {
  return (
    <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 md:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative flex flex-col rounded-2xl p-5 transition sm:p-6 ${
            plan.highlight
              ? "card-primary shadow-md shadow-violet-100"
              : "card hover:border-violet-300"
          }`}
        >
          {plan.badge && (
            <div
              className={`absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-semibold tracking-wide ${
                plan.highlight
                  ? "bg-primary text-white"
                  : "bg-violet-100 text-violet-700"
              }`}
            >
              {plan.badge}
            </div>
          )}

          <div className="text-sm font-semibold text-violet-700">{plan.nameTh}</div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground sm:text-4xl">
              ฿{plan.priceLabel}
            </span>
            <span className="text-sm text-muted">{plan.period}</span>
          </div>

          <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
            ต้องจ่ายทั้งหมด {plan.rounds} ครั้ง
          </div>

          <p className="mt-3 text-sm leading-6 text-muted">
            “{plan.tagline}”
          </p>

          <Link
            href={`/pay?id=${studentId}&plan=${plan.id}`}
            className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              plan.highlight
                ? "bg-primary text-white shadow-sm shadow-violet-200 hover:bg-violet-700"
                : "bg-violet-50 text-violet-700 hover:bg-violet-100"
            }`}
          >
            เลือกแพ็กเกจนี้
          </Link>
        </div>
      ))}
    </div>
  );
}
