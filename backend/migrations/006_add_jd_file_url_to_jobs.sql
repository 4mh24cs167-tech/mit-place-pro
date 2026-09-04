-- Migration: Add jd_file_url column to jobs table
-- Idempotent: uses IF NOT EXISTS pattern

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'jd_file_url'
  ) THEN
    ALTER TABLE jobs ADD COLUMN jd_file_url VARCHAR(500) DEFAULT NULL;
  END IF;
END $$;
