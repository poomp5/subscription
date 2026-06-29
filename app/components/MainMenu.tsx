"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  Gift,
  Wallet,
  Tent,
  UtensilsCrossed,
  Soup,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { findStudent, type Student } from "../data/students";

type MenuItem = {
  href: (id: string) => string;
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: "rose" | "violet" | "fuchsia" | "amber" | "emerald";
  alert?: string;
};

const WAI_KRU_MENU: MenuItem = {
  href: (id) => `/wai-kru?id=${id}`,
  icon: Gift,
  title: "จ่ายเงินค่าพานไหว้ครู",
  desc: "สแกน QR PromptPay ยอด 15 บาท",
  tone: "rose",
};

const PRIMARY_MENU: MenuItem[] = [
  {
    href: (id) => `/verify?id=${id}`,
    icon: Wallet,
    title: "จ่ายเงินห้อง / ค่าปรับ",
    desc: "ชำระเงินประจำปีและดูยอดคงเหลือ",
    tone: "violet",
  },
  {
    href: (id) => `/food?id=${id}`,
    icon: Soup,
    title: "เลือกอาหาร",
    desc: "โหวตเมนูข้าวหน้าไก่และเพิ่มคอมเมนต์",
    tone: "emerald",
  },
];

const SECONDARY_MENU: MenuItem[] = [
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
  rose: { box: "bg-rose-100", icon: "text-rose-600" },
  violet: { box: "bg-violet-100", icon: "text-violet-600" },
  fuchsia: { box: "bg-fuchsia-100", icon: "text-fuchsia-600" },
  amber: { box: "bg-amber-100", icon: "text-amber-600" },
  emerald: { box: "bg-emerald-100", icon: "text-emerald-600" },
};

export default function MainMenu() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [waiKruPaid, setWaiKruPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!student) return;

    let cancelled = false;
    fetch(`/api/wai-kru-status?id=${encodeURIComponent(student.studentId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { paid?: boolean } | null) => {
        if (!cancelled) setWaiKruPaid(!!data?.paid);
      })
      .catch(() => {
        if (!cancelled) setWaiKruPaid(false);
      });

    return () => {
      cancelled = true;
    };
  }, [student]);

  const menu = useMemo(
    () => (waiKruPaid ? PRIMARY_MENU : [{ ...WAI_KRU_MENU, alert: "ยังไม่จ่าย" }, ...PRIMARY_MENU]),
    [waiKruPaid],
  );

  const secondaryMenu = useMemo(
    () => (waiKruPaid ? [WAI_KRU_MENU, ...SECONDARY_MENU] : SECONDARY_MENU),
    [waiKruPaid],
  );

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
    setWaiKruPaid(false);
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
            setWaiKruPaid(false);
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
          {menu.map((item) => renderMenuButton(item, student.studentId, pending, go))}
        </div>

        <div className="mt-5 border-t border-violet-100 pt-4">
          <div className="grid gap-2">
            {secondaryMenu.map((item) =>
              renderMenuButton(item, student.studentId, pending, go, true),
            )}
          </div>
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

function renderMenuButton(
  item: MenuItem,
  studentId: string,
  pending: boolean,
  go: (href: string) => void,
  secondary = false,
) {
  const Icon = item.icon;
  const tone = TONES[item.tone];

  return (
    <button
      key={item.title}
      type="button"
      disabled={pending}
      onClick={() => go(item.href(studentId))}
      className={`group flex items-center gap-3 rounded-2xl border bg-white text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        secondary
          ? "border-slate-200/80 p-3.5 opacity-65 hover:border-violet-300 hover:bg-violet-50/50 hover:opacity-100"
          : "border-violet-200 p-4 hover:border-violet-300 hover:bg-violet-50/50"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl transition ${
          secondary
            ? "h-10 w-10 bg-slate-100 text-slate-400 group-hover:bg-violet-100"
            : `h-11 w-11 ${tone.box}`
        }`}
      >
        <Icon
          className={`transition ${
            secondary ? "h-4 w-4 group-hover:text-violet-600" : `h-5 w-5 ${tone.icon}`
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`flex items-center gap-2 text-sm font-semibold transition ${
            secondary ? "text-slate-500 group-hover:text-violet-900" : "text-violet-900"
          }`}
        >
          <span className="min-w-0 truncate">{item.title}</span>
          {item.alert && (
            <span className="shrink-0 animate-pulse rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-rose-200">
              {item.alert}
            </span>
          )}
        </span>
        <span className="block text-xs text-muted">{item.desc}</span>
      </span>
      <ArrowRight
        className={`h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${
          secondary ? "text-slate-300 group-hover:text-violet-600" : "text-violet-400 group-hover:text-violet-600"
        }`}
      />
    </button>
  );
}
