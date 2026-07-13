"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleCheck, ExternalLink, Home, LinkIcon, Pencil } from "lucide-react";
import { useState } from "react";

const EXTERNAL_LINKS = {
  connect: "https://doodee-future.com/th/profile",
  demo: "https://tcasfolio-demo.mytcas.com/",
  real: "https://folio.mytcas.com/",
};

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function TcasfolioForm({
  studentId,
  initialPortfolioUrl,
}: {
  studentId: string;
  initialPortfolioUrl: string;
}) {
  const [portfolioUrl, setPortfolioUrl] = useState(initialPortfolioUrl);
  const [savedPortfolioUrl, setSavedPortfolioUrl] = useState(initialPortfolioUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function save() {
    if (submitting) return;
    setError(null);

    const url = portfolioUrl.trim();
    if (!url) {
      setError("กรุณาใส่ลิงก์ Portfolio");
      return;
    }
    if (!isValidUrl(url)) {
      setError("กรุณาใส่ลิงก์ให้ถูกต้อง เช่น https://folio.mytcas.com/...");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tcasfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, portfolioUrl: url }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        portfolioUrl?: string;
        error?: string;
      };
      if (data.ok && data.portfolioUrl) {
        setSavedPortfolioUrl(data.portfolioUrl);
        setPortfolioUrl(data.portfolioUrl);
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
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CircleCheck className="h-9 w-9 text-emerald-600" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-emerald-900">บันทึกสำเร็จ</h2>
        <p className="mt-1 text-sm text-emerald-700">บันทึกลิงก์ Portfolio เรียบร้อยแล้ว</p>

        <a
          href={savedPortfolioUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-left text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
        >
          <LinkIcon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 break-all">{savedPortfolioUrl}</span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <Pencil className="h-4 w-4" />
            แก้ไขลิงก์
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
      <div className="rounded-2xl border border-violet-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <LinkIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-medium text-violet-600">Doodee Future</div>
            <div className="text-sm font-semibold text-violet-900">
              อัปโหลดลิงก์ Portfolio (tcasfolio)
            </div>
            <div className="text-xs text-muted">เชื่อมต่อ Portfolio และเปิดใช้งาน tcasfolio</div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <ExternalAction href={EXTERNAL_LINKS.connect} label="เชื่อมด้วย Doodee Future" primary withLogo />
          <ExternalAction href={EXTERNAL_LINKS.demo} label="Tcasfolio (Demo)" />
          {/* <ExternalAction href={EXTERNAL_LINKS.real} label="Tcasfolio (ยังไม่เปิดระบบ)" disabled /> */}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-violet-200 bg-white p-4">
        <label
          htmlFor="portfolioUrl"
          className="flex items-center gap-2 text-sm font-semibold text-violet-900"
        >
          <LinkIcon className="h-4 w-4 text-violet-600" />
          ลิงก์ Portfolio
        </label>
        <input
          id="portfolioUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          value={portfolioUrl}
          maxLength={500}
          placeholder="https://drive.google.com/..."
          onChange={(e) => {
            setPortfolioUrl(e.target.value);
            setError(null);
          }}
          className="mt-2 block w-full rounded-xl border border-violet-200 bg-white px-3 py-3 text-sm text-foreground outline-none transition placeholder:text-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        />
        <div className="mt-1 text-right text-[11px] text-muted">{portfolioUrl.length}/500</div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "กำลังบันทึก…" : "บันทึกลิงก์ Portfolio"}
      </button>
    </div>
  );
}

function ExternalAction({
  href,
  label,
  primary = false,
  disabled = false,
  withLogo = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  withLogo?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-400">
        <span>{label}</span>
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-xs font-semibold transition ${
        primary
          ? "border-pink-500 bg-[#de5c8e] text-white shadow-sm shadow-pink-200 hover:bg-[#de5c8e]/85"
          : "border-violet-200 bg-white text-violet-700 hover:border-violet-300 hover:bg-violet-50"
      }`}
    >
      {withLogo && (
        <Image
          src="/doodee-future-logo.png"
          alt=""
          width={64}
          height={64}
          className="h-[32px] w-[32px] bg-white rounded-full p-1 object-contain"
        />
      )}
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}
