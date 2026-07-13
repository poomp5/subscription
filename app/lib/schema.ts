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

      await sql`
        CREATE TABLE IF NOT EXISTS penalties (
          id          BIGSERIAL PRIMARY KEY,
          student_id  TEXT NOT NULL,
          count       INTEGER NOT NULL DEFAULT 0,
          reasons     JSONB NOT NULL DEFAULT '[]',
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (student_id)
        )
      `;
      // migrate existing rows that were created before the reasons column was added
      await sql`
        ALTER TABLE penalties ADD COLUMN IF NOT EXISTS reasons JSONB NOT NULL DEFAULT '[]'
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS penalty_submissions (
          id          BIGSERIAL PRIMARY KEY,
          ref         TEXT NOT NULL UNIQUE,
          student_id  TEXT NOT NULL,
          nickname_th TEXT NOT NULL,
          full_name_th TEXT NOT NULL,
          amount      NUMERIC(10,2) NOT NULL,
          penalty_count INTEGER NOT NULL,
          slip_url    TEXT,
          slip_key    TEXT,
          status      TEXT NOT NULL DEFAULT 'PENDING',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          reviewed_at TIMESTAMPTZ
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS pen_sub_student_idx ON penalty_submissions (student_id)`;
      await sql`CREATE INDEX IF NOT EXISTS pen_sub_status_idx  ON penalty_submissions (status)`;

      // การเลือกฝ่ายจัดนิทรรศการ — นักเรียนหนึ่งคนเลือกได้หนึ่งฝ่าย
      await sql`
        CREATE TABLE IF NOT EXISTS exhibition_choices (
          id            BIGSERIAL PRIMARY KEY,
          student_id    TEXT NOT NULL UNIQUE,
          student_no    INTEGER NOT NULL,
          nickname_th   TEXT NOT NULL,
          full_name_th  TEXT NOT NULL,
          department_id TEXT NOT NULL,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS exh_dept_idx ON exhibition_choices (department_id)`;

      // ข้อจำกัดด้านอาหาร / อาการแพ้ — นักเรียนหนึ่งคนหนึ่งแถว
      // restrictions = รายการ id ที่เลือก (ว่าง = ไม่แพ้/ไม่มีข้อจำกัด)
      await sql`
        CREATE TABLE IF NOT EXISTS dietary_choices (
          id            BIGSERIAL PRIMARY KEY,
          student_id    TEXT NOT NULL UNIQUE,
          student_no    INTEGER NOT NULL,
          nickname_th   TEXT NOT NULL,
          full_name_th  TEXT NOT NULL,
          restrictions  JSONB NOT NULL DEFAULT '[]',
          other_note    TEXT NOT NULL DEFAULT '',
          seafood_items JSONB NOT NULL DEFAULT '[]',
          seafood_other TEXT NOT NULL DEFAULT '',
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      // migrate existing rows that were created before these columns were added
      // (ADD COLUMN IF NOT EXISTS + DEFAULT จึงไม่กระทบข้อมูลเดิมที่กรอกไว้แล้ว)
      await sql`
        ALTER TABLE dietary_choices ADD COLUMN IF NOT EXISTS other_note TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE dietary_choices ADD COLUMN IF NOT EXISTS seafood_items JSONB NOT NULL DEFAULT '[]'
      `;
      await sql`
        ALTER TABLE dietary_choices ADD COLUMN IF NOT EXISTS seafood_other TEXT NOT NULL DEFAULT ''
      `;

      // Poll เลือกอาหาร — นักเรียนหนึ่งคนเลือกได้หนึ่งเมนู พร้อมคอมเมนต์เพิ่มเติม
      await sql`
        CREATE TABLE IF NOT EXISTS food_choices (
          id            BIGSERIAL PRIMARY KEY,
          student_id    TEXT NOT NULL UNIQUE,
          student_no    INTEGER NOT NULL,
          nickname_th   TEXT NOT NULL,
          full_name_th  TEXT NOT NULL,
          food_id       TEXT NOT NULL,
          comment       TEXT NOT NULL DEFAULT '',
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS food_choices_food_idx ON food_choices (food_id)`;
      await sql`
        ALTER TABLE food_choices ADD COLUMN IF NOT EXISTS comment TEXT NOT NULL DEFAULT ''
      `;

      // ลิงก์ Portfolio สำหรับ tcasfolio — นักเรียนหนึ่งคนหนึ่งลิงก์ แก้ไขซ้ำได้
      await sql`
        CREATE TABLE IF NOT EXISTS tcasfolio_links (
          id            BIGSERIAL PRIMARY KEY,
          student_id    TEXT NOT NULL UNIQUE,
          student_no    INTEGER NOT NULL,
          nickname_th   TEXT NOT NULL,
          full_name_th  TEXT NOT NULL,
          portfolio_url TEXT NOT NULL DEFAULT '',
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS tcasfolio_links_updated_idx ON tcasfolio_links (updated_at DESC)`;
      await sql`
        ALTER TABLE tcasfolio_links ADD COLUMN IF NOT EXISTS portfolio_url TEXT NOT NULL DEFAULT ''
      `;
    })().catch((err) => {
      initialized = null;
      throw err;
    });
  }
  return initialized;
}
