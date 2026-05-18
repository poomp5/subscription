"use client";

import { useState, useTransition } from "react";

export type StudentPenaltyRow = {
  no: number;
  studentId: string;
  nicknameTh: string;
  fullNameTh: string;
  paidTotal: number;
  remaining: number;
  penaltyCount: number;
  penaltyAmount: number;
  reasons: string[];
};

const TOTAL_TARGET = 600;

const REASON_OPTIONS = ["ไม่ทำเวร", "ทำผิดกฎในห้อง", "อื่นๆ"] as const;

function totalPenalty(count: number) {
  if (count <= 0) return 0;
  return count * 20 + (5 * count * (count - 1)) / 2;
}

export default function PenaltyManager({ rows }: { rows: StudentPenaltyRow[] }) {
  return (
    <div className="mt-5 space-y-3">
      {rows.map((r) => (
        <PenaltyRow key={r.studentId} initial={r} />
      ))}
    </div>
  );
}

function PenaltyRow({ initial }: { initial: StudentPenaltyRow }) {
  const [count, setCount] = useState(initial.penaltyCount);
  // reasons[i] = เหตุผลของครั้งที่ i+1
  const [reasons, setReasons] = useState<string[]>(() => {
    const base = [...(initial.reasons ?? [])];
    while (base.length < initial.penaltyCount) base.push("ไม่ทำเวร");
    return base;
  });
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const amount = totalPenalty(count);
  const changed = count !== initial.penaltyCount || JSON.stringify(reasons.slice(0, count)) !== JSON.stringify((initial.reasons ?? []).slice(0, count));
  const paidPct = Math.min(100, (initial.paidTotal / TOTAL_TARGET) * 100);

  function adjust(delta: number) {
    const next = Math.max(0, count + delta);
    setCount(next);
    setSaved(false);
    if (delta > 0) {
      setReasons((r) => [...r, "ไม่ทำเวร"]);
    } else {
      setReasons((r) => r.slice(0, -1));
    }
  }

  function setReason(idx: number, val: string) {
    setReasons((r) => r.map((v, i) => (i === idx ? val : v)));
    setSaved(false);
  }

  function setCustom(idx: number, val: string) {
    setReasons((r) => r.map((v, i) => (i === idx ? val : v)));
    setSaved(false);
  }

  function save() {
    startSaving(async () => {
      await fetch("/api/penalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: initial.studentId,
          count,
          reasons: reasons.slice(0, count),
        }),
      });
      setSaved(true);
    });
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 sm:p-5">
      {/* top row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{initial.nicknameTh}</span>
            <span className="text-xs text-muted">#{initial.no}</span>
          </div>
          <div className="text-xs text-muted">{initial.fullNameTh}</div>

          {/* progress bar ยอดห้อง */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-violet-100 sm:w-48">
              <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${paidPct}%` }} />
            </div>
            <span className={`text-xs font-medium ${initial.paidTotal >= TOTAL_TARGET ? "text-emerald-600" : "text-foreground"}`}>
              ฿{initial.paidTotal.toLocaleString("th-TH")} / ฿{TOTAL_TARGET}
            </span>
            {initial.remaining > 0 && (
              <span className="text-xs text-amber-600">(ค้าง ฿{initial.remaining})</span>
            )}
          </div>
        </div>

        {/* ปรับค่าปรับ */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjust(-1)}
            disabled={count === 0 || saving}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-lg font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-30"
          >
            −
          </button>
          <div className="min-w-20 text-center">
            <div className="text-sm font-semibold text-foreground">{count} ครั้ง</div>
            {amount > 0 ? (
              <div className="text-[11px] font-medium text-rose-600">฿{amount}</div>
            ) : (
              <div className="text-[11px] text-emerald-600">ไม่มีค้าง</div>
            )}
          </div>
          <button
            onClick={() => adjust(1)}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-lg font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-30"
          >
            +
          </button>

          <button
            onClick={save}
            disabled={saving || !changed}
            className="ml-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            {saving ? "…" : saved && !changed ? "✓" : "บันทึก"}
          </button>
        </div>
      </div>

      {/* เหตุผลแต่ละรอบ */}
      {count > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted">เหตุผลแต่ละครั้ง</div>
          {Array.from({ length: count }, (_, i) => {
            const val = reasons[i] ?? "ไม่ทำเวร";
            const isCustom = !REASON_OPTIONS.slice(0, -1).includes(val as typeof REASON_OPTIONS[number]) || val === "อื่นๆ";
            const selectVal = isCustom ? "อื่นๆ" : val;

            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[11px] text-muted">ครั้งที่ {i + 1}</span>
                <select
                  value={selectVal}
                  onChange={(e) => {
                    if (e.target.value !== "อื่นๆ") setReason(i, e.target.value);
                    else setReason(i, "อื่นๆ");
                  }}
                  className="rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-foreground outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                >
                  {REASON_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {selectVal === "อื่นๆ" && (
                  <input
                    type="text"
                    value={val === "อื่นๆ" ? "" : val}
                    onChange={(e) => setCustom(i, e.target.value || "อื่นๆ")}
                    placeholder="ระบุเหตุผล…"
                    className="flex-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-sm text-foreground placeholder:text-violet-300 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
