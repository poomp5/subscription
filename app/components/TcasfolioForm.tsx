"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleCheck, ExternalLink, Home, ImageIcon, LinkIcon, Pencil, Upload } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

const EXTERNAL_LINKS = {
  connect: "https://doodee-future.com/th/profile",
  demo: "https://tcasfolio-demo.mytcas.com/",
  real: "https://folio.mytcas.com/",
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const PORTFOLIO_CACHE_PREFIX = "ds69.tcasfolioPortfolioUrl.";
const PORTFOLIO_CACHE_EVENT = "ds69:tcasfolio-portfolio-url";

function getCachedPortfolioUrl(studentId: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(`${PORTFOLIO_CACHE_PREFIX}${studentId}`) ?? "";
  } catch {
    return "";
  }
}

function setCachedPortfolioUrl(studentId: string, url: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${PORTFOLIO_CACHE_PREFIX}${studentId}`, url);
  } catch {
    // DB/R2 remain the source of truth when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(PORTFOLIO_CACHE_EVENT));
}

function subscribePortfolioCache(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(PORTFOLIO_CACHE_PREFIX)) callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(PORTFOLIO_CACHE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PORTFOLIO_CACHE_EVENT, callback);
  };
}

export default function TcasfolioForm({
  studentId,
  initialPortfolioUrl,
}: {
  studentId: string;
  initialPortfolioUrl: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [savedPortfolioUrl, setSavedPortfolioUrl] = useState(initialPortfolioUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const cachedPortfolioUrl = useSyncExternalStore(
    subscribePortfolioCache,
    () => getCachedPortfolioUrl(studentId),
    () => "",
  );
  const displayPortfolioUrl = savedPortfolioUrl.trim() || cachedPortfolioUrl.trim();
  const currentImageUrl = imagePreview ?? displayPortfolioUrl;

  function handleFile(file: File) {
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("รองรับเฉพาะไฟล์ PNG, JPG หรือ WEBP");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("ไฟล์ใหญ่เกินไป (เกิน 8 MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result.split(",")[1] ?? "");
      setImageMime(file.type);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function save() {
    if (submitting) return;
    setError(null);

    if (!imageBase64) {
      setError("กรุณาเลือกรูป Portfolio ก่อนบันทึก");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tcasfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          portfolioImage: {
            base64: imageBase64,
            mime: imageMime,
            name: imageName,
          },
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        portfolioUrl?: string;
        error?: string;
      };
      if (data.ok && data.portfolioUrl) {
        setSavedPortfolioUrl(data.portfolioUrl);
        setCachedPortfolioUrl(studentId, data.portfolioUrl);
        setImagePreview(data.portfolioUrl);
        setImageBase64(null);
        setImageMime(null);
        setImageName(null);
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
        <p className="mt-1 text-sm text-emerald-700">อัปโหลดรูปไปยัง Cloudflare R2 แล้ว</p>

        <a
          href={displayPortfolioUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-left text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
        >
          <LinkIcon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 break-all">{displayPortfolioUrl}</span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <Pencil className="h-4 w-4" />
            อัปโหลดรูปใหม่
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
            <ImageIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-medium text-violet-600">Doodee Future</div>
            <div className="text-sm font-semibold text-violet-900">
              อัปโหลดรูป Portfolio (tcasfolio)
            </div>
            <div className="text-xs text-muted">รูปจะถูกเก็บใน Cloudflare R2 แล้วสร้างลิงก์ให้อัตโนมัติ</div>
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
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-900">
          <Upload className="h-4 w-4 text-violet-600" />
          รูป Portfolio
        </div>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 cursor-pointer rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-4 transition hover:border-violet-400 hover:bg-violet-50"
        >
          {currentImageUrl ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-72 w-full max-w-sm rounded-lg border border-violet-100 bg-white bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${currentImageUrl.replace(/"/g, "%22")}")` }}
                role="img"
                aria-label="ตัวอย่างรูป Portfolio"
              />
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
                <span>{imageBase64 ? "รูปที่เลือกใหม่" : "รูปที่เคยส่งไว้"}</span>
                <span>·</span>
                <span>คลิกเพื่อเปลี่ยนรูป</span>
              </div>
              {displayPortfolioUrl && (
                <a
                  href={displayPortfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-700"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  เปิดรูปเดิม
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
              <Upload className="h-8 w-8 text-violet-400" />
              <div className="text-sm font-medium text-violet-900">เลือกรูป Portfolio</div>
              <div className="text-xs text-muted">.png .jpg .jpeg .webp · ไม่เกิน 8 MB</div>
              {displayPortfolioUrl && (
                <a
                  href={displayPortfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-700"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  ดูรูปที่เคยส่ง
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "กำลังอัปโหลด…" : "อัปโหลดรูป Portfolio"}
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
