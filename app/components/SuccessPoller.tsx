"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Status = "PENDING" | "APPROVED" | "REJECTED";

export default function SuccessPoller({
  ref_,
  studentName,
  studentFullName,
  planLabel,
  initialStatus,
}: {
  ref_: string | null;
  studentName: string | null;
  studentFullName: string | null;
  planLabel: string | null;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);

  useEffect(() => {
    if (!ref_ || status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?ref=${encodeURIComponent(ref_)}`);
        const data = await res.json();
        if (data.status === "APPROVED" || data.status === "REJECTED") {
          setStatus(data.status);
          clearInterval(interval);
        }
      } catch {
        /* ignore network errors */
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ref_, status]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-5">
      <div className="w-full max-w-md fade-up">
        <div className="card p-6 text-center sm:p-8">

          {status === "PENDING" && <PendingIcon />}
          {status === "APPROVED" && <ApprovedIcon />}
          {status === "REJECTED" && <RejectedIcon />}

          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            {status === "PENDING" && (
              <span className="text-amber-700">กำลังตรวจสลิป…</span>
            )}
            {status === "APPROVED" && (
              <span className="text-emerald-700">อนุมัติแล้ว!</span>
            )}
            {status === "REJECTED" && (
              <span className="text-rose-700">ตรวจสอบไม่ผ่าน</span>
            )}
          </h1>

          <p className="mt-1.5 text-sm text-muted">
            {status === "PENDING" &&
              `ขอบคุณ${studentName ? ` ${studentName}` : ""} — แอดมินกำลังตรวจสอบสลิป หน้านี้จะอัปเดตเองเมื่อได้รับการยืนยัน`}
            {status === "APPROVED" &&
              `เปิดสิทธิ์ Premium แล้ว${studentName ? ` สำหรับ ${studentName}` : ""} ขอบคุณที่ชำระเงิน`}
            {status === "REJECTED" &&
              "สลิปไม่ผ่านการตรวจสอบ กรุณาติดต่อแอดมิน หรือลองส่งสลิปใหม่อีกครั้ง"}
          </p>

          {status === "PENDING" && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-600">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              กำลังรอการยืนยัน
            </div>
          )}

          <div className="mt-5 card-soft space-y-2 p-4 text-left text-sm">
            {ref_ && <Row label="หมายเลขอ้างอิง" value={ref_} mono />}
            {planLabel && <Row label="แพ็กเกจ" value={planLabel} />}
            {studentFullName && <Row label="ผู้สมัคร" value={studentFullName} />}
          </div>

          {status === "PENDING" && (
            <p className="mt-4 text-xs text-muted">
              หน้านี้เช็คสถานะทุก 5 วินาที ไม่ต้อง refresh เอง
            </p>
          )}

          {(status === "APPROVED" || status === "REJECTED") && (
            <Link
              href="/"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              กลับหน้าแรก
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function PendingIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
      <svg className="h-7 w-7 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ApprovedIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500">
      <svg className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408l2.796 2.796 6.796-6.796a1 1 0 011.408 0z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function RejectedIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
      <svg className="h-7 w-7 text-rose-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={`text-foreground ${mono ? "font-mono text-xs tracking-wider" : ""}`}>
        {value}
      </span>
    </div>
  );
}
