-- ============================================================
-- Migration 001: Add Performance Indexes for 50K-user scale
-- Date: 2026-05-19
-- Description: Adds indexes on all frequently queried columns
-- to eliminate full table scans. All CREATE INDEX IF NOT EXISTS
-- ensures safe re-runs (idempotent).
-- ============================================================

-- ── Users ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── Students ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_department ON students (department);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON students (batch_id);
CREATE INDEX IF NOT EXISTS idx_students_placement_status ON students (placement_status);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students (user_id);
CREATE INDEX IF NOT EXISTS idx_students_dept_profile ON students (department, profile_complete);

-- ── Jobs ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);

-- ── Applications ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_admin_approved ON applications (admin_approved);
CREATE INDEX IF NOT EXISTS idx_applications_job_approved ON applications (job_id, admin_approved);

-- ── Drives ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drives_status ON drives (status);
CREATE INDEX IF NOT EXISTS idx_drives_job_id ON drives (job_id);
CREATE INDEX IF NOT EXISTS idx_drives_created_at ON drives (created_at DESC);

-- ── Drive Registrations ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_drive_reg_drive_id ON drive_registrations (drive_id);
CREATE INDEX IF NOT EXISTS idx_drive_reg_student_id ON drive_registrations (student_id);
CREATE INDEX IF NOT EXISTS idx_drive_reg_drive_status ON drive_registrations (drive_id, status);

-- ── Drive Slots ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drive_slots_drive_id ON drive_slots (drive_id);

-- ── Audit Logs (for recent activity) ─────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ── Notifications ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
