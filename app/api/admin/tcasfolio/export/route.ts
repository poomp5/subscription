import { NextRequest } from "next/server";
import { isAdmin } from "../../../../lib/admin";
import { STUDENTS } from "../../../../data/students";
import { sql } from "../../../../lib/db";
import { ensureSchema } from "../../../../lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TcasfolioDbRow = {
  student_id: string;
  portfolio_url: string;
  updated_at: string | null;
};

type TcasfolioExportRow = {
  no: number;
  studentId: string;
  nicknameTh: string;
  fullNameTh: string;
  status: string;
  portfolioUrl: string;
  updatedAt: string;
};

const COLUMNS: { key: keyof TcasfolioExportRow; header: string; width: number }[] = [
  { key: "no", header: "เลขที่", width: 10 },
  { key: "studentId", header: "เลขประจำตัว", width: 16 },
  { key: "nicknameTh", header: "ชื่อเล่น", width: 16 },
  { key: "fullNameTh", header: "ชื่อ-สกุล", width: 28 },
  { key: "status", header: "สถานะ", width: 14 },
  { key: "portfolioUrl", header: "ลิงก์รูป Portfolio", width: 70 },
  { key: "updatedAt", header: "อัปเดตล่าสุด", width: 22 },
];

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const format = (request.nextUrl.searchParams.get("format") || "xlsx").toLowerCase();
  if (format !== "xlsx") {
    return Response.json({ ok: false, error: "รองรับเฉพาะ xlsx" }, { status: 400 });
  }

  await ensureSchema();
  const dbRows = (await sql`
    SELECT student_id, COALESCE(portfolio_url, '') AS portfolio_url, updated_at
    FROM tcasfolio_links
  `) as unknown as TcasfolioDbRow[];

  const byStudent = new Map(dbRows.map((r) => [r.student_id, r]));
  const rows: TcasfolioExportRow[] = STUDENTS.map((student) => {
    const saved = byStudent.get(student.studentId);
    const portfolioUrl = saved?.portfolio_url?.trim() ?? "";
    return {
      no: student.no,
      studentId: student.studentId,
      nicknameTh: student.nicknameTh,
      fullNameTh: `${student.firstNameTh} ${student.lastNameTh}`.trim(),
      status: portfolioUrl ? "ส่งแล้ว" : "ยังไม่ส่ง",
      portfolioUrl,
      updatedAt: saved?.updated_at ? formatDateTime(saved.updated_at) : "",
    };
  });

  const date = new Date().toISOString().slice(0, 10);
  return await xlsxResponse(rows, `tcasfolio-${date}`);
}

async function xlsxResponse(rows: TcasfolioExportRow[], baseName: string): Promise<Response> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("TCASFOLIO");

  ws.columns = COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF7C3AED" },
  };
  ws.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  for (const r of rows) {
    const row = ws.addRow({
      no: r.no,
      studentId: r.studentId,
      nicknameTh: r.nicknameTh,
      fullNameTh: r.fullNameTh,
      status: r.status,
      portfolioUrl: r.portfolioUrl,
      updatedAt: r.updatedAt,
    });

    if (r.portfolioUrl) {
      const urlCell = row.getCell("portfolioUrl");
      urlCell.value = { text: "เปิดรูป Portfolio", hyperlink: r.portfolioUrl };
      urlCell.font = { color: { argb: "FF2563EB" }, underline: true };
    }
  }

  ws.autoFilter = { from: "A1", to: "G1" };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const statusColumn = ws.getColumn("status");
  statusColumn.eachCell((cell, rowNumber) => {
    if (rowNumber === 1) return;
    if (cell.value === "ส่งแล้ว") {
      cell.font = { color: { argb: "FF047857" }, bold: true };
    } else {
      cell.font = { color: { argb: "FF9CA3AF" } };
    }
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
    },
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}
