"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  UtensilsCrossed,
  Soup,
  Tent,
  LinkIcon,
  LayoutDashboard,
  Wallet,
  CircleAlert,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import type { SubmissionRow } from "../lib/db";
import PenaltyManager, { type StudentPenaltyRow } from "./PenaltyManager";
import ExhibitionManager, {
  type ExhibitionChoiceRow,
  type ExhibitionDept,
  type ExhibitionRoleRow,
} from "./ExhibitionManager";
import DietaryManager, { type DietaryRow } from "./DietaryManager";
import FoodManager, { type FoodRow } from "./FoodManager";
import TcasfolioManager, { type TcasfolioRow } from "./TcasfolioManager";

type Status = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
type Tab = "DASHBOARD" | "SUBMISSIONS" | "PENALTIES" | "EXHIBITION" | "DIETARY" | "FOOD" | "TCASFOLIO";

type Summary = {
  ALL: number;
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  TOTAL: number;
};

const SUBMISSION_TABS: { key: Status; label: string }[] = [
  { key: "PENDING", label: "รอตรวจสอบ" },
  { key: "APPROVED", label: "อนุมัติแล้ว" },
  { key: "REJECTED", label: "ปฏิเสธ" },
  { key: "ALL", label: "ทั้งหมด" },
];

const NAV: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "DASHBOARD", label: "ภาพรวม", icon: LayoutDashboard },
  { key: "SUBMISSIONS", label: "รายการชำระเงิน", icon: Wallet },
  { key: "PENALTIES", label: "จัดการค่าปรับ", icon: CircleAlert },
  { key: "EXHIBITION", label: "จัดนิทรรศการ", icon: Tent },
  { key: "DIETARY", label: "ข้อมูลอาหาร", icon: UtensilsCrossed },
  { key: "FOOD", label: "เลือกอาหาร", icon: Soup },
  { key: "TCASFOLIO", label: "Portfolio", icon: LinkIcon },
];

export default function AdminDashboard({
  rows,
  status,
  q,
  summary,
  penaltyRows,
  exhibitionRows,
  exhibitionDepts,
  exhibitionRoles,
  dietaryRows,
  foodRows,
  tcasfolioRows,
}: {
  rows: SubmissionRow[];
  status: Status;
  q: string;
  summary: Summary;
  penaltyRows: StudentPenaltyRow[];
  exhibitionRows: ExhibitionChoiceRow[];
  exhibitionDepts: ExhibitionDept[];
  exhibitionRoles: ExhibitionRoleRow[];
  dietaryRows: DietaryRow[];
  foodRows: FoodRow[];
  tcasfolioRows: TcasfolioRow[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(q);
  const [, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // ถ้ามี query (status/q) ให้เปิดหน้าชำระเงิน, ไม่งั้นเริ่มที่ภาพรวม
  const [activeTab, setActiveTab] = useState<Tab>(
    status !== "ALL" || q ? "SUBMISSIONS" : "DASHBOARD",
  );
  const [subStatus, setSubStatus] = useState<Status>(status);
  const [navOpen, setNavOpen] = useState(false);

  function go(nextStatus: Status, nextQ: string) {
    const params = new URLSearchParams();
    if (nextStatus !== "ALL") params.set("status", nextStatus);
    if (nextQ) params.set("q", nextQ);
    const qs = params.toString();
    setSubStatus(nextStatus);
    setActiveTab("SUBMISSIONS");
    startTransition(() => {
      router.push(`/admin${qs ? `?${qs}` : ""}`);
    });
  }

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setNavOpen(false);
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  const dietaryFilled = dietaryRows.filter((r) => r.restrictions !== null).length;
  const foodFilled = foodRows.filter((r) => r.foodId !== null).length;
  const tcasfolioFilled = tcasfolioRows.filter((r) => r.portfolioUrl.trim().length > 0).length;
  const badge: Partial<Record<Tab, number>> = {
    SUBMISSIONS: summary.PENDING,
    EXHIBITION: exhibitionRows.length,
    DIETARY: dietaryFilled,
    FOOD: foodFilled,
    TCASFOLIO: tcasfolioFilled,
  };

  const activeLabel = NAV.find((n) => n.key === activeTab)?.label ?? "";

  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col overflow-y-auto border-r border-border-default bg-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-violet-500">Dashboard</div>
            <div className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
              <span className="text-primary">บริหารดีเอส</span>
            </div>
          </div>
          <button
            onClick={() => setNavOpen(false)}
            className="rounded-lg p-1.5 text-muted hover:bg-violet-50 lg:hidden"
            aria-label="ปิดเมนู"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            const count = badge[item.key];
            return (
              <button
                key={item.key}
                onClick={() => selectTab(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary text-white shadow-sm shadow-violet-200"
                    : "text-muted hover:bg-violet-50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {count != null && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-violet-100 text-violet-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border-default p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Backdrop (mobile) */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-violet-950/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Topbar — ติดด้านบนเวลาเลื่อน */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-default bg-white/80 px-5 py-3.5 backdrop-blur sm:px-8">
          <button
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-1.5 text-muted hover:bg-violet-50 lg:hidden"
            aria-label="เปิดเมนู"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{activeLabel}</h1>
        </div>

        <div className="flex-1 px-5 py-6 sm:px-8">
          {activeTab === "DASHBOARD" && (
            <DashboardOverview
              summary={summary}
              exhibitionCount={exhibitionRows.length}
              dietaryFilled={dietaryFilled}
              dietaryTotal={dietaryRows.length}
              foodFilled={foodFilled}
              foodTotal={foodRows.length}
              tcasfolioFilled={tcasfolioFilled}
              tcasfolioTotal={tcasfolioRows.length}
              onGo={selectTab}
            />
          )}

          {activeTab === "PENALTIES" && <PenaltyManager rows={penaltyRows} />}

          {activeTab === "EXHIBITION" && (
            <ExhibitionManager
              rows={exhibitionRows}
              depts={exhibitionDepts}
              roles={exhibitionRoles}
            />
          )}

          {activeTab === "DIETARY" && <DietaryManager rows={dietaryRows} />}

          {activeTab === "FOOD" && <FoodManager rows={foodRows} />}

          {activeTab === "TCASFOLIO" && <TcasfolioManager rows={tcasfolioRows} />}

          {activeTab === "SUBMISSIONS" && (
            <div className="space-y-4">
              {/* filter chips */}
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-border-default bg-white p-1 w-fit">
                {SUBMISSION_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => go(tab.key, search)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                      subStatus === tab.key
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:bg-violet-50"
                    }`}
                  >
                    {tab.label}
                    {tab.key !== "ALL" && (
                      <span
                        className={`ml-1.5 text-[11px] ${
                          subStatus === tab.key ? "text-white/80" : "text-violet-400"
                        }`}
                      >
                        {summary[tab.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  go(subStatus, search.trim());
                }}
                className="flex w-full max-w-sm items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="ค้นหา: ชื่อ, เลข ปจต., ref"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full rounded-xl border border-border-default bg-white px-3 py-2 text-sm text-foreground placeholder:text-violet-300 outline-none transition focus:border-primary focus:ring-2 focus:ring-violet-200"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                >
                  ค้นหา
                </button>
              </form>

              <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
                <div className="hidden grid-cols-[110px_1fr_140px_120px_110px_130px_180px] gap-3 border-b border-border-default bg-surface-muted px-4 py-3 text-xs uppercase tracking-wider text-muted lg:grid">
                  <div>วันที่</div>
                  <div>นักเรียน</div>
                  <div>แพ็กเกจ</div>
                  <div className="text-right">ยอด</div>
                  <div>สลิป</div>
                  <div>สถานะ</div>
                  <div className="text-right">การจัดการ</div>
                </div>

                {rows.length === 0 && (
                  <div className="px-4 py-16 text-center text-sm text-muted">
                    ยังไม่มีรายการในช่องนี้
                  </div>
                )}

                {rows.map((row) => (
                  <SubmissionRow
                    key={row.id}
                    row={row}
                    onPreview={setPreviewUrl}
                    onChange={() => router.refresh()}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {previewUrl && (
        <SlipPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </div>
  );
}

function DashboardOverview({
  summary,
  exhibitionCount,
  dietaryFilled,
  dietaryTotal,
  foodFilled,
  foodTotal,
  tcasfolioFilled,
  tcasfolioTotal,
  onGo,
}: {
  summary: Summary;
  exhibitionCount: number;
  dietaryFilled: number;
  dietaryTotal: number;
  foodFilled: number;
  foodTotal: number;
  tcasfolioFilled: number;
  tcasfolioTotal: number;
  onGo: (tab: Tab) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="รายการทั้งหมด" value={summary.TOTAL} tone="violet" />
        <StatCard label="รอตรวจสอบ" value={summary.PENDING} tone="amber" />
        <StatCard label="อนุมัติแล้ว" value={summary.APPROVED} tone="emerald" />
        <StatCard label="ปฏิเสธ" value={summary.REJECTED} tone="rose" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">ทางลัด</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ShortcutCard
            icon={Wallet}
            title="รายการชำระเงิน"
            desc={`${summary.PENDING} รายการรอตรวจสอบ`}
            onClick={() => onGo("SUBMISSIONS")}
          />
          <ShortcutCard
            icon={CircleAlert}
            title="จัดการค่าปรับ"
            desc="ดูและปรับยอดค่าปรับรายคน"
            onClick={() => onGo("PENALTIES")}
          />
          <ShortcutCard
            icon={Tent}
            title="จัดนิทรรศการ"
            desc={`เลือกฝ่ายแล้ว ${exhibitionCount} คน`}
            onClick={() => onGo("EXHIBITION")}
          />
          <ShortcutCard
            icon={UtensilsCrossed}
            title="ข้อมูลอาหาร"
            desc={`กรอกแล้ว ${dietaryFilled}/${dietaryTotal} คน`}
            onClick={() => onGo("DIETARY")}
          />
          <ShortcutCard
            icon={Soup}
            title="เลือกอาหาร"
            desc={`เลือกแล้ว ${foodFilled}/${foodTotal} คน`}
            onClick={() => onGo("FOOD")}
          />
          <ShortcutCard
            icon={LinkIcon}
            title="Portfolio"
            desc={`ส่งแล้ว ${tcasfolioFilled}/${tcasfolioTotal} คน`}
            onClick={() => onGo("TCASFOLIO")}
          />
        </div>
      </div>
    </div>
  );
}

function ShortcutCard({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border border-border-default bg-white p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </button>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "violet" | "amber" | "emerald" | "rose";
}) {
  const bg = {
    violet: "bg-violet-50 border-violet-100",
    amber: "bg-amber-50 border-amber-100",
    emerald: "bg-emerald-50 border-emerald-100",
    rose: "bg-rose-50 border-rose-100",
  }[tone];
  const text = {
    violet: "text-violet-700",
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    rose: "text-rose-700",
  }[tone];
  return (
    <div className={`rounded-2xl border ${bg} p-4`}>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${text}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === "APPROVED"
      ? { label: "อนุมัติแล้ว", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : status === "REJECTED"
        ? { label: "ปฏิเสธ", cls: "border-rose-200 bg-rose-50 text-rose-700" }
        : { label: "รอตรวจสอบ", cls: "border-amber-200 bg-amber-50 text-amber-700" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function SubmissionRow({
  row,
  onPreview,
  onChange,
}: {
  row: SubmissionRow;
  onPreview: (url: string) => void;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "reset" | "delete") {
    if (action === "delete" && !confirm("ลบรายการนี้ถาวร?")) return;
    setBusy(action);
    try {
      const res = await fetch(`/api/admin/submissions/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "ทำรายการไม่สำเร็จ");
      } else {
        onChange();
      }
    } finally {
      setBusy(null);
    }
  }

  const dt = new Date(row.created_at);
  const dateStr = dt.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-border-default px-4 py-4 transition last:border-0 hover:bg-surface-muted lg:grid-cols-[110px_1fr_140px_120px_110px_130px_180px] lg:items-center">
      <div className="text-xs text-muted lg:text-sm">{dateStr}</div>

      <div>
        <div className="font-medium text-foreground">
          {row.nickname_th} ({row.nickname_en})
        </div>
        <div className="text-xs text-muted">
          #{row.student_no} · <span className="font-mono">{row.student_id}</span> · {row.full_name_th}
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-violet-400">{row.ref}</div>
        {row.note && (
          <div className="mt-1 text-xs text-foreground/80">📝 {row.note}</div>
        )}
      </div>

      <div className="text-sm text-foreground">{row.plan_name_th}</div>

      <div className="text-right text-sm font-semibold text-foreground lg:text-base">
        ฿{Number(row.amount).toLocaleString("th-TH", { minimumFractionDigits: row.amount % 1 ? 2 : 0 })}
      </div>

      <div>
        {row.slip_url ? (
          <button
            onClick={() => onPreview(row.slip_url!)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-white px-2.5 py-1 text-xs text-primary transition hover:bg-violet-50"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
              <path
                fillRule="evenodd"
                d="M.664 10.59a1.65 1.65 0 010-1.18 10 10 0 0118.672 0 1.65 1.65 0 010 1.18 10 10 0 01-18.672 0zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            ดู
          </button>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </div>

      <div>
        <StatusBadge status={row.status} />
      </div>

      <div className="flex flex-wrap justify-end gap-1.5">
        {row.status !== "APPROVED" && (
          <button
            onClick={() => act("approve")}
            disabled={!!busy}
            className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
          >
            {busy === "approve" ? "…" : "อนุมัติ"}
          </button>
        )}
        {row.status !== "REJECTED" && (
          <button
            onClick={() => act("reject")}
            disabled={!!busy}
            className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200 disabled:opacity-50"
          >
            {busy === "reject" ? "…" : "ปฏิเสธ"}
          </button>
        )}
        {row.status !== "PENDING" && (
          <button
            onClick={() => act("reset")}
            disabled={!!busy}
            className="rounded-lg bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700 transition hover:bg-violet-200 disabled:opacity-50"
          >
            คืนค่า
          </button>
        )}
        <button
          onClick={() => act("delete")}
          disabled={!!busy}
          className="rounded-lg px-2 py-1 text-xs text-muted transition hover:text-rose-600 disabled:opacity-50"
          title="ลบรายการ"
        >
          ลบ
        </button>
      </div>
    </div>
  );
}

function SlipPreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-violet-950/40 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl border border-border-default bg-white shadow-2xl shadow-violet-900/20"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white p-1.5 text-foreground shadow-md hover:bg-violet-50"
          aria-label="ปิด"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="สลิป" className="max-h-[90vh] w-auto object-contain" />
        <div className="border-t border-border-default bg-surface-muted px-4 py-2 text-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            เปิดในแท็บใหม่
          </a>
        </div>
      </div>
    </div>
  );
}
