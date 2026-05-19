import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Drive, DriveRegistration, DriveSlot } from '../entities/drive.entity';
import { Job } from '../entities/job.entity';
import { Student } from '../entities/student.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);

  constructor(
    @InjectRepository(Drive) private readonly driveRepo: Repository<Drive>,
    @InjectRepository(DriveRegistration) private readonly regRepo: Repository<DriveRegistration>,
    @InjectRepository(DriveSlot) private readonly slotRepo: Repository<DriveSlot>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
  ) {}

  // ─── Create a Drive ─────────────────────────────
  async createDrive(data: {
    title: string;
    type: 'single' | 'multiple';
    jobId: string;
    description?: string;
    driveDate?: string;
    departments?: string[];
  }, actorId: string) {
    const job = await this.jobRepo.findOne({ where: { id: data.jobId }, relations: ['company'] });
    if (!job) throw new NotFoundException('Job not found');

    const drive = await this.driveRepo.save({
      title: data.title || `${job.company?.name} - ${job.title}`,
      type: data.type,
      jobId: data.jobId,
      status: 'open',
      description: data.description || null,
      driveDate: data.driveDate || null,
      departments: data.departments || job.allowedDepartments || [],
    });

    // Auto-register eligible students (based on departments + min CGPA)
    const studentQuery = this.studentRepo.createQueryBuilder('s')
      .where('s.profile_complete = true');

    if (drive.departments && drive.departments.length > 0) {
      studentQuery.andWhere('s.department IN (:...depts)', { depts: drive.departments });
    }
    if (job.minCgpa) {
      studentQuery.andWhere('s.cgpa >= :minCgpa', { minCgpa: job.minCgpa });
    }

    const eligibleStudents = await studentQuery.getMany();

    const registrations = eligibleStudents.map((s) => ({
      driveId: drive.id,
      studentId: s.id,
      status: 'pending' as const,
    }));

    if (registrations.length > 0) {
      await this.regRepo.save(registrations);
    }

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'CREATE_DRIVE',
      entityType: 'drive',
      entityId: drive.id,
      newValue: { title: drive.title, type: drive.type, eligible: registrations.length } as unknown as Record<string, unknown>,
    });

    return {
      ...drive,
      eligibleCount: registrations.length,
    };
  }

  // ─── List Drives (single-query, no N+1) ─────────
  async listDrives() {
    const results = await this.driveRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .loadRelationCountAndMap('d.totalRegistrations', 'd.registrations')
      .loadRelationCountAndMap('d.slotsCount', 'd.slots')
      .orderBy('d.createdAt', 'DESC')
      .getMany();

    // Batch-load registration status counts in a single query
    const driveIds = results.map((d) => d.id);
    let statusCounts: Array<{ drive_id: string; status: string; cnt: string }> = [];

    if (driveIds.length > 0) {
      statusCounts = await this.regRepo
        .createQueryBuilder('r')
        .select('r.drive_id', 'drive_id')
        .addSelect('r.status', 'status')
        .addSelect('COUNT(*)::int', 'cnt')
        .where('r.drive_id IN (:...driveIds)', { driveIds })
        .groupBy('r.drive_id')
        .addGroupBy('r.status')
        .getRawMany();
    }

    const countMap = new Map<string, { pending: number; approved: number; rejected: number }>();
    for (const row of statusCounts) {
      if (!countMap.has(row.drive_id)) {
        countMap.set(row.drive_id, { pending: 0, approved: 0, rejected: 0 });
      }
      const entry = countMap.get(row.drive_id)!;
      if (row.status === 'pending') entry.pending = Number(row.cnt);
      else if (row.status === 'approved') entry.approved = Number(row.cnt);
      else if (row.status === 'rejected') entry.rejected = Number(row.cnt);
    }

    return results.map((d) => {
      const counts = countMap.get(d.id) || { pending: 0, approved: 0, rejected: 0 };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalRegs = (d as any).totalRegistrations || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slotsCount = (d as any).slotsCount || 0;
      return {
        id: d.id,
        title: d.title,
        type: d.type,
        status: d.status,
        driveDate: d.driveDate,
        departments: d.departments,
        company: d.job?.company?.name || 'Unknown',
        jobTitle: d.job?.title || 'Unknown',
        jobId: d.jobId,
        totalRegistrations: totalRegs,
        approved: counts.approved,
        rejected: counts.rejected,
        pending: counts.pending,
        slotsCount,
        createdAt: d.createdAt,
      };
    });
  }

  // ─── Get Drive Detail with Registrations ────────
  async getDriveDetail(driveId: string) {
    const drive = await this.driveRepo.findOne({
      where: { id: driveId },
      relations: ['job', 'job.company', 'slots'],
    });
    if (!drive) throw new NotFoundException('Drive not found');

    const registrations = await this.regRepo.find({
      where: { driveId },
    });

    // Get student details for registrations
    const studentIds = registrations.map((r) => r.studentId);
    let students: Student[] = [];
    if (studentIds.length > 0) {
      students = await this.studentRepo.find({
        where: { id: In(studentIds) },
        relations: ['user'],
      });
    }

    const studentMap = new Map(students.map((s) => [s.id, s]));

    const enrichedRegs = registrations.map((r) => {
      const student = studentMap.get(r.studentId);
      return {
        id: r.id,
        studentId: r.studentId,
        status: r.status,
        rejectionReason: r.rejectionReason,
        student: student ? {
          fullName: student.fullName,
          usn: student.usn,
          department: student.department,
          cgpa: student.cgpa,
          email: student.user?.email,
          semester: student.semester,
        } : null,
      };
    });

    return {
      id: drive.id,
      title: drive.title,
      type: drive.type,
      status: drive.status,
      driveDate: drive.driveDate,
      departments: drive.departments,
      description: drive.description,
      company: drive.job?.company?.name,
      jobTitle: drive.job?.title,
      jobId: drive.jobId,
      registrations: enrichedRegs,
      slots: drive.slots || [],
      createdAt: drive.createdAt,
    };
  }

  // ─── Reject students ───────────────────────────
  async rejectStudents(driveId: string, studentIds: string[], reason: string | null, actorId: string) {
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    const updated = await this.regRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'rejected', rejectionReason: reason || 'Rejected by admin' })
      .where('drive_id = :driveId AND student_id IN (:...studentIds)', { driveId, studentIds })
      .execute();

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'REJECT_DRIVE_STUDENTS',
      entityType: 'drive',
      entityId: driveId,
      newValue: { studentIds, reason, count: updated.affected } as unknown as Record<string, unknown>,
    });

    return { rejected: updated.affected || 0 };
  }

  // ─── Approve all remaining (non-rejected) ──────
  async approveAllPending(driveId: string, actorId: string) {
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    const updated = await this.regRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'approved' })
      .where('drive_id = :driveId AND status = :status', { driveId, status: 'pending' })
      .execute();

    // Update drive status to screening
    drive.status = 'screening';
    await this.driveRepo.save(drive);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'APPROVE_ALL_DRIVE',
      entityType: 'drive',
      entityId: driveId,
      newValue: { approved: updated.affected } as unknown as Record<string, unknown>,
    });

    return { approved: updated.affected || 0 };
  }

  // ─── Allocate Slots (department-wise with classroom) ──
  async allocateSlots(driveId: string, slots: Array<{
    timeSlot: string;
    classroom: string;
    departments: string[];
  }>, actorId: string) {
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    // Clear existing slots
    await this.slotRepo.delete({ driveId });

    const savedSlots: DriveSlot[] = [];

    for (const slotData of slots) {
      // Count approved students for these departments
      const approvedRegs = await this.regRepo.find({
        where: { driveId, status: 'approved' },
      });

      const studentIds = approvedRegs.map((r) => r.studentId);
      let studentCount = 0;

      if (studentIds.length > 0) {
        studentCount = await this.studentRepo
          .createQueryBuilder('s')
          .where('s.id IN (:...ids)', { ids: studentIds })
          .andWhere('s.department IN (:...depts)', { depts: slotData.departments })
          .getCount();
      }

      const slot = await this.slotRepo.save({
        driveId,
        timeSlot: slotData.timeSlot,
        classroom: slotData.classroom,
        departments: slotData.departments,
        studentCount,
      });

      savedSlots.push(slot);
    }

    // Update drive status
    drive.status = 'scheduled';
    await this.driveRepo.save(drive);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'ALLOCATE_DRIVE_SLOTS',
      entityType: 'drive',
      entityId: driveId,
      newValue: { slotsCount: savedSlots.length } as unknown as Record<string, unknown>,
    });

    return { slots: savedSlots };
  }

  // ─── Update Drive Status ───────────────────────
  async updateDriveStatus(driveId: string, status: string, actorId: string) {
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    const oldStatus = drive.status;
    drive.status = status as Drive['status'];
    await this.driveRepo.save(drive);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'UPDATE_DRIVE_STATUS',
      entityType: 'drive',
      entityId: driveId,
      oldValue: { status: oldStatus } as unknown as Record<string, unknown>,
      newValue: { status } as unknown as Record<string, unknown>,
    });

    return drive;
  }

  // ─── Delete Drive ──────────────────────────────
  async deleteDrive(driveId: string, actorId: string) {
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    await this.driveRepo.delete(driveId);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'DELETE_DRIVE',
      entityType: 'drive',
      entityId: driveId,
    });

    return { message: 'Drive deleted' };
  }
}
