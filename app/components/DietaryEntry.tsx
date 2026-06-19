"use client";

import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import DietaryLoginForm from "./DietaryLoginForm";

export default function DietaryEntry() {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/60 p-5 fade-up">
        <div className="text-sm font-semibold text-violet-900">เช็คข้อมูลด้านอาหาร</div>
        <p className="mt-0.5 text-xs text-(--muted)">
          ใส่เลขประจำตัวเพื่อแจ้งว่าแพ้อาหารอะไรหรือมีข้อจำกัดอะไรบ้าง
        </p>
        <DietaryLoginForm onClose={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-5 py-3 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-400 hover:bg-violet-50"
    >
      <UtensilsCrossed className="h-4 w-4" />
      เช็คข้อมูลแพ้อาหาร
    </button>
  );
}
