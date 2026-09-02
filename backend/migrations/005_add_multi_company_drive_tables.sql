-- ============================================================
-- Migration 005: Add multi-company drive tables & columns
-- Date: 2026-09-03
-- Description: Creates drive_company_jobs, drive_attendances tables
--   and adds type, job_ids columns to drives table.
--   All statements are idempotent (safe to re-run).
-- ============================================================

-- ── Add 'type' column to drives (if missing) ────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drives' AND column_name = 'type'
  ) THEN
    ALTER TABLE drives ADD COLUMN type VARCHAR(20) DEFAULT 'single';
  END IF;
END $$;

-- ── Add 'job_ids' column to drives (if missing) ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'drives' AND column_name = 'job_ids'
  ) THEN
    ALTER TABLE drives ADD COLUMN job_ids JSONB DEFAULT '[]';
  END IF;
END $$;

-- ── DriveCompanyJob junction table ───────────────
CREATE TABLE IF NOT EXISTS drive_company_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dcj_drive_id ON drive_company_jobs (drive_id);
CREATE INDEX IF NOT EXISTS idx_dcj_company_id ON drive_company_jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_dcj_job_id ON drive_company_jobs (job_id);
CREATE INDEX IF NOT EXISTS idx_dcj_drive_company ON drive_company_jobs (drive_id, company_id);

-- ── DriveAttendance table ────────────────────────
CREATE TABLE IF NOT EXISTS drive_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_da_drive_student_job UNIQUE (drive_id, student_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_da_drive_id ON drive_attendances (drive_id);
CREATE INDEX IF NOT EXISTS idx_da_student_id ON drive_attendances (student_id);
CREATE INDEX IF NOT EXISTS idx_da_job_id ON drive_attendances (job_id);
CREATE INDEX IF NOT EXISTS idx_da_company_id ON drive_attendances (company_id);
