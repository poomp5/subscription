"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const MAX_SLIP_BYTES = 5 * 1024 * 1024;

type Step = "qr" | "upload" | "done";

export default function PenaltyQR({
  studentId,
  amount,
  count,
  qrUrl,
  pendingRef,
}: {
  studentId: string;
  amount: number;
  count: number;
  qrUrl: string;
  pendingRef: string | null;
}) {
  const [step, setStep] = useState<Step>(pendingRef ? "done" : "qr");
  const [open, setOpen] = useState(false);

  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipBase64, setSlipBase64] = useState<string | null>(null);
  const [slipMime, setSlipMime] = useState<string>("image/png");
  const [slipName, setSlipName] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(pendingRef);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rows = Array.from({ length: count }, (_, i) => ({
    round: i + 1,
    charge: 20 + i * 5,
  }));

  function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("รองรับเฉพาะรูปภาพ PNG / JPG");
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
      setSlipBase64(result.split(",")[1] ?? "");
      setSlipMime(file.type);
      setSlipName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slipBase64) {
      setError("กรุณาแนบสลิปก่อนยืนยัน");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/penalty-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          slip: { base64: slipBase64, mime: slipMime, name: slipName },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "บันทึกไม่สำเร็จ");
      setRef(data.ref);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done / Pending state ──
  if (step === "done") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400">
            <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .22.097.43.265.566l3.5 2.8a.75.75 0 10.94-1.17L10.75 9.69V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-amber-800">รออนุมัติ — แอดมินกำลังตรวจสลิป</div>
            {ref && <div className="mt-0.5 font-mono text-xs text-amber-600">{ref}</div>}
          </div>
        </div>
      </div>
    );
  }

  // ── Upload step ──
  if (step === "upload") {
    return (
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6"
      >
        <button
          type="button"
          onClick={() => setStep("qr")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-800"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          กลับดู QR
        </button>

        <div className="text-sm font-semibold text-rose-800">แนบสลิปค่าปรับ</div>
        <p className="mt-0.5 text-xs text-rose-500">ยอด ฿{amount} · รูปภาพ ≤ 5 MB</p>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className="mt-3 cursor-pointer rounded-xl border-2 border-dashed border-rose-200 bg-white p-4 transition hover:border-rose-400 hover:bg-rose-50/50"
        >
          {slipPreview ? (
            <div className="flex flex-col items-center gap-2">
              <Image
                src={slipPreview}
                alt="สลิปค่าปรับ"
                width={400}
                height={520}
                unoptimized
                className="max-h-60 w-auto rounded-lg object-contain"
              />
              <div className="text-xs text-rose-400">คลิกเพื่อเปลี่ยนรูป</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-5 text-center">
              <svg className="h-7 w-7 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M12 16V4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm font-medium text-rose-700">เลือกไฟล์สลิป</div>
              <div className="text-xs text-rose-400">.png .jpg .jpeg</div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {error && (
          <div className="mt-3 rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !slipBase64}
          className="mt-4 group flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <><Spinner /> กำลังส่งข้อมูล…</>
          ) : (
            <>
              ชำระแล้ว — ยืนยัน
              <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408l2.796 2.796 6.796-6.796a1 1 0 011.408 0z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </form>
    );
  }

  // ── QR step (default) ──
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-rose-600">
            ยอดค้างชำระ — โทษไม่ทำเวร
          </div>
          <div className="mt-1 text-3xl font-bold text-rose-800">
            ฿{amount.toLocaleString("th-TH")}
          </div>
          <div className="mt-0.5 text-sm text-rose-600">
            โดนปรับ {count} ครั้ง
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 shrink-0 rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
        >
          {open ? "ซ่อน" : "รายละเอียด"}
        </button>
      </div>

      {open && (
        <div className="mt-3 overflow-hidden rounded-xl border border-rose-200 bg-white text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rose-100 text-[11px] uppercase tracking-wider text-rose-400">
                <th className="px-3 py-2 text-left">ครั้งที่</th>
                <th className="px-3 py-2 text-right">ค่าปรับ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.round} className="border-b border-rose-50 last:border-0">
                  <td className="px-3 py-1.5 text-rose-700">{r.round}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-rose-800">฿{r.charge}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-rose-200 bg-rose-50">
                <td className="px-3 py-2 text-xs font-semibold text-rose-700">รวม</td>
                <td className="px-3 py-2 text-right font-bold text-rose-800">฿{amount}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-col items-center rounded-2xl border border-rose-200 bg-white p-4">
        <Image
          src={qrUrl}
          alt={`QR PromptPay ค่าปรับ ${amount} บาท`}
          width={220}
          height={220}
          unoptimized
          priority
          className="h-55 w-55"
        />
        <div className="mt-2 text-center">
          <div className="text-[11px] uppercase tracking-wider text-rose-400">ยอดค้างชำระ</div>
          <div className="text-xl font-bold text-rose-800">฿{amount}</div>
        </div>
      </div>

      <button
        onClick={() => setStep("upload")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
      >
        ชำระเงินแล้ว — แนบสลิป
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
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
