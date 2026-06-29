"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, CircleCheck, Home, Pencil, UtensilsCrossed } from "lucide-react";
import { FOOD_CHOICES, findFoodChoice, type FoodChoiceId } from "../data/food";

export default function FoodForm({
  studentId,
  initialFoodId,
  initialComment,
}: {
  studentId: string;
  initialFoodId: FoodChoiceId | null;
  initialComment: string;
}) {
  const [selected, setSelected] = useState<FoodChoiceId | null>(initialFoodId);
  const [comment, setComment] = useState(initialComment);
  const [savedFoodId, setSavedFoodId] = useState<FoodChoiceId | null>(initialFoodId);
  const [savedComment, setSavedComment] = useState(initialComment);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function save() {
    if (submitting) return;
    setError(null);
    if (!selected) {
      setError("กรุณาเลือกอาหาร 1 อย่าง");
      return;
    }

    setSubmitting(true);
    const note = comment.trim();
    try {
      const res = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, foodId: selected, comment: note }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        foodId?: FoodChoiceId;
        comment?: string;
        error?: string;
      };
      if (data.ok && data.foodId) {
        setSavedFoodId(data.foodId);
        setSavedComment(data.comment ?? "");
        setShowSuccess(true);
      } else {
        setError(data.error ?? "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      }
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  if (showSuccess) {
    const savedFood = savedFoodId ? findFoodChoice(savedFoodId) : undefined;

    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CircleCheck className="h-9 w-9 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-emerald-900">บันทึกสำเร็จ</h2>
        <p className="mt-1 text-sm text-emerald-700">บันทึกผลเลือกอาหารเรียบร้อยแล้ว</p>

        {savedFood && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4 text-left">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-emerald-50">
                <Image
                  src={savedFood.image}
                  alt={savedFood.nameTh}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-900">{savedFood.nameTh}</div>
                {savedComment && (
                  <div className="mt-1 text-xs text-emerald-700">
                    คอมเมนต์: {savedComment}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <Pencil className="h-4 w-4" />
            แก้ไขข้อมูล
          </button>
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700"
          >
            <Home className="h-4 w-4" />
            กลับหน้าแรก
          </Link>
        </div>
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

      <div className="grid gap-3">
        {FOOD_CHOICES.map((food) => {
          const active = selected === food.id;
          return (
            <button
              key={food.id}
              type="button"
              onClick={() => {
                setSelected(food.id);
                setError(null);
              }}
              aria-pressed={active}
              className={`grid grid-cols-[88px_1fr_auto] items-center gap-3 rounded-2xl border p-3 text-left transition sm:grid-cols-[112px_1fr_auto] ${
                active
                  ? "border-violet-400 bg-violet-50 shadow-sm"
                  : "border-violet-200 bg-white hover:border-violet-300"
              }`}
            >
              <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-violet-50">
                <Image
                  src={food.image}
                  alt={food.nameTh}
                  fill
                  sizes="(max-width: 640px) 88px, 112px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-violet-900">
                  <UtensilsCrossed className="h-4 w-4 shrink-0 text-violet-600" />
                  <span>{food.nameTh}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">{food.summary}</span>
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

      <div className="rounded-2xl border border-violet-200 bg-white p-4">
        <label
          htmlFor="foodComment"
          className="flex items-center gap-2 text-sm font-semibold text-violet-900"
        >
          <Pencil className="h-4 w-4 text-violet-600" />
          คอมเมนต์เพิ่มเติม (ถ้ามี)
        </label>
        <p className="mt-0.5 text-xs text-muted">หมายเหตุต่าง ๆ </p>
        <textarea
          id="foodComment"
          value={comment}
          maxLength={300}
          rows={2}
          placeholder="พิมพ์คอมเมนต์เพิ่มเติม..."
          onChange={(e) => {
            setComment(e.target.value);
            setError(null);
          }}
          className="mt-2 block w-full resize-none rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        />
        <div className="mt-1 text-right text-[11px] text-muted">{comment.length}/300</div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "กำลังบันทึก…" : "บันทึกผลเลือกอาหาร"}
      </button>
    </div>
  );
}
