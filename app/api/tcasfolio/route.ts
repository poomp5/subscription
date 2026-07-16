import { NextRequest, after } from "next/server";
import { findStudent } from "../../data/students";
import { notifyDiscord } from "../../lib/discord";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";
import { uploadTcasfolioImage } from "../../lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_MIMES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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
  portfolioImage?: {
    base64?: string;
    mime?: string;
    name?: string;
  };
};

function makeRef(studentId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TCASFOLIO-${studentId}-${ts}${rand}`;
}

function estimateBase64Bytes(base64: string) {
  const normalized = base64.replace(/\s/g, "");
  const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

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

  const imageBase64 = body.portfolioImage?.base64?.trim();
  const imageMime = body.portfolioImage?.mime?.trim().toLowerCase() || "image/png";
  if (!imageBase64) {
    return Response.json({ ok: false, error: "กรุณาอัปโหลดรูป Portfolio" }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_MIMES.has(imageMime)) {
    return Response.json(
      { ok: false, error: "รองรับเฉพาะไฟล์ PNG, JPG หรือ WEBP" },
      { status: 400 },
    );
  }
  if (estimateBase64Bytes(imageBase64) > MAX_IMAGE_BYTES) {
    return Response.json({ ok: false, error: "ไฟล์ใหญ่เกินไป (เกิน 8 MB)" }, { status: 400 });
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
  const ref = makeRef(student.studentId);
  let portfolioUrl: string;
  let portfolioKey: string;

  try {
    const uploaded = await uploadTcasfolioImage({
      base64: imageBase64,
      mime: imageMime,
      ref,
    });
    if (!uploaded) {
      return Response.json(
        { ok: false, error: "ยังไม่ได้ตั้งค่า Cloudflare R2" },
        { status: 500 },
      );
    }
    portfolioUrl = uploaded.url;
    portfolioKey = uploaded.key;
  } catch (err) {
    console.error("[tcasfolio] image upload failed:", err);
    return Response.json(
      { ok: false, error: "อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง" },
      { status: 502 },
    );
  }

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
      title: "อัปโหลดรูป Portfolio (tcasfolio)",
      description: `**${student.nicknameTh}** (${fullNameTh})`,
      color: 0x7c3aed,
      fields: [
        { name: "ลิงก์รูป", value: portfolioUrl },
        { name: "R2 Key", value: portfolioKey },
      ],
    }),
  );

  return Response.json({ ok: true, portfolioUrl });
}
