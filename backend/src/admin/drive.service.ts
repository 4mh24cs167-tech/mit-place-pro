import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Drive, DriveRegistration, DriveSlot } from '../entities/drive.entity';
import { Job } from '../entities/job.entity';
import { Student } from '../entities/student.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EmailService } from './email.service';
import { Application } from '../entities/application.entity';
import { Company } from '../entities/company.entity';
import { DriveCompanyJob } from '../entities/drive-company-job.entity';
import { DriveAttendance } from '../entities/drive-attendance.entity';

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);

  constructor(
    @InjectRepository(Drive) private readonly driveRepo: Repository<Drive>,
    @InjectRepository(DriveRegistration) private readonly regRepo: Repository<DriveRegistration>,
    @InjectRepository(DriveSlot) private readonly slotRepo: Repository<DriveSlot>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Application) private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(DriveCompanyJob) private readonly dcjRepo: Repository<DriveCompanyJob>,
    @InjectRepository(DriveAttendance) private readonly attendanceRepo: Repository<DriveAttendance>,
    private readonly emailService: EmailService,
  ) {}

  // ─── Create a Drive ─────────────────────────────
  async createDrive(data: {
    title: string;
    type: 'single' | 'multiple';
    jobId?: string;
    jobIds?: string[];
    companyJobs?: Array<{ companyId: string; jobIds: string[] }>;
    batchIds?: string[];
    description?: string;
    driveDate?: string;
    departments?: string[];
  }, actorId: string) {
    let jobIds = data.jobIds && data.jobIds.length > 0 ? data.jobIds : (data.jobId ? [data.jobId] : []);
    let dcjEntriesData: Array<{ companyId: string; jobIds: string[] }> = [];

    if (data.type === 'multiple' && data.companyJobs && data.companyJobs.length > 0) {
      jobIds = data.companyJobs.flatMap(cj => cj.jobIds);
      dcjEntriesData = data.companyJobs;
    }

    if (jobIds.length === 0) throw new BadRequestException('No job specified');

    // Fetch all jobs
    const jobs = await this.jobRepo.find({ where: { id: In(jobIds) }, relations: ['company'] });
    if (jobs.length === 0) throw new NotFoundException('Jobs not found');

    const primaryJob = jobs[0];
    const departments = data.departments && data.departments.length > 0 
      ? data.departments 
      : [...new Set(jobs.flatMap(j => j.allowedDepartments || []))];

    let title = data.title;
    if (!title) {
      if (data.type === 'multiple' && dcjEntriesData.length > 0) {
        const uniqueCompanies = [...new Set(jobs.map(j => j.company?.name).filter(Boolean))];
        title = `Multi-Company Drive — ${uniqueCompanies.join(', ')}`;
      } else {
        title = `${primaryJob.company?.name || 'Company'} - ${jobs.map(j => j.title).join(', ')}`;
      }
    }

    const drive = await this.driveRepo.save({
      title,
      type: data.type,
      jobId: primaryJob.id,
      jobIds: jobIds,
      status: 'open',
      description: data.description || null,
      driveDate: data.driveDate || null,
      departments,
      batchIds: data.batchIds || [],
    });

    if (data.type === 'multiple' && dcjEntriesData.length > 0) {
      const dcjEntries = dcjEntriesData.flatMap(cj =>
        cj.jobIds.map(jobId => ({
          driveId: drive.id,
          companyId: cj.companyId,
          jobId,
        }))
      );
      await this.dcjRepo.save(dcjEntries);
    }

    // Find eligible students and NOTIFY them (opt-in workflow, no auto-registration)
    const studentQuery = this.studentRepo.createQueryBuilder('s')
      .where('s.profileComplete = true');

    if (drive.departments && drive.departments.length > 0) {
      studentQuery.andWhere('s.department IN (:...depts)', { depts: drive.departments });
    }

    if (data.batchIds && data.batchIds.length > 0) {
      studentQuery.andWhere('s.batchId IN (:...batchIds)', { batchIds: data.batchIds });
    }

    const minCgpas = jobs.map(j => j.minCgpa).filter(c => c != null && c > 0);
    if (minCgpas.length > 0) {
      const minCgpa = Math.min(...minCgpas);
      studentQuery.andWhere('s.cgpa >= :minCgpa', { minCgpa });
    }

    const eligibleStudents = await studentQuery.getMany();

    // Send notifications to all eligible students instead of auto-registering
    if (eligibleStudents.length > 0) {
      const driveDate = drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD';
      const notifications = eligibleStudents.map((s) => ({
        userId: s.userId,
        type: 'drive_invite',
        title: `New Drive: ${drive.title}`,
        body: `${primaryJob.company?.name || 'A company'} is hiring for "${jobs.map(j => j.title).join(', ')}". Drive date: ${driveDate}. Open your drives page to register if interested.`,
        metadata: { driveId: drive.id, jobId: primaryJob.id, companyName: primaryJob.company?.name },
      }));
      await this.notificationRepo.save(notifications);
    }

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'CREATE_DRIVE',
      entityType: 'drive',
      entityId: drive.id,
      newValue: { title: drive.title, type: drive.type, notified: eligibleStudents.length } as unknown as Record<string, unknown>,
    });

    // Send email announcements to eligible students (fire-and-forget)
    if (eligibleStudents.length > 0) {
      const userIds = eligibleStudents.map(s => s.userId);
      const users = await this.userRepo.find({ where: { id: In(userIds) } });
      const emails = users.map(u => u.email).filter(Boolean);

      if (emails.length > 0) {
        const driveDate2 = drive.driveDate
          ? new Date(drive.driveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : undefined;

        this.emailService.sendDriveAnnouncementEmail({
          emails,
          driveName: drive.title,
          companyName: primaryJob.company?.name || 'A company',
          driveDate: driveDate2,
          description: drive.description || undefined,
          eligibleDepartments: drive.departments,
        }).then(count => {
          this.logger.log(`📧 Drive announcement emails sent: ${count}`);
        }).catch(err => {
          this.logger.error(`❌ Drive announcement email failed`, err);
        });
      }
    }

    return {
      ...drive,
      notifiedCount: eligibleStudents.length,
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

    // Collect all jobIds from d.jobIds across all drives
    const allJobIds = [...new Set(results.flatMap((d) => d.jobIds || (d.jobId ? [d.jobId] : [])))];
    
    // Fetch all these jobs in one query
    let allJobsMap = new Map<string, Job>();
    if (allJobIds.length > 0) {
      const jobs = await this.jobRepo.find({ where: { id: In(allJobIds) }, relations: ['company'] });
      allJobsMap = new Map(jobs.map((j) => [j.id, j]));
    }

    // Fetch DriveCompanyJob for multiple drives
    const multiDriveIds = results.filter(d => d.type === 'multiple').map(d => d.id);
    const dcjMap = new Map<string, { companies: Set<string>, companyCount: number }>();
    if (multiDriveIds.length > 0) {
      const dcjs = await this.dcjRepo.find({ where: { driveId: In(multiDriveIds) } });
      for (const dcj of dcjs) {
        if (!dcjMap.has(dcj.driveId)) {
          dcjMap.set(dcj.driveId, { companies: new Set(), companyCount: 0 });
        }
        dcjMap.get(dcj.driveId)!.companies.add(dcj.companyId);
      }
      for (const val of dcjMap.values()) {
        val.companyCount = val.companies.size;
      }
    }

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

      // Resolve multiple jobs
      const jobIds = d.jobIds && d.jobIds.length > 0 ? d.jobIds : (d.jobId ? [d.jobId] : []);
      const matchedJobs = jobIds.map((id) => allJobsMap.get(id)).filter(Boolean) as Job[];
      
      let companyName = matchedJobs[0]?.company?.name || d.job?.company?.name || 'Unknown';
      let jobTitles = matchedJobs.length > 0 
        ? matchedJobs.map((j) => j.title).join(', ') 
        : (d.job?.title || 'Unknown');
      let companyCount = 1;

      if (d.type === 'multiple' && dcjMap.has(d.id)) {
        const mcData = dcjMap.get(d.id)!;
        companyName = `${mcData.companyCount} Companies`;
        companyCount = mcData.companyCount;
        jobTitles = matchedJobs.map(j => j.title).join(', ');
      }

      return {
        id: d.id,
        title: d.title,
        type: d.type,
        status: d.status,
        driveDate: d.driveDate,
        departments: d.departments,
        batchIds: d.batchIds || [],
        company: companyName,
        companyCount,
        jobTitle: jobTitles,
        jobId: d.jobId || jobIds[0] || null,
        jobIds: jobIds,
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

    const jobIds = drive.jobIds && drive.jobIds.length > 0 ? drive.jobIds : (drive.jobId ? [drive.jobId] : []);
    const matchedJobs = jobIds.length > 0 
      ? await this.jobRepo.find({ where: { id: In(jobIds) }, relations: ['company'] }) 
      : [];

    let companyName = matchedJobs[0]?.company?.name || drive.job?.company?.name || 'Unknown';
    let jobTitles = matchedJobs.length > 0 
      ? matchedJobs.map((j) => j.title).join(', ') 
      : (drive.job?.title || 'Unknown');

    let companyJobsResult: Array<{ companyId: string, companyName: string, jobs: any[] }> = [];
    let attendanceCountsResult: Record<string, number> = {};

    if (drive.type === 'multiple') {
      const dcjs = await this.dcjRepo.find({
        where: { driveId },
        relations: ['company', 'job'],
      });
      
      const cjMap = new Map<string, { companyId: string, companyName: string, jobs: any[] }>();
      for (const dcj of dcjs) {
        if (!cjMap.has(dcj.companyId)) {
          cjMap.set(dcj.companyId, {
            companyId: dcj.companyId,
            companyName: dcj.company?.name || 'Unknown',
            jobs: []
          });
        }
        if (dcj.job) {
          cjMap.get(dcj.companyId)!.jobs.push(dcj.job);
        }
      }
      companyJobsResult = Array.from(cjMap.values());
      
      if (companyJobsResult.length > 0) {
        companyName = `${companyJobsResult.length} Companies`;
      }

      const attendances = await this.attendanceRepo.find({ where: { driveId } });
      for (const att of attendances) {
        if (!attendanceCountsResult[att.jobId]) {
          attendanceCountsResult[att.jobId] = 0;
        }
        attendanceCountsResult[att.jobId]++;
      }
    }

    const registrations = await this.regRepo.find({
      where: { driveId },
    });

    // Get student details for registrations
    const studentIds = registrations.map((r) => r.studentId);
    let students: Student[] = [];
    if (studentIds.length > 0) {
      students = await this.studentRepo.find({
        where: { id: In(studentIds) },
        relations: ['user', 'batch'],
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
          batchName: student.batch?.name || null,
          cgpa: student.cgpa,
          email: student.user?.email,
          semester: student.semester,
          phone: student.phone || null,
          resumeLink: student.resumeLink || null,
          driveLink: student.driveLink || null,
        } : null,
      };
    });

    // Count total eligible students (matching drive departments)
    let totalEligible = 0;
    try {
      if (drive.departments && drive.departments.length > 0) {
        totalEligible = await this.studentRepo
          .createQueryBuilder('s')
          .where('s.department IN (:...depts)', { depts: drive.departments })
          .getCount();
      } else {
        totalEligible = await this.studentRepo.count();
      }
    } catch (err) {
      this.logger.warn(`Failed to count eligible students: ${(err as Error).message}`);
    }

    return {
      id: drive.id,
      title: drive.title,
      type: drive.type,
      status: drive.status,
      driveDate: drive.driveDate,
      departments: drive.departments,
      batchIds: drive.batchIds || [],
      description: drive.description,
      company: companyName,
      jobTitle: jobTitles,
      jobId: drive.jobId || jobIds[0] || null,
      jobIds: jobIds,
      jobs: matchedJobs.map(j => ({ id: j.id, title: j.title })),
      companyJobs: companyJobsResult,
      attendanceCounts: attendanceCountsResult,
      registrations: enrichedRegs,
      slots: drive.slots || [],
      totalEligible,
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

    // Sync registrations to job applications
    await this.syncApprovedRegistrationsToApplications(driveId);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'APPROVE_ALL_DRIVE',
      entityType: 'drive',
      entityId: driveId,
      newValue: { approved: updated.affected } as unknown as Record<string, unknown>,
    });

    return { approved: updated.affected || 0 };
  }

  // ─── Allocate Slots (department-wise with classroom, optimized) ──
  async allocateSlots(driveId: string, slots: Array<{
    timeSlot: string;
    classroom: string;
    departments: string[];
  }>, actorId: string) {
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    // Clear existing slots
    await this.slotRepo.delete({ driveId });

    // Pre-load ALL approved registrations + student departments in a SINGLE query
    const approvedStudents: Array<{ student_id: string; department: string }> = await this.regRepo
      .createQueryBuilder('r')
      .innerJoin('students', 's', 's.id = r.student_id')
      .select('r.student_id', 'student_id')
      .addSelect('s.department', 'department')
      .where('r.drive_id = :driveId', { driveId })
      .andWhere('r.status = :status', { status: 'approved' })
      .getRawMany();

    // Build a department → count map for fast lookups
    const deptCounts = new Map<string, number>();
    for (const row of approvedStudents) {
      deptCounts.set(row.department, (deptCounts.get(row.department) || 0) + 1);
    }

    // Build slot entities in-memory, compute counts without any extra queries
    const slotEntities = slots.map((slotData) => {
      const studentCount = slotData.departments.reduce(
        (sum, dept) => sum + (deptCounts.get(dept) || 0), 0,
      );
      return {
        driveId,
        timeSlot: slotData.timeSlot,
        classroom: slotData.classroom,
        departments: slotData.departments,
        studentCount,
      };
    });

    // Bulk insert all slots at once instead of one-at-a-time
    const savedSlots = await this.slotRepo.save(slotEntities);

    // Update drive status
    drive.status = 'scheduled';
    await this.driveRepo.save(drive);

    // Sync registrations to job applications
    await this.syncApprovedRegistrationsToApplications(driveId);

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

    // Sync approved registrations if moving to active status
    if (['screening', 'scheduled', 'completed'].includes(status)) {
      await this.syncApprovedRegistrationsToApplications(driveId);
    }

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

  // ─── Sync Approved Drive Registrations to Job Applications ───
  async syncApprovedRegistrationsToApplications(driveId: string): Promise<void> {
    try {
      const drive = await this.driveRepo.findOne({
        where: { id: driveId },
      });
      if (!drive) return;

      const jobIds = drive.jobIds && drive.jobIds.length > 0 ? drive.jobIds : (drive.jobId ? [drive.jobId] : []);
      if (jobIds.length === 0) return;

      // 1. Automatically publish all associated jobs if they are still drafts
      const jobs = await this.jobRepo.find({ where: { id: In(jobIds) } });
      const draftJobs = jobs.filter(j => j.status === 'draft');
      if (draftJobs.length > 0) {
        for (const job of draftJobs) {
          job.status = 'open';
          await this.jobRepo.save(job);
          this.logger.log(`Auto-published job ${job.id} associated with drive ${driveId}`);
        }
      }

      // 2. Fetch all approved registrations for this drive
      const approvedRegs = await this.regRepo.find({
        where: { driveId, status: 'approved' },
      });

      if (approvedRegs.length === 0) return;

      // 3. Sync to official applications table for EVERY job in the drive!
      for (const reg of approvedRegs) {
        for (const jobId of jobIds) {
          const existingApp = await this.applicationRepo.findOne({
            where: { studentId: reg.studentId, jobId },
          });

          if (!existingApp) {
            await this.applicationRepo.save({
              studentId: reg.studentId,
              jobId,
              adminApproved: true,
              adminApprovedAt: new Date(),
              currentRound: 1,
              finalResult: 'pending',
              matchScore: 75.00,
            });
          } else if (existingApp.adminApproved !== true) {
            existingApp.adminApproved = true;
            existingApp.adminApprovedAt = new Date();
            await this.applicationRepo.save(existingApp);
          }
        }
      }
      this.logger.log(`Synced ${approvedRegs.length} approved drive registrations to job applications for drive ${driveId} across ${jobIds.length} jobs`);
    } catch (err) {
      this.logger.error(`Error syncing drive registrations to applications for drive ${driveId}:`, err);
    }
  }
}
