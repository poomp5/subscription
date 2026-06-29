"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import {
  CircleDashed,
  FileSpreadsheet,
  FileText,
  FileType,
  Pencil,
} from "lucide-react";
import { FOOD_CHOICES, findFoodChoice, type FoodChoiceId } from "../data/food";

export type FoodRow = {
  studentId: string;
  studentNo: number;
  nicknameTh: string;
  fullNameTh: string;
  foodId: FoodChoiceId | null;
  comment: string;
};

export default function FoodManager({ rows }: { rows: FoodRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function clear(studentId: string, nicknameTh: string) {
    if (!confirm(`ล้างผลเลือกอาหารของ ${nicknameTh}? นักเรียนจะต้องเลือกใหม่`)) return;
    setBusy(studentId);
    try {
      const res = await fetch("/api/admin/food", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear", studentId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "ทำรายการไม่สำเร็จ");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  const filled = rows.filter((r) => r.foodId !== null);
  const perFood = FOOD_CHOICES.map((food) => ({
    ...food,
    count: filled.filter((r) => r.foodId === food.id).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-default bg-white px-4 py-3">
        <div className="text-sm text-muted">ดาวน์โหลดผลเลือกอาหารทั้งหมด ({rows.length} คน)</div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/food/export?format=csv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <FileText className="h-3.5 w-3.5" />
            CSV
          </a>
          <a
            href="/api/admin/food/export?format=xlsx"
            className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </a>
          <a
            href="/api/admin/food/export?format=pdf"
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <FileType className="h-3.5 w-3.5" />
            PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="เลือกแล้ว" value={`${filled.length}/${rows.length}`} />
        {perFood.map((food) => (
          <div
            key={food.id}
            className="flex items-center gap-2 rounded-2xl border border-border-default bg-white px-3 py-2.5"
          >
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-violet-50">
              <Image src={food.image} alt={food.nameTh} fill sizes="40px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[11px] text-muted">{food.nameTh}</div>
              <div className="text-lg font-semibold text-foreground">{food.count}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
        <div className="hidden grid-cols-[1fr_minmax(0,2fr)_120px] gap-3 border-b border-border-default bg-surface-muted px-4 py-3 text-xs uppercase tracking-wider text-muted lg:grid">
          <div>นักเรียน</div>
          <div>อาหารที่เลือก</div>
          <div className="text-right">การจัดการ</div>
        </div>

        <ul className="divide-y divide-border-default">
          {rows.map((r) => {
            const food = r.foodId ? findFoodChoice(r.foodId) : undefined;
            return (
              <li
                key={r.studentId}
                className="grid grid-cols-1 gap-2 px-4 py-3 transition hover:bg-surface-muted lg:grid-cols-[1fr_minmax(0,2fr)_120px] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{r.nicknameTh}</div>
                  <div className="truncate text-xs text-muted">
                    #{r.studentNo} · <span className="font-mono">{r.studentId}</span> ·{" "}
                    {r.fullNameTh}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {!food ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-muted px-2.5 py-0.5 text-xs text-muted">
                      <CircleDashed className="h-3.5 w-3.5" />
                      ยังไม่ได้เลือก
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 py-0.5 pl-1 pr-2.5 text-xs font-medium text-violet-700">
                        <span className="relative h-5 w-5 overflow-hidden rounded-full bg-white">
                          <Image src={food.image} alt="" fill sizes="20px" className="object-cover" />
                        </span>
                        {food.nameTh}
                      </span>
                      {r.comment && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <Pencil className="h-3.5 w-3.5" />
                          {r.comment}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-start lg:justify-end">
                  {food && (
                    <button
                      onClick={() => clear(r.studentId, r.nicknameTh)}
                      disabled={!!busy}
                      className="rounded-lg px-2 py-1 text-xs text-muted transition hover:text-rose-600 disabled:opacity-50"
                      title="ล้างข้อมูล"
                    >
                      {busy === r.studentId ? "…" : "ล้างข้อมูล"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-violet-700">{value}</div>
    </div>
  );
}
