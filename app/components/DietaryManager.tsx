"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Fish,
  Moon,
  Beef,
  Flame,
  CircleCheck,
  CircleDashed,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import { DIETARY_OPTIONS, type DietaryId } from "../data/dietary";

export type DietaryRow = {
  studentId: string;
  studentNo: number;
  nicknameTh: string;
  fullNameTh: string;
  /** null = ยังไม่ได้กรอกข้อมูล */
  restrictions: DietaryId[] | null;
  otherNote: string;
};

const ICONS: Record<string, LucideIcon> = { Fish, Moon, Beef, Flame };

export default function DietaryManager({ rows }: { rows: DietaryRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function clear(studentId: string, nicknameTh: string) {
    if (!confirm(`ล้างข้อมูลด้านอาหารของ ${nicknameTh}? นักเรียนจะต้องกรอกใหม่`)) return;
    setBusy(studentId);
    try {
      const res = await fetch("/api/admin/dietary", {
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

  const filled = rows.filter((r) => r.restrictions !== null);
  const withRestriction = filled.filter((r) => (r.restrictions?.length ?? 0) > 0).length;

  // สรุปจำนวนต่อข้อจำกัด
  const perOption = DIETARY_OPTIONS.map((opt) => ({
    ...opt,
    count: filled.filter((r) => r.restrictions?.includes(opt.id)).length,
  }));

  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="กรอกแล้ว" value={`${filled.length}/${rows.length}`} />
        <SummaryCard label="มีข้อจำกัด" value={withRestriction} />
        {perOption.map((o) => {
          const Icon = ICONS[o.icon];
          return (
            <div
              key={o.id}
              className="flex items-center gap-2 rounded-2xl border border-border-default bg-white px-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[11px] text-muted">{o.nameTh}</div>
                <div className="text-lg font-semibold text-foreground">{o.count}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
        <div className="hidden grid-cols-[1fr_minmax(0,2fr)_120px] gap-3 border-b border-border-default bg-surface-muted px-4 py-3 text-xs uppercase tracking-wider text-muted lg:grid">
          <div>นักเรียน</div>
          <div>ข้อจำกัดด้านอาหาร</div>
          <div className="text-right">การจัดการ</div>
        </div>

        <ul className="divide-y divide-border-default">
          {rows.map((r) => {
            const notFilled = r.restrictions === null;
            const none =
              !notFilled && (r.restrictions?.length ?? 0) === 0 && !r.otherNote;
            return (
              <li
                key={r.studentId}
                className="grid grid-cols-1 gap-2 px-4 py-3 transition hover:bg-surface-muted lg:grid-cols-[1fr_minmax(0,2fr)_120px] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.nicknameTh}
                  </div>
                  <div className="truncate text-xs text-muted">
                    #{r.studentNo} · <span className="font-mono">{r.studentId}</span> ·{" "}
                    {r.fullNameTh}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {notFilled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-muted px-2.5 py-0.5 text-xs text-muted">
                      <CircleDashed className="h-3.5 w-3.5" />
                      ยังไม่ได้กรอก
                    </span>
                  ) : none ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <CircleCheck className="h-3.5 w-3.5" />
                      ไม่แพ้อะไร
                    </span>
                  ) : (
                    <>
                      {r.restrictions!.map((id) => {
                        const opt = DIETARY_OPTIONS.find((o) => o.id === id);
                        if (!opt) return null;
                        const Icon = ICONS[opt.icon];
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {opt.nameTh}
                          </span>
                        );
                      })}
                      {r.otherNote && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <Pencil className="h-3.5 w-3.5" />
                          {r.otherNote}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-start lg:justify-end">
                  {!notFilled && (
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
