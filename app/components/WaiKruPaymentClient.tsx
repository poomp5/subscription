"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type StudentLite = {
  studentId: string;
  nicknameTh: string;
  firstNameTh: string;
  lastNameTh: string;
};

type CurrentSubmission = {
  ref: string;
  status: "PENDING" | "APPROVED";
} | null;

const MAX_SLIP_BYTES = 5 * 1024 * 1024;

export default function WaiKruPaymentClient({
  student,
  currentSubmission,
}: {
  student: StudentLite;
  currentSubmission: CurrentSubmission;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipBase64, setSlipBase64] = useState<string | null>(null);
  const [slipMime, setSlipMime] = useState<string | null>(null);
  const [slipName, setSlipName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<"PENDING" | "APPROVED" | null>(
    currentSubmission?.status ?? null,
  );

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
      setSlipBase64(result.split(",")[1] ?? "");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slipBase64) {
      setError("กรุณาอัปโหลดสลิปก่อนยืนยัน");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wai-kru-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.studentId,
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
      setSuccessRef(data.ref);
      setSubmittedStatus(data.status === "APPROVED" ? "APPROVED" : "PENDING");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setError(msg);
      setSubmitting(false);
    }
  }

  if (submittedStatus) {
    const ref = successRef ?? currentSubmission?.ref;
    const approved = submittedStatus === "APPROVED";
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500">
          <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408l2.796 2.796 6.796-6.796a1 1 0 011.408 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="mt-3 text-base font-semibold text-emerald-800">
          {approved ? "จ่ายไปแล้ว" : "ส่งสลิปแล้ว"}
        </h2>
        <p className="mt-1 text-xs text-emerald-700">
          {approved ? "แอดมินอนุมัติแล้ว" : "รอแอดมินตรวจสอบ"} · {ref}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 sm:p-6">
      <div className="text-sm font-semibold text-violet-900">อัปโหลดสลิปหลังจ่าย</div>
      <p className="mt-0.5 text-xs text-muted">
        {student.nicknameTh} · {student.firstNameTh} {student.lastNameTh}
      </p>

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
              alt="ตัวอย่างสลิปค่าพานไหว้ครู"
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
            <div className="text-xs text-muted">.png .jpg .jpeg · ไม่เกิน 5 MB</div>
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

      {error && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Spinner />
            กำลังส่งสลิป...
          </>
        ) : (
          "จ่ายแล้ว - อัปโหลดสลิป"
        )}
      </button>
    </form>
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
