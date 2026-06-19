import { NextRequest } from "next/server";
import path from "node:path";
import { isAdmin } from "../../../../lib/admin";
import { sql } from "../../../../lib/db";
import { ensureSchema } from "../../../../lib/schema";
import {
  buildDietaryExportRows,
  DIETARY_EXPORT_COLUMNS,
  type DietaryDbRow,
  type DietaryExportRow,
} from "../../../../lib/dietary-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FONT_REGULAR = path.join(process.cwd(), "app/fonts/NotoSansThai-Regular.ttf");
const FONT_BOLD = path.join(process.cwd(), "app/fonts/NotoSansThai-Bold.ttf");

function cell(row: DietaryExportRow, key: keyof DietaryExportRow): string {
  return String(row[key] ?? "");
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const format = (request.nextUrl.searchParams.get("format") || "csv").toLowerCase();

  await ensureSchema();
  const dbRows = (await sql`
    SELECT student_id,
           COALESCE(restrictions, '[]'::jsonb) AS restrictions,
           COALESCE(other_note, '') AS other_note,
           COALESCE(seafood_items, '[]'::jsonb) AS seafood_items,
           COALESCE(seafood_other, '') AS seafood_other
    FROM dietary_choices
  `) as unknown as DietaryDbRow[];

  const rows = buildDietaryExportRows(dbRows);
  const date = new Date().toISOString().slice(0, 10);
  const baseName = `dietary-${date}`;

  if (format === "csv") {
    return csvResponse(rows, baseName);
  }
  if (format === "xlsx") {
    return await xlsxResponse(rows, baseName);
  }
  if (format === "pdf") {
    return await pdfResponse(rows, baseName, date);
  }

  return Response.json({ ok: false, error: "format ไม่ถูกต้อง" }, { status: 400 });
}

// ---------- CSV ----------
function csvResponse(rows: DietaryExportRow[], baseName: string): Response {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = DIETARY_EXPORT_COLUMNS.map((c) => esc(c.header)).join(",");
  const lines = rows.map((r) =>
    DIETARY_EXPORT_COLUMNS.map((c) => esc(cell(r, c.key))).join(","),
  );
  // BOM เพื่อให้ Excel เปิดภาษาไทยได้ถูกต้อง
  const body = "﻿" + [header, ...lines].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.csv"`,
    },
  });
}

// ---------- XLSX ----------
async function xlsxResponse(rows: DietaryExportRow[], baseName: string): Promise<Response> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ข้อมูลอาหาร");

  ws.columns = DIETARY_EXPORT_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  // header style
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF7C3AED" },
  };
  ws.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  for (const r of rows) {
    ws.addRow({
      no: r.no,
      studentId: r.studentId,
      nicknameTh: r.nicknameTh,
      fullNameTh: r.fullNameTh,
      status: r.status,
      restrictions: r.restrictions,
      seafoodDetail: r.seafoodDetail,
      otherNote: r.otherNote,
    });
  }

  ws.autoFilter = { from: "A1", to: "H1" };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
    },
  });
}

// ---------- PDF ----------
async function pdfResponse(
  rows: DietaryExportRow[],
  baseName: string,
  date: string,
): Promise<Response> {
  const PDFDocument = (await import("pdfkit")).default;

  // เฉพาะคอลัมน์ที่เหมาะกับ PDF (เลี่ยงล้นหน้า)
  const cols: { key: keyof DietaryExportRow; header: string; width: number }[] = [
    { key: "no", header: "เลขที่", width: 32 },
    { key: "nicknameTh", header: "ชื่อเล่น", width: 70 },
    { key: "fullNameTh", header: "ชื่อ-สกุล", width: 150 },
    { key: "restrictions", header: "ข้อจำกัด", width: 130 },
    { key: "seafoodDetail", header: "อาหารทะเล", width: 90 },
    { key: "otherNote", header: "อื่นๆ", width: 90 },
  ];

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  doc.registerFont("th", FONT_REGULAR);
  doc.registerFont("th-bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const startX = doc.page.margins.left;
  const tableWidth = cols.reduce((s, c) => s + c.width, 0);

  // หัวเอกสาร
  doc.font("th-bold").fontSize(16).fillColor("#1f2937").text("รายงานข้อมูลด้านอาหาร · ม.6/9 ปี 2569");
  doc.moveDown(0.2);
  const withRestriction = rows.filter((r) => r.status === "มีข้อจำกัด").length;
  const filled = rows.filter((r) => r.status !== "ยังไม่ได้กรอก").length;
  doc
    .font("th")
    .fontSize(9)
    .fillColor("#6b7280")
    .text(
      `วันที่ออกรายงาน ${date}  ·  กรอกแล้ว ${filled}/${rows.length} คน  ·  มีข้อจำกัด ${withRestriction} คน`,
    );
  doc.moveDown(0.6);

  const rowHeight = 22;
  const headerHeight = 24;

  function drawHeader(y: number) {
    doc.save();
    doc.rect(startX, y, tableWidth, headerHeight).fill("#7c3aed");
    doc.fillColor("#ffffff").font("th-bold").fontSize(9);
    let x = startX;
    for (const c of cols) {
      doc.text(c.header, x + 4, y + 7, { width: c.width - 8, ellipsis: true });
      x += c.width;
    }
    doc.restore();
    return y + headerHeight;
  }

  let y = drawHeader(doc.y);

  doc.font("th").fontSize(8.5);
  rows.forEach((r, i) => {
    // ขึ้นหน้าใหม่ถ้าใกล้ขอบล่าง
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage({ size: "A4", layout: "landscape", margin: 30 });
      y = drawHeader(doc.page.margins.top);
      doc.font("th").fontSize(8.5);
    }

    // แถบสลับสี
    if (i % 2 === 1) {
      doc.rect(startX, y, tableWidth, rowHeight).fill("#f5f3ff");
    }
    doc.fillColor("#111827");

    let x = startX;
    for (const c of cols) {
      doc.text(cell(r, c.key), x + 4, y + 6, {
        width: c.width - 8,
        height: rowHeight - 4,
        ellipsis: true,
      });
      x += c.width;
    }
    // เส้นใต้แถว
    doc.moveTo(startX, y + rowHeight).lineTo(startX + tableWidth, y + rowHeight).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
    y += rowHeight;
  });

  doc.end();
  const buf = await done;

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
    },
  });
}
