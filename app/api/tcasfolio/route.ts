import { NextRequest, after } from "next/server";
import { findStudent } from "../../data/students";
import { notifyDiscord } from "../../lib/discord";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString().slice(0, 500);
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  await ensureSchema();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  let portfolioUrl = "";
  let saved = false;
  if (id) {
    const rows = await sql`
      SELECT COALESCE(portfolio_url, '') AS portfolio_url
      FROM tcasfolio_links WHERE student_id = ${id} LIMIT 1
    `;
    const row = rows[0] as { portfolio_url: string } | undefined;
    if (row) {
      saved = true;
      portfolioUrl = row.portfolio_url ?? "";
    }
  }

  return Response.json({ saved, portfolioUrl });
}

type SavePayload = {
  studentId?: string;
  portfolioUrl?: unknown;
};

export async function POST(request: NextRequest) {
  let body: SavePayload;
  try {
    body = (await request.json()) as SavePayload;
  } catch {
    return Response.json({ ok: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const student = body.studentId ? findStudent(body.studentId) : undefined;
  if (!student) {
    return Response.json({ ok: false, error: "ไม่พบนักเรียน" }, { status: 400 });
  }

  const portfolioUrl = normalizeUrl(body.portfolioUrl);
  if (!portfolioUrl) {
    return Response.json({ ok: false, error: "กรุณาใส่ลิงก์ Portfolio ให้ถูกต้อง" }, { status: 400 });
  }

  try {
    await ensureSchema();
  } catch (err) {
    console.error("[tcasfolio] schema init failed:", err);
    return Response.json(
      { ok: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูล" },
      { status: 500 },
    );
  }

  const fullNameTh = `${student.firstNameTh} ${student.lastNameTh}`.trim();

  try {
    await sql`
      INSERT INTO tcasfolio_links (
        student_id, student_no, nickname_th, full_name_th, portfolio_url, updated_at
      )
      VALUES (
        ${student.studentId}, ${student.no}, ${student.nicknameTh}, ${fullNameTh},
        ${portfolioUrl}, NOW()
      )
      ON CONFLICT (student_id) DO UPDATE SET
        student_no    = EXCLUDED.student_no,
        nickname_th   = EXCLUDED.nickname_th,
        full_name_th  = EXCLUDED.full_name_th,
        portfolio_url = EXCLUDED.portfolio_url,
        updated_at    = NOW()
    `;
  } catch (err) {
    console.error("[tcasfolio] save failed:", err);
    return Response.json({ ok: false, error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }

  after(() =>
    notifyDiscord({
      title: "บันทึกลิงก์ Portfolio (tcasfolio)",
      description: `**${student.nicknameTh}** (${fullNameTh})`,
      color: 0x7c3aed,
      fields: [{ name: "ลิงก์ Portfolio", value: portfolioUrl }],
    }),
  );

  return Response.json({ ok: true, portfolioUrl });
}
