"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Wallet,
  Tent,
  UtensilsCrossed,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { findStudent, type Student } from "../data/students";

type MenuItem = {
  href: (id: string) => string;
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: "violet" | "fuchsia" | "amber";
};

const MENU: MenuItem[] = [
  {
    href: (id) => `/verify?id=${id}`,
    icon: Wallet,
    title: "จ่ายเงินห้อง / ค่าปรับ",
    desc: "ชำระเงินประจำปีและดูยอดคงเหลือ",
    tone: "violet",
  },
  {
    href: (id) => `/exhibition?id=${id}`,
    icon: Tent,
    title: "เลือกฝ่ายจัดนิทรรศการ",
    desc: "เลือกฝ่ายที่ต้องการเข้าร่วม",
    tone: "fuchsia",
  },
  {
    href: (id) => `/dietary?id=${id}`,
    icon: UtensilsCrossed,
    title: "เช็คข้อมูลแพ้อาหาร",
    desc: "แจ้งอาการแพ้และข้อจำกัดด้านอาหาร",
    tone: "amber",
  },
];

const TONES: Record<MenuItem["tone"], { box: string; icon: string }> = {
  violet: { box: "bg-violet-100", icon: "text-violet-600" },
  fuchsia: { box: "bg-fuchsia-100", icon: "text-fuchsia-600" },
  amber: { box: "bg-amber-100", icon: "text-amber-600" },
};

export default function MainMenu() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
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
    const found = findStudent(id);
    if (!found) {
      setError("ไม่พบเลขประจำตัวนี้ในระบบ ลองตรวจสอบอีกครั้ง");
      return;
    }
    setStudent(found);
  }

  function go(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  // ขั้นที่ 2: เลือกเมนู
  if (student) {
    return (
      <div className="card p-6 shadow-sm shadow-violet-100 fade-up">
        <button
          type="button"
          onClick={() => {
            setStudent(null);
            setError(null);
          }}
          className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          เปลี่ยนเลขประจำตัว
        </button>

        <div className="mt-3">
          <div className="text-xs text-muted">สวัสดี</div>
          <div className="text-lg font-semibold text-violet-900">
            {student.nicknameTh}{" "}
            <span className="font-mono text-sm font-normal text-muted">
              · {student.studentId}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">เลือกเมนูที่ต้องการ</p>
        </div>

        <div className="mt-4 grid gap-3">
          {MENU.map((item) => {
            const Icon = item.icon;
            const tone = TONES[item.tone];
            return (
              <button
                key={item.title}
                type="button"
                disabled={pending}
                onClick={() => go(item.href(student.studentId))}
                className="group flex items-center gap-3 rounded-2xl border border-violet-200 bg-white p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.box}`}
                >
                  <Icon className={`h-5 w-5 ${tone.icon}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-violet-900">
                    {item.title}
                  </span>
                  <span className="block text-xs text-muted">{item.desc}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-violet-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ขั้นที่ 1: กรอกเลขประจำตัว
  return (
    <form onSubmit={onSubmit} className="card relative p-6 shadow-sm shadow-violet-100">
      <label htmlFor="studentId" className="block text-sm font-medium text-foreground">
        เลขประจำตัวนักเรียน
      </label>
      <input
        id="studentId"
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

      <button
        type="submit"
        disabled={studentId.length === 0}
        className="mt-5 group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ดำเนินการต่อ
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
