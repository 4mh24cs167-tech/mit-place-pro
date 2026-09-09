-- Add register_number column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS register_number VARCHAR(20) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_register_number ON students(register_number);

-- Backfill existing students with sequential register numbers
-- Format: UM-XXXXXX (UdyogaMITra prefix + 6-digit sequential number)
DO $$
DECLARE
  rec RECORD;
  counter INTEGER := 1;
BEGIN
  FOR rec IN
    SELECT id FROM students
    WHERE register_number IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE students
    SET register_number = 'UM-' || LPAD(counter::TEXT, 6, '0')
    WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;
