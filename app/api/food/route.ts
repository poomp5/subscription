import { NextRequest, after } from "next/server";
import { findStudent } from "../../data/students";
import { findFoodChoice, isFoodChoiceId } from "../../data/food";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";
import { notifyDiscord } from "../../lib/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await ensureSchema();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  let foodId: string | null = null;
  let comment = "";
  let saved = false;
  if (id) {
    const rows = await sql`
      SELECT food_id, COALESCE(comment, '') AS comment
      FROM food_choices WHERE student_id = ${id} LIMIT 1
    `;
    const row = rows[0] as { food_id: string; comment: string } | undefined;
    if (row) {
      saved = true;
      foodId = row.food_id;
      comment = row.comment ?? "";
    }
  }

  return Response.json({ saved, foodId, comment });
}

type SavePayload = {
  studentId?: string;
  foodId?: unknown;
  comment?: unknown;
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

  const foodId = typeof body.foodId === "string" && isFoodChoiceId(body.foodId) ? body.foodId : null;
  if (!foodId) {
    return Response.json({ ok: false, error: "กรุณาเลือกอาหาร 1 อย่าง" }, { status: 400 });
  }

  const comment = (typeof body.comment === "string" ? body.comment : "").trim().slice(0, 300);

  try {
    await ensureSchema();
  } catch (err) {
    console.error("[food] schema init failed:", err);
    return Response.json(
      { ok: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูล" },
      { status: 500 },
    );
  }

  const fullNameTh = `${student.firstNameTh} ${student.lastNameTh}`.trim();
  const food = findFoodChoice(foodId);

  try {
    await sql`
      INSERT INTO food_choices (
        student_id, student_no, nickname_th, full_name_th, food_id, comment, updated_at
      )
      VALUES (
        ${student.studentId}, ${student.no}, ${student.nicknameTh}, ${fullNameTh},
        ${foodId}, ${comment}, NOW()
      )
      ON CONFLICT (student_id) DO UPDATE SET
        student_no    = EXCLUDED.student_no,
        nickname_th   = EXCLUDED.nickname_th,
        full_name_th  = EXCLUDED.full_name_th,
        food_id       = EXCLUDED.food_id,
        comment       = EXCLUDED.comment,
        updated_at    = NOW()
    `;
  } catch (err) {
    console.error("[food] save failed:", err);
    return Response.json({ ok: false, error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }

  after(() =>
    notifyDiscord({
      title: "บันทึกผลเลือกอาหาร",
      description: `**${student.nicknameTh}** (${fullNameTh})`,
      color: 0x7c3aed,
      fields: [
        { name: "อาหาร", value: food?.nameTh ?? foodId },
        ...(comment ? [{ name: "คอมเมนต์", value: comment }] : []),
      ],
    }),
  );

  return Response.json({ ok: true, foodId, comment });
}
