"use client";

import { CircleDashed, ExternalLink, FileSpreadsheet, ImageIcon } from "lucide-react";

export type TcasfolioRow = {
  studentId: string;
  studentNo: number;
  nicknameTh: string;
  fullNameTh: string;
  portfolioUrl: string;
  updatedAt: string | null;
};

export default function TcasfolioManager({ rows }: { rows: TcasfolioRow[] }) {
  const filled = rows.filter((r) => r.portfolioUrl.trim().length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-default bg-white px-4 py-3">
        <div className="text-sm text-muted">ดาวน์โหลดข้อมูล TCASFOLIO ทั้งหมด ({rows.length} คน)</div>
        <a
          href="/api/admin/tcasfolio/export?format=xlsx"
          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Excel
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="ส่งแล้ว" value={`${filled.length}/${rows.length}`} />
        <SummaryCard label="ยังไม่ส่ง" value={rows.length - filled.length} />
        <SummaryCard label="อัปเดตล่าสุด" value={formatLatest(filled)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
        <div className="hidden grid-cols-[1fr_150px_minmax(0,2fr)_150px] gap-3 border-b border-border-default bg-surface-muted px-4 py-3 text-xs uppercase tracking-wider text-muted lg:grid">
          <div>นักเรียน</div>
          <div>ตัวอย่างรูป</div>
          <div>รูป Portfolio</div>
          <div className="text-right">อัปเดต</div>
        </div>

        <ul className="divide-y divide-border-default">
          {rows.map((r) => {
            const hasLink = r.portfolioUrl.trim().length > 0;
            return (
              <li
                key={r.studentId}
                className="grid grid-cols-1 gap-3 px-4 py-3 transition hover:bg-surface-muted lg:grid-cols-[1fr_150px_minmax(0,2fr)_150px] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{r.nicknameTh}</div>
                  <div className="truncate text-xs text-muted">
                    #{r.studentNo} · <span className="font-mono">{r.studentId}</span> ·{" "}
                    {r.fullNameTh}
                  </div>
                </div>

                <div>
                  {hasLink ? (
                    <a
                      href={r.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block h-24 w-20 overflow-hidden rounded-lg border border-violet-100 bg-violet-50 transition hover:border-violet-300"
                      aria-label={`เปิดรูป Portfolio ของ ${r.nicknameTh}`}
                    >
                      <span
                        className="block h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${r.portfolioUrl.replace(/"/g, "%22")}")` }}
                      />
                    </a>
                  ) : (
                    <span className="flex h-24 w-20 items-center justify-center rounded-lg border border-dashed border-border-default bg-surface-muted text-violet-200">
                      <ImageIcon className="h-6 w-6" />
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  {hasLink ? (
                    <a
                      href={r.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                    >
                      <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">เปิดรูป Portfolio</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-muted px-2.5 py-0.5 text-xs text-muted">
                      <CircleDashed className="h-3.5 w-3.5" />
                      ยังไม่ได้ส่ง
                    </span>
                  )}
                </div>

                <div className="text-left text-xs text-muted lg:text-right">
                  {r.updatedAt ? formatDateTime(r.updatedAt) : "-"}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-violet-700">{value}</div>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function formatLatest(rows: TcasfolioRow[]) {
  const latest = rows
    .map((r) => (r.updatedAt ? new Date(r.updatedAt).getTime() : 0))
    .filter((time) => !Number.isNaN(time) && time > 0)
    .sort((a, b) => b - a)[0];
  if (!latest) return "-";
  return formatDateTime(new Date(latest).toISOString());
}
