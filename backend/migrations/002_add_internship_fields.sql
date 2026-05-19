-- Migration: Add internship support fields to jobs table
-- This adds jobType, isUnpaid, internshipDuration, and stipendAmount columns
-- to support internship drives (including unpaid ones)

-- Add job_type column (placement or internship)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(20) DEFAULT 'placement' NOT NULL;

-- Add is_unpaid flag
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_unpaid BOOLEAN DEFAULT FALSE NOT NULL;

-- Add internship duration (e.g. "3 months", "6 months")
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS internship_duration VARCHAR(50);

-- Add stipend amount (monthly, in INR)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS stipend_amount DECIMAL(8, 2);

-- Index on job_type for filtering
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs (job_type);
