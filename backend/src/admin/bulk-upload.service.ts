import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Batch } from '../entities/batch.entity';
import { AuditLog } from '../entities/audit-log.entity';

interface ExcelRow {
  USN: string;
  Email: string;
  'Full Name'?: string;
  Department?: string;
  Phone?: string;
  CGPA?: number;
  '10th %'?: number;
  '12th %'?: number;
  Backlogs?: number;
  Gender?: string;
  Category?: string;
}

export interface BulkResult {
  total: number;
  created: number;
  skipped: number;
  errors: Array<{ row: number; usn: string; reason: string }>;
  credentials: Array<{ usn: string; email: string; temporaryPassword: string }>;
}

@Injectable()
export class BulkUploadService {
  private readonly logger = new Logger(BulkUploadService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Batch) private readonly batchRepo: Repository<Batch>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * High-performance bulk upload — handles 300+ students in seconds.
   *
   * Optimizations:
   * 1. Pre-fetch ALL existing USNs and emails in 2 bulk queries (not N+1)
   * 2. Pre-hash a single password per batch (deterministic: DEPT+BATCH)
   * 3. Batch INSERT via raw SQL with chunking (50 rows per INSERT)
   * 4. Single batch-count update at end
   * 5. Uses a DB transaction for atomicity
   */
  async processExcel(buffer: Buffer, actorId: string, selectedDepartment?: string, selectedBatch?: string): Promise<BulkResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new BadRequestException('Empty Excel file');

    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    if (!rows.length) throw new BadRequestException('No data rows found');
    if (rows.length > 500) throw new BadRequestException('Maximum 500 students per upload');

    // Validate required columns — only USN and Email are mandatory
    const requiredCols = ['USN', 'Email'];
    const headers = Object.keys(rows[0]);
    const missing = requiredCols.filter((col) => !headers.includes(col));
    if (missing.length) {
      throw new BadRequestException(`Missing required columns: ${missing.join(', ')}`);
    }

    const dept = selectedDepartment ? selectedDepartment.trim().toUpperCase().replace(/\s+/g, '') : null;
    const batch = selectedBatch ? selectedBatch.trim() : String(new Date().getFullYear());

    // ── Step 1: Pre-fetch batch entity ──
    let matchedBatch: Batch | null = null;
    if (dept && batch) {
      matchedBatch = await this.batchRepo.findOne({
        where: { department: dept, year: Number(batch) },
      });
    }

    // ── Step 2: Pre-hash password ONCE (all students in same dept+batch get the same password) ──
    const rawPassword = `${dept || 'STUDENT'}${batch}`;
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // ── Step 3: Collect all USNs and emails from the Excel to do BULK duplicate check ──
    const excelUsns: string[] = [];
    const excelEmails: string[] = [];
    const cleanedRows: Array<{
      rowNum: number;
      usn: string;
      email: string;
      fullName: string;
      department: string;
      phone: string | null;
      cgpa: number | null;
      tenthPercent: number | null;
      twelfthPercent: number | null;
      backlogs: number;
      gender: string | null;
      category: string | null;
    }> = [];

    const result: BulkResult = {
      total: rows.length,
      created: 0,
      skipped: 0,
      errors: [],
      credentials: [],
    };

    // Parse and validate all rows first (no DB calls)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const usn = String(row.USN || '').trim().toUpperCase();
      const email = String(row.Email || '').trim().toLowerCase();

      if (!usn || !email) {
        result.errors.push({ row: rowNum, usn, reason: 'Missing USN or Email' });
        result.skipped++;
        continue;
      }

      // Check for duplicates within the file itself
      if (excelUsns.includes(usn)) {
        result.errors.push({ row: rowNum, usn, reason: 'Duplicate USN in file' });
        result.skipped++;
        continue;
      }
      if (excelEmails.includes(email)) {
        result.errors.push({ row: rowNum, usn, reason: 'Duplicate Email in file' });
        result.skipped++;
        continue;
      }

      excelUsns.push(usn);
      excelEmails.push(email);

      const fullName = row['Full Name'] ? String(row['Full Name']).trim() : 'Student';
      const department = dept || (row.Department ? String(row.Department).trim().toUpperCase() : 'UNASSIGNED');

      cleanedRows.push({
        rowNum,
        usn,
        email,
        fullName,
        department,
        phone: row.Phone ? String(row.Phone) : null,
        cgpa: row.CGPA != null ? Number(row.CGPA) : null,
        tenthPercent: row['10th %'] != null ? Number(row['10th %']) : null,
        twelfthPercent: row['12th %'] != null ? Number(row['12th %']) : null,
        backlogs: row.Backlogs ? Number(row.Backlogs) : 0,
        gender: row.Gender ? String(row.Gender) : null,
        category: row.Category ? String(row.Category) : null,
      });
    }

    if (cleanedRows.length === 0) {
      return result;
    }

    // ── Step 4: BULK fetch existing USNs and emails from DB (2 queries instead of 2N) ──
    const existingUsns = new Set<string>();
    const existingEmails = new Set<string>();

    if (excelUsns.length > 0) {
      const existingStudents: Array<{ usn: string }> = await this.studentRepo
        .createQueryBuilder('s')
        .select('s.usn', 'usn')
        .where('s.usn IN (:...usns)', { usns: excelUsns })
        .getRawMany();
      existingStudents.forEach((s) => existingUsns.add(s.usn));
    }

    if (excelEmails.length > 0) {
      const existingUsers: Array<{ email: string }> = await this.userRepo
        .createQueryBuilder('u')
        .select('u.email', 'email')
        .where('u.email IN (:...emails)', { emails: excelEmails })
        .getRawMany();
      existingUsers.forEach((u) => existingEmails.add(u.email));
    }

    // Filter out rows that already exist in DB
    const validRows = cleanedRows.filter((row) => {
      if (existingUsns.has(row.usn)) {
        result.errors.push({ row: row.rowNum, usn: row.usn, reason: 'USN already exists' });
        result.skipped++;
        return false;
      }
      if (existingEmails.has(row.email)) {
        result.errors.push({ row: row.rowNum, usn: row.usn, reason: 'Email already exists' });
        result.skipped++;
        return false;
      }
      return true;
    });

    if (validRows.length === 0) {
      return result;
    }

    // ── Step 5: BATCH INSERT using a transaction ──
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const CHUNK_SIZE = 50;

      for (let chunkStart = 0; chunkStart < validRows.length; chunkStart += CHUNK_SIZE) {
        const chunk = validRows.slice(chunkStart, chunkStart + CHUNK_SIZE);

        // Build bulk user INSERT
        const userValues: string[] = [];
        const userIds: string[] = [];

        for (const row of chunk) {
          const userId = crypto.randomUUID();
          userIds.push(userId);
          // Escape single quotes in email
          const safeEmail = row.email.replace(/'/g, "''");
          userValues.push(
            `('${userId}', '${safeEmail}', '${passwordHash}', 'student', true, true)`,
          );
        }

        await queryRunner.query(
          `INSERT INTO users (id, email, password_hash, role, must_change_password, is_active) VALUES ${userValues.join(', ')}`,
        );

        // Build bulk student INSERT
        const studentValues: string[] = [];

        for (let j = 0; j < chunk.length; j++) {
          const row = chunk[j];
          const userId = userIds[j];
          const studentId = crypto.randomUUID();
          const safeUsn = row.usn.replace(/'/g, "''");
          const safeName = row.fullName.replace(/'/g, "''");
          const safeDept = row.department.replace(/'/g, "''");
          const safePhone = row.phone ? `'${row.phone.replace(/'/g, "''")}'` : 'NULL';
          const safeCgpa = row.cgpa != null ? row.cgpa : 'NULL';
          const safeTenth = row.tenthPercent != null ? row.tenthPercent : 'NULL';
          const safeTwelfth = row.twelfthPercent != null ? row.twelfthPercent : 'NULL';
          const safeGender = row.gender ? `'${row.gender.replace(/'/g, "''")}'` : 'NULL';
          const safeCategory = row.category ? `'${row.category.replace(/'/g, "''")}'` : 'NULL';
          const safeBatchId = matchedBatch ? `'${matchedBatch.id}'` : 'NULL';
          const safeSemester = matchedBatch?.currentSemester ?? 'NULL';

          studentValues.push(
            `('${studentId}', '${userId}', '${safeUsn}', '${safeName}', '${safeDept}', ` +
            `${safeBatchId}, ${safeSemester}, ${safePhone}, ${safeCgpa}, ` +
            `${safeTenth}, ${safeTwelfth}, ${row.backlogs}, ` +
            `${safeGender}, ${safeCategory}, false, 'none', '{}')`,
          );

          result.credentials.push({
            usn: row.usn,
            email: row.email,
            temporaryPassword: rawPassword,
          });
        }

        await queryRunner.query(
          `INSERT INTO students (id, user_id, usn, full_name, department, ` +
          `batch_id, semester, phone, cgpa, tenth_percent, twelfth_percent, backlogs, ` +
          `gender, category, profile_complete, placement_status, profile_data) VALUES ${studentValues.join(', ')}`,
        );

        result.created += chunk.length;
      }

      // ── Step 6: Update batch student count in ONE query ──
      if (matchedBatch) {
        await queryRunner.query(
          `UPDATE batches SET student_count = (SELECT COUNT(*) FROM students WHERE batch_id = $1) WHERE id = $1`,
          [matchedBatch.id],
        );
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Bulk upload complete: ${result.created} students created in ${validRows.length} rows`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Bulk upload transaction failed, rolling back', err);
      throw new BadRequestException(
        `Bulk insert failed: ${err instanceof Error ? err.message : 'Unknown error'}. No records were created.`,
      );
    } finally {
      await queryRunner.release();
    }

    // Audit log (outside transaction — non-critical)
    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'BULK_UPLOAD_STUDENTS',
      entityType: 'student',
      entityId: '00000000-0000-0000-0000-000000000000',
      newValue: {
        total: result.total,
        created: result.created,
        skipped: result.skipped,
        errorCount: result.errors.length,
      } as unknown as Record<string, unknown>,
    });

    return result;
  }

  generateTemplate(): Buffer {
    const templateData = [
      {
        USN: '4MT22CS001',
        Email: 'john.doe@mitm.ac.in',
        'Full Name (Optional)': 'John Doe',
        'Department (Optional)': 'CSE',
        'Phone (Optional)': '9876543210',
        'CGPA (Optional)': 8.5,
        '10th % (Optional)': 92.4,
        '12th % (Optional)': 88.6,
        'Backlogs (Optional)': 0,
        'Gender (Optional)': 'Male',
        'Category (Optional)': 'General',
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 14 }, { wch: 25 }, { wch: 30 }, { wch: 12 },
      { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}
