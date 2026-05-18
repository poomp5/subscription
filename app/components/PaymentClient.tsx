"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type StudentLite = {
  studentId: string;
  nicknameTh: string;
  nickname: string;
  firstNameTh: string;
  lastNameTh: string;
};

type PlanLite = {
  id: string;
  nameTh: string;
  price: number;
  priceLabel: string;
};

const MAX_SLIP_BYTES = 5 * 1024 * 1024;

export default function PaymentClient({
  student,
  plan,
  qrUrl,
}: {
  student: StudentLite;
  plan: PlanLite;
  qrUrl: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipBase64, setSlipBase64] = useState<string | null>(null);
  const [slipMime, setSlipMime] = useState<string | null>(null);
  const [slipName, setSlipName] = useState<string | null>(null);

  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("รองรับเฉพาะไฟล์รูปภาพ (PNG / JPG)");
      return;
    }
    if (file.size > MAX_SLIP_BYTES) {
      setError("ไฟล์ใหญ่เกินไป (เกิน 5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSlipPreview(result);
      const base64 = result.split(",")[1] ?? "";
      setSlipBase64(base64);
      setSlipMime(file.type);
      setSlipName(file.name);
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

  async function copyPromptPay() {
    try {
      await navigator.clipboard.writeText("0925591545");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slipBase64) {
      setError("กรุณาอัปโหลดสลิปก่อนยืนยัน");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.studentId,
          planId: plan.id,
          amount: plan.price,
          note,
          slip: {
            base64: slipBase64,
            mime: slipMime,
            name: slipName,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "บันทึกไม่สำเร็จ");
      }
      const ref = encodeURIComponent(data.ref || "");
      router.push(`/success?ref=${ref}&plan=${plan.id}&id=${student.studentId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 fade-up lg:grid-cols-[1.05fr_1fr] lg:gap-5">
      {/* QR card */}
      <div className="card-primary p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-primary-ink">สแกนเพื่อชำระ</div>
          <div className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
            PromptPay
          </div>
        </div>

        <div className="mt-3 flex flex-col items-center rounded-2xl border border-violet-100 bg-white p-4">
          <Image
            src={qrUrl}
            alt={`QR PromptPay ${plan.priceLabel} บาท`}
            width={260}
            height={260}
            unoptimized
            priority
            loading="eager"
            className="h-55 w-55 sm:h-65 sm:w-65"
          />
          <div className="mt-2 text-center">
            <div className="text-[11px] uppercase tracking-wider text-muted">จำนวนเงิน</div>
            <div className="text-2xl font-bold text-violet-900">฿{plan.priceLabel}</div>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <Row label="ผู้รับ" value="พร้อมเพย์" />
          <Row label="เบอร์" value="092-559-1545" trailing={
            <button
              type="button"
              onClick={copyPromptPay}
              className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-violet-700 transition hover:bg-violet-50"
            >
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </button>
          } />
          <Row label="แพ็กเกจ" value={plan.nameTh} />
          <Row label="ชื่อผู้ซื้อ" value={`${student.firstNameTh} ${student.lastNameTh}`} />
        </div>
      </div>

      {/* Upload + submit */}
      <div className="flex flex-col gap-4">
        <div className="card p-5 sm:p-6">
          <div className="text-sm font-semibold text-violet-900">แนบสลิป</div>
          <p className="mt-0.5 text-xs text-muted">รูปภาพ ≤ 5 MB</p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 cursor-pointer rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-4 transition hover:border-violet-400 hover:bg-violet-50"
          >
            {slipPreview ? (
              <div className="flex flex-col items-center gap-2">
                <Image
                  src={slipPreview}
                  alt="ตัวอย่างสลิป"
                  width={400}
                  height={520}
                  unoptimized
                  className="max-h-60 w-auto rounded-lg object-contain"
                />
                <div className="text-xs text-muted">คลิกเพื่อเปลี่ยนรูป</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-5 text-center">
                <svg
                  className="h-7 w-7 text-violet-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  <path d="M12 16V4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm font-medium text-violet-900">เลือกไฟล์สลิป</div>
                <div className="text-xs text-muted">.png .jpg .jpeg</div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="หมายเหตุ (ไม่บังคับ)"
            className="mt-3 block w-full resize-none rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-violet-300 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Spinner />
              กำลังส่งข้อมูล…
            </>
          ) : (
            <>
              ชำระแล้ว — ยืนยัน
              <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408l2.796 2.796 6.796-6.796a1 1 0 011.408 0z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Row({
  label,
  value,
  trailing,
}: {
  label: string;
  value: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-violet-50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-2 font-medium text-foreground">
        {value}
        {trailing}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
