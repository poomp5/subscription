import { NextRequest } from "next/server";
import { findStudent } from "../../data/students";
import { DIETARY_OPTIONS, isDietaryId } from "../../data/dietary";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";
import { notifyDiscord } from "../../lib/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await ensureSchema();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  let restrictions: string[] | null = null;
  let otherNote = "";
  let saved = false;
  if (id) {
    const rows = await sql`
      SELECT restrictions, other_note FROM dietary_choices WHERE student_id = ${id} LIMIT 1
    `;
    const row = rows[0] as { restrictions: string[]; other_note: string } | undefined;
    if (row) {
      saved = true;
      restrictions = row.restrictions ?? [];
      otherNote = row.other_note ?? "";
    }
  }

  return Response.json({ saved, restrictions, otherNote });
}

type SavePayload = {
  studentId?: string;
  restrictions?: unknown;
  otherNote?: unknown;
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

  // กรองให้เหลือเฉพาะ id ที่ถูกต้อง และไม่ซ้ำ
  const raw = Array.isArray(body.restrictions) ? body.restrictions : [];
  const restrictions = [...new Set(raw.filter((x): x is string => typeof x === "string" && isDietaryId(x)))];

  const otherNote = (typeof body.otherNote === "string" ? body.otherNote : "").trim().slice(0, 300);

  try {
    await ensureSchema();
  } catch (err) {
    console.error("[dietary] schema init failed:", err);
    return Response.json(
      { ok: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูล" },
      { status: 500 },
    );
  }

  const fullNameTh = `${student.firstNameTh} ${student.lastNameTh}`.trim();
  const json = JSON.stringify(restrictions);

  try {
    await sql`
      INSERT INTO dietary_choices (
        student_id, student_no, nickname_th, full_name_th, restrictions, other_note, updated_at
      )
      VALUES (
        ${student.studentId}, ${student.no}, ${student.nicknameTh}, ${fullNameTh}, ${json}::jsonb, ${otherNote}, NOW()
      )
      ON CONFLICT (student_id) DO UPDATE SET
        restrictions = EXCLUDED.restrictions,
        other_note   = EXCLUDED.other_note,
        nickname_th  = EXCLUDED.nickname_th,
        full_name_th = EXCLUDED.full_name_th,
        updated_at   = NOW()
    `;
  } catch (err) {
    console.error("[dietary] save failed:", err);
    return Response.json({ ok: false, error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }

  const labels =
    restrictions.length === 0
      ? "ไม่แพ้ / ไม่มีข้อจำกัด"
      : restrictions
          .map((id) => DIETARY_OPTIONS.find((o) => o.id === id)?.nameTh ?? id)
          .join(", ");

  const fields = [{ name: "ข้อจำกัด", value: labels }];
  if (otherNote) fields.push({ name: "อื่นๆ", value: otherNote });

  notifyDiscord({
    title: "บันทึกข้อมูลด้านอาหาร",
    description: `**${student.nicknameTh}** (${fullNameTh})`,
    color: 0x7c3aed,
    fields,
  });

  return Response.json({ ok: true, restrictions, otherNote });
}
