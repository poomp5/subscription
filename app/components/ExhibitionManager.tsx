"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ExhibitionChoiceRow = {
  studentId: string;
  studentNo: number;
  nicknameTh: string;
  fullNameTh: string;
  departmentId: string;
  createdAt: string;
};

export type ExhibitionDept = {
  id: string;
  emoji: string;
  nameTh: string;
  capacity: number;
};

export default function ExhibitionManager({
  rows,
  depts,
}: {
  rows: ExhibitionChoiceRow[];
  depts: ExhibitionDept[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(studentId: string, body: Record<string, unknown>, key: string) {
    setBusy(key);
    try {
      const res = await fetch("/api/admin/exhibition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, ...body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "ทำรายการไม่สำเร็จ");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  const total = rows.length;
  const totalCapacity = depts.reduce((s, d) => s + d.capacity, 0);

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-border-default bg-white px-4 py-3 text-sm text-muted">
        เลือกฝ่ายแล้ว <span className="font-semibold text-foreground">{total}</span> /{" "}
        {totalCapacity} คน
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {depts.map((dept) => {
          const members = rows
            .filter((r) => r.departmentId === dept.id)
            .sort((a, b) => a.studentNo - b.studentNo);
          const full = members.length >= dept.capacity;
          return (
            <div
              key={dept.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-white"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border-default bg-surface-muted px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{dept.emoji}</span>
                  <span className="font-semibold text-foreground">{dept.nameTh}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    full
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {members.length}/{dept.capacity}
                </span>
              </div>

              {members.length === 0 ? (
                <div className="px-4 py-10 text-center text-xs text-muted">
                  ยังไม่มีคนเลือกฝ่ายนี้
                </div>
              ) : (
                <ul className="divide-y divide-border-default">
                  {members.map((m) => {
                    const otherDepts = depts.filter((d) => d.id !== dept.id);
                    return (
                      <li key={m.studentId} className="px-4 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {m.nicknameTh}
                            </div>
                            <div className="truncate text-xs text-muted">
                              #{m.studentNo} ·{" "}
                              <span className="font-mono">{m.studentId}</span> · {m.fullNameTh}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`เอา ${m.nicknameTh} ออกจาก${dept.nameTh}?`)) {
                                act(m.studentId, { action: "remove" }, `rm-${m.studentId}`);
                              }
                            }}
                            disabled={!!busy}
                            className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted transition hover:text-rose-600 disabled:opacity-50"
                            title="เอาออก"
                          >
                            {busy === `rm-${m.studentId}` ? "…" : "เอาออก"}
                          </button>
                        </div>
                        {otherDepts.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <span className="text-[10px] text-muted">ย้ายไป:</span>
                            {otherDepts.map((d) => (
                              <button
                                key={d.id}
                                onClick={() =>
                                  act(
                                    m.studentId,
                                    { action: "move", departmentId: d.id },
                                    `mv-${m.studentId}-${d.id}`,
                                  )
                                }
                                disabled={!!busy}
                                className="rounded-md border border-border-default px-1.5 py-0.5 text-[10px] text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
                              >
                                {busy === `mv-${m.studentId}-${d.id}` ? "…" : `${d.emoji} ${d.nameTh}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
