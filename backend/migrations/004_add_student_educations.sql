-- ============================================================
-- Migration 004: Add student_educations table
-- Date: 2026-09-02
-- Description: Creates student_educations table if not exists.
-- ============================================================

-- Check if qualification_type enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qualificationtype_enum') THEN
    CREATE TYPE qualificationtype_enum AS ENUM ('SSLC', 'PUC', 'DIPLOMA', 'ITI', 'UG', 'PG');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS student_educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  qualification_type VARCHAR(20) NOT NULL,
  course_name VARCHAR(150),
  college_name VARCHAR(200),
  university VARCHAR(200),
  board VARCHAR(100),
  stream VARCHAR(50),
  specialization VARCHAR(150),
  registration_number VARCHAR(50),
  start_year SMALLINT,
  passing_year SMALLINT,
  percentage DECIMAL(5,2),
  cgpa DECIMAL(4,2),
  document_drive_url VARCHAR(500),
  document_file_name VARCHAR(255),
  document_file_type VARCHAR(50),
  document_file_data BYTEA,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, qualification_type)
);

CREATE INDEX IF NOT EXISTS idx_student_educations_student ON student_educations (student_id);
