"use client";

import { useState } from "react";
import { PartyPopper, AlertTriangle } from "lucide-react";
import { DEPARTMENTS, type Department } from "../data/departments";
import { EXHIBITION_ICONS } from "../data/exhibition-icons";

type Counts = Record<string, number>;

export default function ExhibitionPicker({
  studentId,
  initialCounts,
  initialChoice,
}: {
  studentId: string;
  initialCounts: Counts;
  initialChoice: string | null;
}) {
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [choice, setChoice] = useState<string | null>(initialChoice);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(dept: Department) {
    if (choice || submitting) return;
    setError(null);
    setSubmitting(dept.id);
    try {
      const res = await fetch("/api/exhibition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, departmentId: dept.id }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        departmentId?: string;
        current?: string;
        counts?: Counts;
        error?: string;
      };
      if (data.counts) setCounts(data.counts);
      if (data.ok && data.departmentId) {
        setChoice(data.departmentId);
      } else {
        if (data.current) setChoice(data.current);
        setError(data.error ?? "ไม่สามารถเลือกฝ่ายได้ ลองใหม่อีกครั้ง");
      }
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(null);
    }
  }

  // ฝ่ายที่เลือกได้ = ยังไม่เต็ม (ถ้ายังไม่ได้เลือก) หรือเป็นฝ่ายที่เราเลือกไว้
  const visible = DEPARTMENTS.filter((d) => {
    if (choice) return d.id === choice;
    return counts[d.id] < d.capacity;
  });

  if (choice) {
    const dept = DEPARTMENTS.find((d) => d.id === choice)!;
    const DeptIcon = EXHIBITION_ICONS[dept.icon];
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <DeptIcon className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          เลือกฝ่ายเรียบร้อยแล้ว
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-emerald-900">{dept.nameTh}</h2>
        <p className="mt-1 text-sm text-emerald-700">{dept.summary}</p>
        <p className="mt-4 text-xs text-emerald-600">
          คุณเลือกฝ่ายนี้แล้ว ไม่สามารถเปลี่ยนได้ — หากต้องการแก้ไขติดต่อผู้ดูแล
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <PartyPopper className="mx-auto h-8 w-8 text-amber-500" />
          <p className="mt-2 text-sm font-medium text-amber-800">
            ทุกฝ่ายเต็มแล้ว ขออภัยในความไม่สะดวก
          </p>
          <p className="mt-1 text-xs text-amber-600">กรุณาติดต่อผู้ดูแลเพื่อจัดสรรฝ่าย</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visible.map((dept) => {
            const left = Math.max(0, dept.capacity - counts[dept.id]);
            const isSubmitting = submitting === dept.id;
            const DeptIcon = EXHIBITION_ICONS[dept.icon];
            return (
              <div
                key={dept.id}
                className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm transition hover:border-violet-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                      <DeptIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-violet-900">{dept.nameTh}</h3>
                      <p className="mt-0.5 text-sm text-(--muted)">{dept.summary}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    เหลือ {left} ที่
                  </span>
                </div>

                <ul className="mt-3 space-y-1.5 border-t border-violet-100 pt-3">
                  {dept.duties.map((duty, i) => (
                    <li key={i} className="flex gap-2 text-sm text-foreground/80">
                      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                      <span>{duty}</span>
                    </li>
                  ))}
                </ul>

                {dept.note && (
                  <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {dept.note}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-(--muted)">
                    {counts[dept.id]}/{dept.capacity} คน
                  </span>
                  <button
                    type="button"
                    onClick={() => pick(dept)}
                    disabled={!!submitting}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "กำลังเลือก…" : "เลือกฝ่ายนี้"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
