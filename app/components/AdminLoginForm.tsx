"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error || "เข้าสู่ระบบไม่สำเร็จ");
        setSubmitting(false);
        return;
      }
      startTransition(() => {
        router.replace("/admin");
        router.refresh();
      });
    } catch {
      setError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card p-6 shadow-sm shadow-violet-100"
    >
      <label htmlFor="password" className="block text-sm font-medium text-foreground">
        รหัสผ่านแอดมิน
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(null);
        }}
        className="mt-2 block w-full rounded-xl border border-(--border) bg-white px-4 py-3 text-base tracking-wider text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-violet-200"
      />

      {error && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || pending || password.length === 0}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting || pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
