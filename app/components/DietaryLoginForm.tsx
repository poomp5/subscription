"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { findStudent } from "../data/students";

export default function DietaryLoginForm({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = studentId.trim();
    if (!/^\d+$/.test(id)) {
      setError("กรุณาใส่เลขประจำตัวเป็นตัวเลขเท่านั้น");
      return;
    }
    const student = findStudent(id);
    if (!student) {
      setError("ไม่พบเลขประจำตัวนี้ในระบบ ลองตรวจสอบอีกครั้ง");
      return;
    }
    startTransition(() => {
      router.push(`/dietary?id=${student.studentId}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 text-left">
      <label htmlFor="dietStudentId" className="block text-sm font-medium text-foreground">
        เลขประจำตัวนักเรียน
      </label>
      <input
        id="dietStudentId"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        placeholder="เช่น 27200"
        value={studentId}
        onChange={(e) => {
          setStudentId(e.target.value.replace(/\D/g, ""));
          setError(null);
        }}
        className="mt-2 block w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-lg tracking-wider text-foreground outline-none transition placeholder:text-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
      />

      {error && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-violet-200 px-4 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
          >
            ยกเลิก
          </button>
        )}
        <button
          type="submit"
          disabled={pending || studentId.length === 0}
          className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "กำลังตรวจสอบ…" : "กรอกข้อมูลด้านอาหาร"}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  );
}
