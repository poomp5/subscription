import { NextRequest } from "next/server";
import { findStudent } from "../../data/students";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";
import { uploadSlip } from "../../lib/storage";
import { notifyDiscord } from "../../lib/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeRef(studentId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PEN-${studentId}-${ts}${rand}`;
}

function totalPenalty(count: number): number {
  if (count <= 0) return 0;
  return count * 20 + (5 * count * (count - 1)) / 2;
}

export async function POST(request: NextRequest) {
  let body: { studentId?: string; slip?: { base64?: string; mime?: string; name?: string } };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const student = body.studentId ? findStudent(body.studentId) : undefined;
  if (!student) {
    return Response.json({ ok: false, error: "ไม่พบนักเรียน" }, { status: 400 });
  }
  if (!body.slip?.base64) {
    return Response.json({ ok: false, error: "ต้องแนบสลิป" }, { status: 400 });
  }

  await ensureSchema();

  const penRows = await sql`SELECT count FROM penalties WHERE student_id = ${student.studentId}`;
  const penaltyCount = (penRows[0] as { count: number } | undefined)?.count ?? 0;
  if (penaltyCount <= 0) {
    return Response.json({ ok: false, error: "ไม่มียอดค้างชำระ" }, { status: 400 });
  }

  const amount = totalPenalty(penaltyCount);
  const ref = makeRef(student.studentId);

  let slipUrl: string | null = null;
  let slipKey: string | null = null;
  try {
    const uploaded = await uploadSlip({
      base64: body.slip.base64,
      mime: body.slip.mime ?? "image/png",
      ref,
    });
    if (uploaded) {
      slipUrl = uploaded.url;
      slipKey = uploaded.key;
    }
  } catch (err) {
    console.error("[penalty-submit] slip upload failed:", err);
    return Response.json({ ok: false, error: "อัปโหลดสลิปไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 502 });
  }

  const fullNameTh = `${student.firstNameTh} ${student.lastNameTh}`.trim();

  await sql`
    INSERT INTO submissions (
      ref, student_id, student_no, nickname_th, nickname_en,
      full_name_th, full_name_en, plan_id, plan_name_th, amount,
      note, slip_url, slip_key, status
    ) VALUES (
      ${ref}, ${student.studentId}, ${student.no}, ${student.nicknameTh}, ${student.nickname},
      ${fullNameTh}, ${`${student.firstName} ${student.lastName}`.trim()},
      'penalty', ${'ค่าปรับ (' + penaltyCount + ' ครั้ง)'},
      ${amount}, ${`ค่าปรับ ${penaltyCount} ครั้ง`}, ${slipUrl}, ${slipKey}, 'PENDING'
    )
  `;

  notifyDiscord({
    title: "⚠️ สลิปค่าปรับรอตรวจสอบ",
    description: `**${student.nicknameTh}** (${student.firstNameTh} ${student.lastNameTh})`,
    color: 0xe11d48,
    fields: [
      { name: "ค่าปรับ", value: `${penaltyCount} ครั้ง — ฿${amount}`, inline: true },
      { name: "Ref", value: ref, inline: true },
    ],
  });

  return Response.json({ ok: true, ref });
}
