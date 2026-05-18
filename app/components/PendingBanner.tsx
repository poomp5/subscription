export default function PendingBanner({
  status,
  ref_,
  planName,
}: {
  status: "PENDING" | "REJECTED";
  ref_: string;
  planName: string;
}) {
  if (status === "PENDING") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-block h-3 w-3 shrink-0 animate-pulse rounded-full bg-amber-400" />
          <p className="font-semibold text-amber-800">กำลังรอตรวจสอบสลิป</p>
        </div>
        <p className="mt-1.5 text-sm text-amber-700">
          แอดมินกำลังตรวจสอบสลิปของคุณ หน้านี้จะอัปเดตเองหลังได้รับการยืนยัน
        </p>
        <div className="mt-3 space-y-1.5 rounded-xl bg-amber-100/60 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-amber-700/70">แพ็กเกจ</span>
            <span className="font-medium text-amber-900">{planName}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-amber-700/70">หมายเลขอ้างอิง</span>
            <span className="font-mono text-xs tracking-wider text-amber-900">{ref_}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <div className="flex items-center gap-3">
        <svg className="h-5 w-5 shrink-0 text-rose-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <p className="font-semibold text-rose-800">สลิปถูกปฏิเสธ</p>
      </div>
      <p className="mt-1.5 text-sm text-rose-700">
        สลิปไม่ผ่านการตรวจสอบ กรุณาติดต่อแอดมิน หรือส่งสลิปใหม่อีกครั้ง
      </p>
      <div className="mt-2 rounded-xl bg-rose-100/60 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-rose-700/70">หมายเลขอ้างอิง</span>
          <span className="font-mono text-xs tracking-wider text-rose-900">{ref_}</span>
        </div>
      </div>
    </div>
  );
}
