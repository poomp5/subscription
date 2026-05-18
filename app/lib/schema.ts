import { sql } from "./db";

let initialized: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS submissions (
          id            BIGSERIAL PRIMARY KEY,
          ref           TEXT NOT NULL UNIQUE,
          student_id    TEXT NOT NULL,
          student_no    INTEGER NOT NULL,
          nickname_th   TEXT NOT NULL,
          nickname_en   TEXT NOT NULL,
          full_name_th  TEXT NOT NULL,
          full_name_en  TEXT NOT NULL,
          plan_id       TEXT NOT NULL,
          plan_name_th  TEXT NOT NULL,
          amount        NUMERIC(10,2) NOT NULL,
          note          TEXT,
          slip_url      TEXT,
          slip_key      TEXT,
          status        TEXT NOT NULL DEFAULT 'PENDING',
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          reviewed_at   TIMESTAMPTZ
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status)`;
      await sql`CREATE INDEX IF NOT EXISTS submissions_created_idx ON submissions (created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS submissions_student_idx ON submissions (student_id)`;
    })().catch((err) => {
      initialized = null;
      throw err;
    });
  }
  return initialized;
}
