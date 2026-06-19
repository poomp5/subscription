import { NextRequest, after } from "next/server";
import { findStudent } from "../../data/students";
import { DEPARTMENTS, findDepartment } from "../../data/departments";
import { findRole } from "../../data/roles";
import { sql } from "../../lib/db";
import { ensureSchema } from "../../lib/schema";
import { notifyDiscord } from "../../lib/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Counts = Record<string, number>;

async function loadCounts(): Promise<Counts> {
  const rows = await sql`
    SELECT department_id, COUNT(*)::int AS n
    FROM exhibition_choices
    GROUP BY department_id
  `;
  const counts: Counts = {};
  for (const d of DEPARTMENTS) counts[d.id] = 0;
  for (const r of rows as { department_id: string; n: number }[]) {
    counts[r.department_id] = r.n;
  }
  return counts;
}

export async function GET(request: NextRequest) {
  await ensureSchema();
  const id = request.nextUrl.searchParams.get("id")?.trim();

  const counts = await loadCounts();

  let current: string | null = null;
  if (id) {
    const rows = await sql`
      SELECT department_id FROM exhibition_choices WHERE student_id = ${id} LIMIT 1
    `;
    current = (rows[0] as { department_id: string } | undefined)?.department_id ?? null;
  }

  return Response.json({ counts, current });
}

type PickPayload = {
  studentId?: string;
  departmentId?: string;
};

export async function POST(request: NextRequest) {
  let body: PickPayload;
  try {
    body = (await request.json()) as PickPayload;
  } catch {
    return Response.json({ ok: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const student = body.studentId ? findStudent(body.studentId) : undefined;
  if (!student) {
    return Response.json({ ok: false, error: "ไม่พบนักเรียน" }, { status: 400 });
  }

  // คนที่มีตำแหน่งกำหนดไว้แล้ว ไม่ต้อง/ห้ามเลือกฝ่าย
  const role = findRole(student.studentId);
  if (role) {
    return Response.json(
      { ok: false, error: `คุณมีตำแหน่ง ${role.title} อยู่แล้ว ไม่ต้องเลือกฝ่าย` },
      { status: 403 },
    );
  }

  const dept = body.departmentId ? findDepartment(body.departmentId) : undefined;
  if (!dept) {
    return Response.json({ ok: false, error: "ไม่พบฝ่ายที่เลือก" }, { status: 400 });
  }

  try {
    await ensureSchema();
  } catch (err) {
    console.error("[exhibition] schema init failed:", err);
    return Response.json(
      { ok: false, error: "ไม่สามารถเชื่อมต่อฐานข้อมูล" },
      { status: 500 },
    );
  }

  // กันเลือกซ้ำ — หากเลือกฝ่ายไปแล้ว ห้ามเปลี่ยน
  const existingRows = await sql`
    SELECT department_id FROM exhibition_choices WHERE student_id = ${student.studentId} LIMIT 1
  `;
  const existing = (existingRows[0] as { department_id: string } | undefined)?.department_id;
  if (existing) {
    const counts = await loadCounts();
    if (existing === dept.id) {
      return Response.json({ ok: true, departmentId: existing, counts });
    }
    return Response.json(
      { ok: false, error: "คุณเลือกฝ่ายไปแล้ว ไม่สามารถเปลี่ยนได้", counts, current: existing },
      { status: 409 },
    );
  }

  const fullNameTh = `${student.firstNameTh} ${student.lastNameTh}`.trim();

  // แทรกเฉพาะเมื่อจำนวนคนในฝ่ายยังไม่เต็ม — ป้องกัน race condition ในคำสั่งเดียว
  let inserted: unknown[];
  try {
    inserted = await sql`
      INSERT INTO exhibition_choices (
        student_id, student_no, nickname_th, full_name_th, department_id
      )
      SELECT ${student.studentId}, ${student.no}, ${student.nicknameTh}, ${fullNameTh}, ${dept.id}
      WHERE (
        SELECT COUNT(*) FROM exhibition_choices WHERE department_id = ${dept.id}
      ) < ${dept.capacity}
      RETURNING id
    `;
  } catch (err) {
    console.error("[exhibition] insert failed:", err);
    return Response.json({ ok: false, error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }

  const counts = await loadCounts();

  if (inserted.length === 0) {
    // ฝ่ายเต็มพอดีในจังหวะที่กดเลือก
    return Response.json(
      { ok: false, error: `${dept.nameTh} เต็มแล้ว ลองเลือกฝ่ายอื่น`, counts },
      { status: 409 },
    );
  }

  after(() =>
    notifyDiscord({
      title: "🎪 เลือกฝ่ายจัดนิทรรศการ",
      description: `**${student.nicknameTh}** (${fullNameTh})`,
      color: 0x7c3aed,
      fields: [
        { name: "ฝ่าย", value: `${dept.emoji} ${dept.nameTh}`, inline: true },
        { name: "จำนวนในฝ่าย", value: `${counts[dept.id]}/${dept.capacity}`, inline: true },
      ],
    }),
  );

  return Response.json({ ok: true, departmentId: dept.id, counts });
}
