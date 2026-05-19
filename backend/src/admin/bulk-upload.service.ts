import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Batch) private readonly batchRepo: Repository<Batch>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async processExcel(buffer: Buffer, actorId: string, selectedDepartment?: string, selectedBatch?: string): Promise<BulkResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new BadRequestException('Empty Excel file');

    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    if (!rows.length) throw new BadRequestException('No data rows found');

    // Validate required columns — only USN and Email are mandatory now
    const requiredCols = ['USN', 'Email'];
    const headers = Object.keys(rows[0]);
    const missing = requiredCols.filter((col) => !headers.includes(col));
    if (missing.length) {
      throw new BadRequestException(`Missing required columns: ${missing.join(', ')}`);
    }

    // Use selected department/batch or fallback to defaults
    const dept = selectedDepartment ? selectedDepartment.trim().toUpperCase().replace(/\s+/g, '') : null;
    const batch = selectedBatch ? selectedBatch.trim() : String(new Date().getFullYear());

    // Look up the matching Batch entity so we can assign batchId to students
    let matchedBatch: Batch | null = null;
    if (dept && batch) {
      matchedBatch = await this.batchRepo.findOne({
        where: { department: dept, year: Number(batch) },
      });
    }

    const result: BulkResult = {
      total: rows.length,
      created: 0,
      skipped: 0,
      errors: [],
      credentials: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (header = 1)

      try {
        const usn = String(row.USN).trim().toUpperCase();
        const email = String(row.Email).trim().toLowerCase();
        const fullName = row['Full Name'] ? String(row['Full Name']).trim() : 'Student';
        // Use the admin-selected department, fallback to row Department, then 'Unassigned'
        const department = dept || (row.Department ? String(row.Department).trim().toUpperCase() : 'UNASSIGNED');

        if (!usn || !email) {
          result.errors.push({ row: rowNum, usn, reason: 'Missing USN or Email' });
          result.skipped++;
          continue;
        }

        // Check duplicate USN
        const existingStudent = await this.studentRepo.findOne({ where: { usn } });
        if (existingStudent) {
          result.errors.push({ row: rowNum, usn, reason: 'USN already exists' });
          result.skipped++;
          continue;
        }

        // Check duplicate email
        const existingUser = await this.userRepo.findOne({ where: { email } });
        if (existingUser) {
          result.errors.push({ row: rowNum, usn, reason: 'Email already exists' });
          result.skipped++;
          continue;
        }

        // Generate deterministic password: DEPARTMENT + BATCH (e.g. CSE2026)
        const rawPassword = `${department}${batch}`;
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(rawPassword, salt);

        // Create user
        const user = await this.userRepo.save({
          email,
          passwordHash: hash,
          role: UserRole.STUDENT,
          mustChangePassword: true,
        });

        // Create student — profileComplete is false so student must complete their profile
        await this.studentRepo.save({
          userId: user.id,
          usn,
          fullName,
          department,
          batchId: matchedBatch?.id || null,
          semester: matchedBatch?.currentSemester || null,
          phone: row.Phone ? String(row.Phone) : null,
          cgpa: row.CGPA ? Number(row.CGPA) : null,
          tenthPercent: row['10th %'] ? Number(row['10th %']) : null,
          twelfthPercent: row['12th %'] ? Number(row['12th %']) : null,
          backlogs: row.Backlogs ? Number(row.Backlogs) : 0,
          gender: row.Gender ? String(row.Gender) : null,
          category: row.Category ? String(row.Category) : null,
          profileComplete: false,
        });

        // Update batch student count
        if (matchedBatch) {
          await this.batchRepo.increment({ id: matchedBatch.id }, 'studentCount', 1);
        }

        result.created++;
        result.credentials.push({ usn, email, temporaryPassword: rawPassword });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push({ row: rowNum, usn: String(row.USN), reason: errorMessage });
        result.skipped++;
      }
    }

    // Audit log
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
