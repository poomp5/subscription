import { NextRequest } from "next/server";
import { findStudent } from "../../data/students";
import { WAI_KRU_AMOUNT } from "../../data/plans";
import { notifyDiscord } from "../../lib/discord";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";
import { uploadSlip } from "../../lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SlipPayload = {
  base64?: string;
  mime?: string;
  name?: string;
};

type SubmitPayload = {
  studentId?: string;
  slip?: SlipPayload;
};

function makeRef(studentId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WK-${studentId}-${ts}${rand}`;
}

export async function POST(request: NextRequest) {
  let body: SubmitPayload;
  try {
    body = (await request.json()) as SubmitPayload;
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

  try {
    await ensureSchema();
  } catch (err) {
    console.error("[wai-kru-submit] schema init failed:", err);
    return Response.json(
      { ok: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูล" },
      { status: 500 },
    );
  }

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
    console.error("[wai-kru-submit] slip upload failed:", err);
    return Response.json(
      { ok: false, error: "อัปโหลดสลิปไม่สำเร็จ ลองใหม่อีกครั้ง" },
      { status: 502 },
    );
  }

  const fullNameTh = `${student.firstNameTh} ${student.lastNameTh}`.trim();
  const fullNameEn = `${student.firstName} ${student.lastName}`.trim();

  try {
    await sql`
      INSERT INTO submissions (
        ref, student_id, student_no, nickname_th, nickname_en,
        full_name_th, full_name_en, plan_id, plan_name_th, amount,
        note, slip_url, slip_key, status
      ) VALUES (
        ${ref}, ${student.studentId}, ${student.no}, ${student.nicknameTh}, ${student.nickname},
        ${fullNameTh}, ${fullNameEn}, 'wai-kru', 'ค่าพานไหว้ครู', ${WAI_KRU_AMOUNT},
        ${'ค่าพานไหว้ครู'}, ${slipUrl}, ${slipKey}, 'PENDING'
      )
    `;
  } catch (err) {
    console.error("[wai-kru-submit] DB insert failed:", err);
    return Response.json(
      { ok: false, error: "บันทึกข้อมูลไม่สำเร็จ" },
      { status: 500 },
    );
  }

  notifyDiscord({
    title: "สลิปค่าพานไหว้ครูรอตรวจสอบ",
    description: `**${student.nicknameTh}** (${student.firstNameTh} ${student.lastNameTh})`,
    color: 0xe11d48,
    fields: [
      { name: "รายการ", value: `ค่าพานไหว้ครู — ฿${WAI_KRU_AMOUNT}`, inline: true },
      { name: "Ref", value: ref, inline: true },
    ],
  });

  return Response.json({ ok: true, ref });
}
