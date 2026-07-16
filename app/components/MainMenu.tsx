"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import {
  ArrowRight,
  LinkIcon,
  Wallet,
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

const PRIMARY_MENU: MenuItem[] = [
  {
    href: (id) => `/verify?id=${id}`,
    icon: Wallet,
    title: "จ่ายเงินห้อง / ค่าปรับ",
    desc: "ชำระเงินประจำปีและดูยอดคงเหลือ",
    tone: "violet",
  },
];

const TONES: Record<MenuItem["tone"], { box: string; icon: string }> = {
  rose: { box: "bg-rose-100", icon: "text-rose-600" },
  violet: { box: "bg-violet-100", icon: "text-violet-600" },
  fuchsia: { box: "bg-fuchsia-100", icon: "text-fuchsia-600" },
  amber: { box: "bg-amber-100", icon: "text-amber-600" },
  emerald: { box: "bg-emerald-100", icon: "text-emerald-600" },
};

const REMEMBER_STUDENT_KEY = "ds69.rememberedStudentId";
const REMEMBER_STUDENT_EVENT = "ds69:remembered-student";
const REMEMBER_STUDENT_COOKIE = "ds69_remembered_student_id";

function getRememberedStudentCookie() {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${REMEMBER_STUDENT_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

function setRememberedStudentCookie(studentId: string | null) {
  if (typeof document === "undefined") return;
  if (studentId) {
    document.cookie = `${REMEMBER_STUDENT_COOKIE}=${encodeURIComponent(
      studentId,
    )}; max-age=31536000; path=/; samesite=lax`;
  } else {
    document.cookie = `${REMEMBER_STUDENT_COOKIE}=; max-age=0; path=/; samesite=lax`;
  }
}

function getRememberedStudentId() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(REMEMBER_STUDENT_KEY) ?? getRememberedStudentCookie();
  } catch {
    return getRememberedStudentCookie();
  }
}

function subscribeRememberedStudent(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === REMEMBER_STUDENT_KEY) callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(REMEMBER_STUDENT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(REMEMBER_STUDENT_EVENT, callback);
  };
}

function setRememberedStudentId(studentId: string | null) {
  try {
    if (studentId) {
      window.localStorage.setItem(REMEMBER_STUDENT_KEY, studentId);
    } else {
      window.localStorage.removeItem(REMEMBER_STUDENT_KEY);
    }
  } catch {
    // Cookie fallback below keeps remember-me working when localStorage is unavailable.
  }
  setRememberedStudentCookie(studentId);
  window.dispatchEvent(new Event(REMEMBER_STUDENT_EVENT));
}

export default function MainMenu() {
  const router = useRouter();
  const rememberedStudentId = useSyncExternalStore(
    subscribeRememberedStudent,
    getRememberedStudentId,
    () => "",
  );
  const rememberedStudent = rememberedStudentId ? (findStudent(rememberedStudentId) ?? null) : null;
  const [studentId, setStudentId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [pending, startTransition] = useTransition();
  const student = selectedStudent ?? rememberedStudent;
  const loading = pending || navigating;

  useEffect(() => {
    if (!navigating) return;
    const timeout = window.setTimeout(() => setNavigating(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [navigating]);

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
    if (rememberMe) {
      setRememberedStudentId(found.studentId);
    }
    setSelectedStudent(found);
  }

  function go(href: string) {
    setNavigating(true);
    startTransition(() => {
      router.push(href);
    });
  }

  // ขั้นที่ 2: เลือกเมนู
  if (student) {
    return (
      <div className="card p-6 shadow-sm shadow-violet-100 fade-up">
        {loading && <RouteLoading />}

        <button
          type="button"
          onClick={() => {
            setRememberedStudentId(null);
            setSelectedStudent(null);
            setStudentId("");
            setRememberMe(false);
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
          <PortfolioMenuButton studentId={student.studentId} loading={loading} go={go} />
          {PRIMARY_MENU.map((item) => renderMenuButton(item, student.studentId, loading, go))}
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

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 rounded border-violet-300 text-violet-600 accent-violet-600"
        />
        จดจำฉัน
      </label>

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

function RouteLoading() {
  return (
    <>
      <div className="route-progress" aria-hidden="true">
        <div className="route-progress-bar" />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-violet-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-violet-700 shadow-lg shadow-violet-200/60 backdrop-blur"
      >
        กำลังเปิดหน้า...
      </div>
    </>
  );
}

function PortfolioMenuButton({
  studentId,
  loading,
  go,
}: {
  studentId: string;
  loading: boolean;
  go: (href: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => go(`/tcasfolio?id=${studentId}`)}
      className="group flex items-center gap-3 rounded-2xl border border-violet-200 bg-white p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
        <LinkIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-violet-600">Doodee Future</span>
        <span className="block text-sm font-semibold text-violet-900">
          อัปโหลดรูป Portfolio (tcasfolio)
        </span>
        <span className="block text-xs text-muted">อัปโหลดรูปที่สมัคร TcasFolio</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-violet-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
    </button>
  );
}

function renderMenuButton(
  item: MenuItem,
  studentId: string,
  loading: boolean,
  go: (href: string) => void,
  secondary = false,
) {
  const Icon = item.icon;
  const tone = TONES[item.tone];

  return (
    <button
      key={item.title}
      type="button"
      disabled={loading}
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
