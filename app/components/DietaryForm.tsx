"use client";

import { useState } from "react";
import { Fish, Moon, Beef, Flame, Check, CircleCheck, Pencil, type LucideIcon } from "lucide-react";
import { DIETARY_OPTIONS, type DietaryId } from "../data/dietary";

const ICONS: Record<DietaryOption["icon"], LucideIcon> = {
  Fish,
  Moon,
  Beef,
  Flame,
};

type DietaryOption = (typeof DIETARY_OPTIONS)[number];

export default function DietaryForm({
  studentId,
  initialRestrictions,
  initialOtherNote,
  initialSaved,
}: {
  studentId: string;
  initialRestrictions: DietaryId[];
  initialOtherNote: string;
  initialSaved: boolean;
}) {
  const [selected, setSelected] = useState<Set<DietaryId>>(
    () => new Set(initialRestrictions),
  );
  const [otherNote, setOtherNote] = useState(initialOtherNote);
  const [saved, setSaved] = useState(initialSaved);
  const [savedRestrictions, setSavedRestrictions] = useState<DietaryId[]>(initialRestrictions);
  const [savedOtherNote, setSavedOtherNote] = useState(initialOtherNote);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "ไม่แพ้อะไร" = ติ๊กแล้วล้างตัวเลือกทั้งหมด
  const noneSelected = selected.size === 0;

  function toggle(id: DietaryId) {
    setError(null);
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pickNone() {
    setError(null);
    setSaved(false);
    setSelected(new Set());
  }

  async function save() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const restrictions = [...selected];
    const note = otherNote.trim();
    try {
      const res = await fetch("/api/dietary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, restrictions, otherNote: note }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setSaved(true);
        setSavedRestrictions(restrictions);
        setSavedOtherNote(note);
      } else {
        setError(data.error ?? "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  const dirty =
    selected.size !== savedRestrictions.length ||
    savedRestrictions.some((id) => !selected.has(id)) ||
    otherNote.trim() !== savedOtherNote.trim();

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {saved && !dirty && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          <CircleCheck className="h-4 w-4 shrink-0" />
          <span>บันทึกข้อมูลด้านอาหารเรียบร้อยแล้ว</span>
        </div>
      )}

      <div className="grid gap-3">
        {DIETARY_OPTIONS.map((opt) => {
          const Icon = ICONS[opt.icon];
          const active = selected.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-violet-400 bg-violet-50 shadow-sm"
                  : "border-violet-200 bg-white hover:border-violet-300"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  active ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-violet-900">
                  {opt.nameTh}
                </span>
                <span className="block text-xs text-muted">{opt.summary}</span>
              </span>
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                  active
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-violet-300 bg-white text-transparent"
                }`}
              >
                <Check className="h-4 w-4" />
              </span>
            </button>
          );
        })}
      </div>

      {/* ไม่แพ้อะไร */}
      <button
        type="button"
        onClick={pickNone}
        aria-pressed={noneSelected}
        className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
          noneSelected
            ? "border-emerald-400 bg-emerald-50 shadow-sm"
            : "border-violet-200 bg-white hover:border-violet-300"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            noneSelected ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-600"
          }`}
        >
          <CircleCheck className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-emerald-900">
            ไม่แพ้อะไร / ไม่มีข้อจำกัด
          </span>
          <span className="block text-xs text-muted">ทานได้ทุกอย่าง ไม่มีข้อจำกัดด้านอาหาร</span>
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
            noneSelected
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-violet-300 bg-white text-transparent"
          }`}
        >
          <Check className="h-4 w-4" />
        </span>
      </button>

      {/* อื่นๆ — พิมพ์เพิ่มเองได้ */}
      <div className="rounded-2xl border border-violet-200 bg-white p-4">
        <label
          htmlFor="dietOther"
          className="flex items-center gap-2 text-sm font-semibold text-violet-900"
        >
          <Pencil className="h-4 w-4 text-violet-600" />
          อื่นๆ (ถ้ามี)
        </label>
        <p className="mt-0.5 text-xs text-muted">
          แพ้อาหารอื่น ๆ หรือมีข้อจำกัดเพิ่มเติม พิมพ์บอกได้เลย
        </p>
        <textarea
          id="dietOther"
          value={otherNote}
          maxLength={300}
          rows={2}
          placeholder="เช่น แพ้ถั่ว, แพ้นม, ไม่ทานผักชี…"
          onChange={(e) => {
            setOtherNote(e.target.value);
            setError(null);
            setSaved(false);
          }}
          className="mt-2 block w-full resize-none rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        />
        <div className="mt-1 text-right text-[11px] text-muted">{otherNote.length}/300</div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={submitting || (saved && !dirty)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "กำลังบันทึก…" : saved && !dirty ? "บันทึกแล้ว" : "บันทึกข้อมูล"}
      </button>
    </div>
  );
}
