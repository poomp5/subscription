import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

declare global {
  // eslint-disable-next-line no-var
  var __neon_sql__: NeonQueryFunction<false, false> | undefined;
}

export function getSql(): NeonQueryFunction<false, false> {
  if (globalThis.__neon_sql__) return globalThis.__neon_sql__;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL ยังไม่ได้ตั้งค่าใน .env.local");
  }
  globalThis.__neon_sql__ = neon(url);
  return globalThis.__neon_sql__;
}

// ใช้แบบ tagged template ได้: const rows = await sql`SELECT ...`
export const sql: NeonQueryFunction<false, false> = ((
  ...args: Parameters<NeonQueryFunction<false, false>>
) => {
  return getSql()(...args);
}) as NeonQueryFunction<false, false>;

export type SubmissionRow = {
  id: number;
  ref: string;
  student_id: string;
  student_no: number;
  nickname_th: string;
  nickname_en: string;
  full_name_th: string;
  full_name_en: string;
  plan_id: string;
  plan_name_th: string;
  amount: number;
  note: string | null;
  slip_url: string | null;
  slip_key: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  reviewed_at: string | null;
};
