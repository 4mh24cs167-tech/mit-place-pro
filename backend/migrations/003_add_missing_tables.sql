-- ============================================================
-- Migration 003: Add missing tables & columns
-- Date: 2026-09-02
-- Description: Creates otp_records, email_logs tables and adds
--   logo_s3_key column to companies table.
--   All statements are idempotent (safe to re-run).
-- ============================================================

-- ── OTP Records table ────────────────────────────
CREATE TABLE IF NOT EXISTS otp_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  failed_attempts SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_records (email);

-- ── Email Logs table ─────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type VARCHAR(50) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  recipients JSONB DEFAULT '[]',
  recipient_count INT DEFAULT 1,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs (email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at);

-- ── Add logo_s3_key to companies (if missing) ────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'logo_s3_key'
  ) THEN
    ALTER TABLE companies ADD COLUMN logo_s3_key VARCHAR(500);
  END IF;
END $$;
