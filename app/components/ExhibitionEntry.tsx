"use client";

import { useState } from "react";
import ExhibitionLoginForm from "./ExhibitionLoginForm";

export default function ExhibitionEntry() {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/60 p-5 fade-up">
        <div className="text-sm font-semibold text-violet-900">เลือกฝ่ายจัดนิทรรศการ</div>
        <p className="mt-0.5 text-xs text-(--muted)">ใส่เลขประจำตัวเพื่อเลือกฝ่ายที่ต้องการเข้าร่วม</p>
        <ExhibitionLoginForm onClose={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-5 py-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-400 hover:bg-violet-50"
    >
      🎪 เลือกฝ่ายจัดนิทรรศการ
    </button>
  );
}
