import { NextRequest } from "next/server";
import path from "node:path";
import { isAdmin } from "../../../../lib/admin";
import { sql } from "../../../../lib/db";
import { ensureSchema } from "../../../../lib/schema";
import {
  buildFoodExportRows,
  buildFoodSummary,
  FOOD_EXPORT_COLUMNS,
  type FoodDbRow,
  type FoodExportRow,
} from "../../../../lib/food-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FONT_REGULAR = path.join(process.cwd(), "app/fonts/NotoSansThai-Regular.ttf");
const FONT_BOLD = path.join(process.cwd(), "app/fonts/NotoSansThai-Bold.ttf");

function cell(row: FoodExportRow, key: keyof FoodExportRow): string {
  return String(row[key] ?? "");
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const format = (request.nextUrl.searchParams.get("format") || "csv").toLowerCase();

  await ensureSchema();
  const dbRows = (await sql`
    SELECT student_id, food_id, COALESCE(comment, '') AS comment
    FROM food_choices
  `) as unknown as FoodDbRow[];

  const rows = buildFoodExportRows(dbRows);
  const date = new Date().toISOString().slice(0, 10);
  const baseName = `food-poll-${date}`;

  if (format === "csv") return csvResponse(rows, baseName);
  if (format === "xlsx") return await xlsxResponse(rows, baseName);
  if (format === "pdf") return await pdfResponse(rows, dbRows, baseName, date);

  return Response.json({ ok: false, error: "format ไม่ถูกต้อง" }, { status: 400 });
}

function csvResponse(rows: FoodExportRow[], baseName: string): Response {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = FOOD_EXPORT_COLUMNS.map((c) => esc(c.header)).join(",");
  const lines = rows.map((r) => FOOD_EXPORT_COLUMNS.map((c) => esc(cell(r, c.key))).join(","));
  const body = "﻿" + [header, ...lines].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.csv"`,
    },
  });
}

async function xlsxResponse(rows: FoodExportRow[], baseName: string): Promise<Response> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ผลเลือกอาหาร");

  ws.columns = FOOD_EXPORT_COLUMNS.map((c) => ({
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
    ws.addRow({
      no: r.no,
      studentId: r.studentId,
      nicknameTh: r.nicknameTh,
      fullNameTh: r.fullNameTh,
      status: r.status,
      food: r.food,
      comment: r.comment,
    });
  }

  ws.autoFilter = { from: "A1", to: "G1" };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
    },
  });
}

async function pdfResponse(
  rows: FoodExportRow[],
  dbRows: FoodDbRow[],
  baseName: string,
  date: string,
): Promise<Response> {
  const PDFDocument = (await import("pdfkit")).default;

  const cols: { key: keyof FoodExportRow; header: string; width: number }[] = [
    { key: "no", header: "เลขที่", width: 32 },
    { key: "nicknameTh", header: "ชื่อเล่น", width: 70 },
    { key: "fullNameTh", header: "ชื่อ-สกุล", width: 160 },
    { key: "food", header: "อาหารที่เลือก", width: 160 },
    { key: "comment", header: "คอมเมนต์", width: 180 },
  ];

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  doc.registerFont("th", FONT_REGULAR);
  doc.registerFont("th-bold", FONT_BOLD);

  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const summary = buildFoodSummary(dbRows)
    .map((food) => `${food.nameTh} ${food.count} คน`)
    .join("  ·  ");
  const filled = rows.filter((r) => r.status === "เลือกแล้ว").length;

  doc.font("th-bold").fontSize(16).fillColor("#1f2937").text("รายงานผลเลือกอาหาร · ม.6/9 ปี 2569");
  doc.moveDown(0.2);
  doc
    .font("th")
    .fontSize(9)
    .fillColor("#6b7280")
    .text(`วันที่ออกรายงาน ${date}  ·  เลือกแล้ว ${filled}/${rows.length} คน  ·  ${summary}`);
  doc.moveDown(0.6);

  const startX = doc.page.margins.left;
  const tableWidth = cols.reduce((s, c) => s + c.width, 0);
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
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage({ size: "A4", layout: "landscape", margin: 30 });
      y = drawHeader(doc.page.margins.top);
      doc.font("th").fontSize(8.5);
    }

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
