import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, Like, ILike, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Batch } from '../entities/batch.entity';
import { Department, DepartmentType, SEMESTERS_BY_TYPE } from '../entities/department.entity';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EmailService } from './email.service';
import { CreateStudentDto, CreateCompanyDto, BulkApproveDto, UpdateStudentDto, PaginationDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Batch) private readonly batchRepo: Repository<Batch>,
    @InjectRepository(Department) private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application) private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(InterviewSlot) private readonly slotRepo: Repository<InterviewSlot>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Dashboard Stats (fully parallelized) ──────
  async getDashboardStats() {
    const [totalStudents, totalCompanies, totalJobs, totalApplications, placedStudents, activeJobs, pendingApprovals] = await Promise.all([
      this.studentRepo.count(),
      this.companyRepo.count(),
      this.jobRepo.count(),
      this.applicationRepo.count(),
      this.studentRepo.count({ where: { placementStatus: 'placed' } }),
      this.jobRepo.count({ where: { status: 'open' } }),
      this.applicationRepo.count({ where: { adminApproved: null as unknown as boolean } }),
    ]);

    // Department-wise placement breakdown
    const deptRaw: Array<{ department: string; total: string; placed: string }> = await this.studentRepo
      .createQueryBuilder('student')
      .select('student.department', 'department')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN student.placement_status = 'placed' THEN 1 ELSE 0 END)`, 'placed')
      .groupBy('student.department')
      .orderBy('total', 'DESC')
      .getRawMany();

    const departmentStats = deptRaw.map((d) => ({
      department: d.department,
      total: Number(d.total),
      placed: Number(d.placed),
    }));

    // Avg CTC from placed applications
    const avgCtcResult = await this.applicationRepo
      .createQueryBuilder('app')
      .leftJoin('app.job', 'job')
      .select('ROUND(AVG(job.ctc_max_lpa)::numeric, 1)', 'avgCtc')
      .where("app.finalResult = 'selected'")
      .getRawOne();

    return {
      totalStudents,
      totalCompanies,
      totalJobs,
      totalApplications,
      placedStudents,
      totalPlaced: placedStudents,
      activeJobs,
      pendingApprovals,
      placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
      departmentStats,
      avgCtc: avgCtcResult?.avgCtc ? Number(avgCtcResult.avgCtc) : 0,
    };
  }

  // ─── Student Management ─────────────────────────
  async listStudents(query: PaginationDto) {
    const { page = 1, limit = 20, search, department, status, batch } = query;
    const where: Record<string, unknown> = {};

    if (department) where.department = department;
    if (status) where.placementStatus = status;

    const queryBuilder = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.batch', 'batch')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('batch.name', 'DESC')
      .addOrderBy('student.department', 'ASC')
      .addOrderBy('student.fullName', 'ASC');

    if (search) {
      queryBuilder.andWhere(
        '(student.full_name ILIKE :search OR student.usn ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (department) {
      queryBuilder.andWhere('student.department = :department', { department });
    }
    if (status) {
      queryBuilder.andWhere('student.placementStatus = :status', { status });
    }
    if (batch) {
      queryBuilder.andWhere('batch.name = :batch', { batch });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((s) => ({
        id: s.id,
        usn: s.usn,
        fullName: s.fullName,
        email: s.user?.email,
        department: s.department,
        batchName: s.batch?.name || null,
        semester: s.semester,
        cgpa: s.cgpa,
        tenthPercent: s.tenthPercent,
        twelfthPercent: s.twelfthPercent,
        backlogs: s.backlogs ?? 0,
        phone: s.phone,
        gender: s.gender,
        placementStatus: s.placementStatus,
        profileComplete: s.profileComplete,
        createdAt: s.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStudent(id: string) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async updateStudent(id: string, dto: UpdateStudentDto, actorId: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    const oldValue = { ...student };

    if (dto.fullName) student.fullName = dto.fullName;
    if (dto.department) student.department = dto.department;
    if (dto.cgpa !== undefined) student.cgpa = dto.cgpa;
    if (dto.placementStatus) student.placementStatus = dto.placementStatus;

    if (dto.isActive !== undefined) {
      await this.userRepo.update(student.userId, { isActive: dto.isActive });
    }

    await this.studentRepo.save(student);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'UPDATE_STUDENT',
      entityType: 'student',
      entityId: id,
      oldValue: oldValue as unknown as Record<string, unknown>,
      newValue: dto as unknown as Record<string, unknown>,
    });

    return student;
  }

  async deleteStudent(id: string, actorId: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    await this.studentRepo.softDelete(id);
    await this.userRepo.softDelete(student.userId);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'DELETE_STUDENT',
      entityType: 'student',
      entityId: id,
    });

    return { message: 'Student deleted' };
  }

  async createStudent(dto: CreateStudentDto, actorId: string) {
    const usn = dto.usn.trim().toUpperCase();
    const email = dto.email.trim().toLowerCase();
    const dept = dto.department.trim().toUpperCase();
    const batch = dto.batch?.trim() || String(new Date().getFullYear());

    // Check duplicate USN
    const existingStudent = await this.studentRepo.findOne({ where: { usn } });
    if (existingStudent) throw new ConflictException(`USN "${usn}" already exists`);

    // Check duplicate email
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) throw new ConflictException(`Email "${email}" already exists`);

    // Find matching batch
    const matchedBatch = await this.batchRepo.findOne({
      where: { department: dept, year: Number(batch) },
    });

    // Generate password: DEPT+BATCH (same pattern as bulk upload)
    const rawPassword = `${dept}${batch}`;
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // Create user
    const user = await this.userRepo.save({
      email,
      passwordHash,
      role: UserRole.STUDENT,
      mustChangePassword: true,
      isActive: true,
    });

    // Create student
    const student = await this.studentRepo.save({
      userId: user.id,
      usn,
      fullName: dto.fullName.trim(),
      department: dept,
      batchId: matchedBatch?.id || null,
      semester: matchedBatch?.currentSemester || null,
      phone: dto.phone || null,
      gender: dto.gender || null,
      category: dto.category || null,
      cgpa: dto.cgpa ?? null,
      tenthPercent: dto.tenthPercent ?? null,
      twelfthPercent: dto.twelfthPercent ?? null,
      backlogs: dto.backlogs ?? 0,
      profileComplete: false,
      placementStatus: 'none',
      profileData: {},
    });

    // Audit log
    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'CREATE_STUDENT',
      entityType: 'student',
      entityId: student.id,
      newValue: { usn, email, department: dept, batch } as unknown as Record<string, unknown>,
    });

    this.logger.log(`Single student created: ${usn} (${email})`);

    return {
      student: {
        id: student.id,
        usn: student.usn,
        fullName: student.fullName,
        department: student.department,
        email,
      },
      temporaryPassword: rawPassword,
    };
  }

  // ─── Company Management ─────────────────────────
  async deleteCompany(id: string, actorId: string) {
    const company = await this.companyRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');

    await this.companyRepo.softDelete(id);
    await this.userRepo.softDelete(company.userId);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'DELETE_COMPANY',
      entityType: 'company',
      entityId: id,
    });

    return { message: 'Company deleted' };
  }

  async createCompany(dto: CreateCompanyDto, actorId: string) {
    const existing = await this.userRepo.findOne({ where: { email: dto.hrEmail.toLowerCase() } });
    if (existing) throw new ConflictException('Email already exists');

    // Generate random password
    const rawPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(rawPassword, salt);

    const user = await this.userRepo.save({
      email: dto.hrEmail.toLowerCase(),
      passwordHash: hash,
      role: UserRole.COMPANY,
      mustChangePassword: true,
    });

    const company = await this.companyRepo.save({
      userId: user.id,
      name: dto.name,
      hrName: dto.hrName || null,
      hrPhone: dto.hrPhone || null,
      sector: dto.sector || null,
      website: dto.website || null,
      hqCity: dto.hqCity || null,
    });

    // Audit log (non-critical — don't let it crash company creation)
    try {
      await this.auditRepo.save({
        actorUserId: actorId,
        action: 'CREATE_COMPANY',
        entityType: 'company',
        entityId: company.id,
        newValue: { name: dto.name, email: dto.hrEmail } as unknown as Record<string, unknown>,
      });
    } catch (auditErr) {
      this.logger.warn(`Audit log save failed: ${(auditErr as Error).message}`);
    }

    // Send credentials via email — truly fire-and-forget, don't block response
    const loginUrl = this.configService.get<string>('FRONTEND_URL', 'https://mitm-placepro.vercel.app') + '/login';
    this.emailService.sendCompanyCredentials({
      companyName: dto.name,
      hrName: dto.hrName,
      email: dto.hrEmail.toLowerCase(),
      temporaryPassword: rawPassword,
      loginUrl,
    }).catch((e) => this.logger.warn(`Company credentials email failed: ${(e as Error).message}`));

    return {
      company,
      credentials: {
        email: dto.hrEmail.toLowerCase(),
        temporaryPassword: rawPassword,
      },
      emailSent: true, // optimistic — email is queued
    };
  }

  async listCompanies(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;

    const queryBuilder = this.companyRepo.createQueryBuilder('company')
      .leftJoinAndSelect('company.user', 'user')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('company.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(company.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.user?.email,
        sector: c.sector,
        hrName: c.hrName,
        profileComplete: c.profileComplete,
        isActive: c.user?.isActive,
        createdAt: c.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCompany(id: string) {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  // ─── Shortlist Approval ─────────────────────────
  async getShortlist(jobId: string) {
    const job = await this.jobRepo.findOne({ where: { id: jobId }, relations: ['company'] });
    if (!job) throw new NotFoundException('Job not found');

    const applications = await this.applicationRepo.find({
      where: { jobId },
      relations: ['student', 'student.batch', 'cv'],
      order: { matchScore: 'DESC' },
    });

    return {
      job: {
        id: job.id,
        title: job.title,
        company: job.company?.name,
        totalVacancies: job.totalVacancies,
      },
      candidates: applications.map((app) => ({
        applicationId: app.id,
        studentId: app.studentId,
        studentName: app.student?.fullName,
        usn: app.student?.usn,
        department: app.student?.department,
        batchName: app.student?.batch?.name || null,
        semester: app.student?.semester,
        cgpa: app.student?.cgpa,
        matchScore: app.matchScore,
        atsScore: app.atsScore,
        adminApproved: app.adminApproved,
      })),
    };
  }

  async bulkApprove(jobId: string, dto: BulkApproveDto, actorId: string) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const results: Array<{ studentId: string; status: string }> = [];
    for (const studentId of dto.studentIds) {
      const app = await this.applicationRepo.findOne({
        where: { jobId, studentId },
      });

      if (!app) {
        results.push({ studentId, status: 'not_found' });
        continue;
      }

      app.adminApproved = dto.approved;
      app.adminApprovedAt = new Date();
      await this.applicationRepo.save(app);

      // Send notification to student
      const student = await this.studentRepo.findOne({ where: { id: studentId } });
      if (student && dto.approved) {
        await this.notificationRepo.save({
          userId: student.userId,
          type: 'shortlisted',
          title: `Shortlisted for ${job.title}`,
          body: `You have been approved for the ${job.title} position. Prepare for the upcoming interview rounds.`,
          metadata: { jobId, applicationId: app.id },
        });

        if (student.placementStatus === 'none') {
          student.placementStatus = 'shortlisted';
          await this.studentRepo.save(student);
        }
      }

      results.push({ studentId, status: dto.approved ? 'approved' : 'rejected' });
    }

    await this.auditRepo.save({
      actorUserId: actorId,
      action: dto.approved ? 'APPROVE_SHORTLIST' : 'REJECT_SHORTLIST',
      entityType: 'job',
      entityId: jobId,
      newValue: { studentIds: dto.studentIds, approved: dto.approved } as unknown as Record<string, unknown>,
    });

    return { results };
  }

  // ─── Recent Activity ────────────────────────────
  async getRecentActivity(limit = 10) {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['actor'],
    });
  }

  // ─── Jobs (Admin View) ──────────────────────────
  async listJobs(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;

    const queryBuilder = this.jobRepo.createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('job.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(job.title ILIKE :search OR company.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company?.name,
        companyId: j.companyId,
        status: j.status,
        minCgpa: j.minCgpa,
        ctcMinLpa: j.ctcMinLpa,
        ctcMaxLpa: j.ctcMaxLpa,
        totalVacancies: j.totalVacancies,
        numRounds: j.numRounds,
        allowedDepartments: j.allowedDepartments,
        requiredSkills: j.requiredSkills,
        workMode: j.workMode,
        workLocation: j.workLocation,
        createdAt: j.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Applications (Admin View) ──────────────────
  async listApplications(query: PaginationDto) {
    const { page = 1, limit = 20, search, status } = query;

    const queryBuilder = this.applicationRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.student', 'student')
      .leftJoinAndSelect('student.batch', 'batch')
      .leftJoinAndSelect('app.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('app.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(student.fullName ILIKE :search OR student.usn ILIKE :search OR company.name ILIKE :search OR job.title ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status === 'pending') {
      queryBuilder.andWhere('app.adminApproved IS NULL');
    } else if (status === 'approved') {
      queryBuilder.andWhere('app.adminApproved = true');
    } else if (status === 'rejected') {
      queryBuilder.andWhere('app.adminApproved = false');
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((a) => ({
        id: a.id,
        student: a.student ? {
          id: a.student.id,
          fullName: a.student.fullName,
          usn: a.student.usn,
          department: a.student.department,
          batchName: a.student.batch?.name || null,
          semester: a.student.semester,
        } : null,
        job: a.job ? {
          id: a.job.id,
          title: a.job.title,
          company: a.job.company ? { id: a.job.company.id, name: a.job.company.name } : null,
        } : null,
        matchScore: a.matchScore,
        atsScore: a.atsScore,
        approved: a.adminApproved,
        currentRound: a.currentRound,
        result: a.finalResult,
        createdAt: a.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Slot Management ────────────────────────────
  async listSlots(jobId?: string) {
    const queryBuilder = this.slotRepo.createQueryBuilder('slot')
      .leftJoinAndSelect('slot.application', 'application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('application.student', 'student')
      .orderBy('slot.scheduledStart', 'ASC');

    if (jobId) {
      queryBuilder.andWhere('job.id = :jobId', { jobId });
    }

    const slots = await queryBuilder.getMany();

    // Group by job + round
    const runsMap = new Map<string, {
      id: string;
      jobId: string;
      company: string;
      job: string;
      round: number;
      date: string;
      totalCandidates: number;
      slotsGenerated: number;
      conflicts: number;
      status: string;
      venue: string;
      timePerCandidate: number;
    }>();

    for (const slot of slots) {
      const key = `${slot.application?.job?.id || 'unknown'}-${slot.roundNumber}`;
      if (!runsMap.has(key)) {
        runsMap.set(key, {
          id: key,
          jobId: slot.application?.job?.id || '',
          company: slot.application?.job?.company?.name || 'Unknown',
          job: slot.application?.job?.title || 'Unknown',
          round: slot.roundNumber,
          date: slot.scheduledStart?.toISOString().split('T')[0] || '',
          totalCandidates: 0,
          slotsGenerated: 0,
          conflicts: 0,
          status: 'completed',
          venue: slot.venue || 'TBD',
          timePerCandidate: slot.durationOverrideMin || 30,
        });
      }
      const run = runsMap.get(key)!;
      run.slotsGenerated++;
      run.totalCandidates++;
    }

    return Array.from(runsMap.values());
  }

  async generateSlots(jobId: string, round: number, config?: { venue?: string; durationMin?: number; startHour?: number }) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    // Find approved applications for this job at the target round
    const applications = await this.applicationRepo.find({
      where: { jobId, adminApproved: true, currentRound: round },
      relations: ['student'],
    });

    if (applications.length === 0) {
      throw new BadRequestException('No approved applications found for this round');
    }

    const venue = config?.venue || 'Seminar Hall';
    const durationMin = config?.durationMin || 30;
    const startHour = config?.startHour || 9;

    // Generate conflict-free slots using greedy scheduling
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(startHour, 0, 0, 0);

    const generatedSlots: InterviewSlot[] = [];
    let currentTime = new Date(tomorrow);

    for (const app of applications) {
      // Check for existing slot to avoid duplicates
      const existing = await this.slotRepo.findOne({
        where: { applicationId: app.id, roundNumber: round },
      });
      if (existing) continue;

      const endTime = new Date(currentTime);
      endTime.setMinutes(endTime.getMinutes() + durationMin);

      const slot = this.slotRepo.create({
        applicationId: app.id,
        roundNumber: round,
        scheduledStart: new Date(currentTime),
        scheduledEnd: endTime,
        venue: `${venue} ${round}`,
        attendance: 'pending',
        roundResult: 'pending',
      });

      generatedSlots.push(await this.slotRepo.save(slot));
      currentTime = new Date(endTime);

      // Lunch break at 1 PM
      if (currentTime.getHours() === 13 && currentTime.getMinutes() === 0) {
        currentTime.setHours(14, 0, 0, 0);
      }
    }

    return {
      generated: generatedSlots.length,
      jobTitle: job.title,
      round,
      venue,
    };
  }

  async getSlotTimeline(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const slots = await this.slotRepo.find({
      where: {
        scheduledStart: Between(startOfDay, endOfDay),
      },
      relations: ['application', 'application.student', 'application.job', 'application.job.company'],
      order: { scheduledStart: 'ASC' },
    });

    return slots.map((s) => ({
      time: s.scheduledStart?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      student: s.application?.student?.fullName || 'Unknown',
      company: s.application?.job?.company?.name || 'Unknown',
      venue: s.venue || 'TBD',
      round: s.roundNumber,
      attendance: s.attendance,
      result: s.roundResult,
    }));
  }

  // ─── Batch Management ───────────────────────────
  async createBatch(data: { department: string; year: number; currentSemester: number }, actorId: string) {
    const name = `${data.department} ${data.year}`;

    // Check duplicate
    const existing = await this.batchRepo.findOne({
      where: { department: data.department, year: data.year },
    });
    if (existing) throw new ConflictException(`Batch "${name}" already exists`);

    const batch = await this.batchRepo.save({
      name,
      department: data.department,
      year: data.year,
      currentSemester: data.currentSemester,
    });

    // Count students already matching this dept — link them automatically
    const matchingStudents = await this.studentRepo.count({
      where: { department: data.department, batchId: null as unknown as string },
    });

    if (matchingStudents > 0) {
      await this.studentRepo
        .createQueryBuilder()
        .update()
        .set({ batchId: batch.id, semester: data.currentSemester })
        .where('department = :dept AND batch_id IS NULL', { dept: data.department })
        .execute();
      batch.studentCount = matchingStudents;
      await this.batchRepo.save(batch);
    }

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'CREATE_BATCH',
      entityType: 'batch',
      entityId: batch.id,
      newValue: data as unknown as Record<string, unknown>,
    });

    return batch;
  }

  async listBatches() {
    const batches = await this.batchRepo.find({ order: { department: 'ASC', year: 'DESC' } });

    // Batch-load all student counts in a single GROUP BY query instead of N+1
    if (batches.length > 0) {
      const batchIds = batches.map((b) => b.id);
      const counts: Array<{ batch_id: string; cnt: string }> = await this.studentRepo
        .createQueryBuilder('s')
        .select('s.batch_id', 'batch_id')
        .addSelect('COUNT(*)::int', 'cnt')
        .where('s.batch_id IN (:...batchIds)', { batchIds })
        .groupBy('s.batch_id')
        .getRawMany();

      const countMap = new Map(counts.map((c) => [c.batch_id, Number(c.cnt)]));
      for (const batch of batches) {
        batch.studentCount = countMap.get(batch.id) || 0;
      }
    }

    return batches;
  }

  async promoteBatch(batchId: string, actorId: string) {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found');

    // Look up department to get max semesters
    const dept = await this.departmentRepo.findOne({ where: { code: batch.department } });
    const maxSemesters = dept?.totalSemesters || 8;

    if (batch.currentSemester >= maxSemesters) {
      throw new BadRequestException(`Batch already at maximum semester (${maxSemesters})`);
    }

    const oldSemester = batch.currentSemester;
    batch.currentSemester += 1;
    await this.batchRepo.save(batch);

    // Promote all students in this batch
    const updated = await this.studentRepo
      .createQueryBuilder()
      .update()
      .set({ semester: batch.currentSemester })
      .where('batch_id = :batchId', { batchId })
      .execute();

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'PROMOTE_BATCH',
      entityType: 'batch',
      entityId: batchId,
      oldValue: { semester: oldSemester } as unknown as Record<string, unknown>,
      newValue: { semester: batch.currentSemester, studentsUpdated: updated.affected } as unknown as Record<string, unknown>,
    });

    return {
      batch,
      studentsUpdated: updated.affected || 0,
      newSemester: batch.currentSemester,
    };
  }

  async deleteBatch(batchId: string, actorId: string) {
    const batch = await this.batchRepo.findOne({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found');

    // Unlink students from batch
    await this.studentRepo
      .createQueryBuilder()
      .update()
      .set({ batchId: null as unknown as string })
      .where('batch_id = :batchId', { batchId })
      .execute();

    await this.batchRepo.delete(batchId);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'DELETE_BATCH',
      entityType: 'batch',
      entityId: batchId,
    });

    return { message: 'Batch deleted' };
  }

  // ─── Department Management ──────────────────────
  async listDepartments() {
    return this.departmentRepo.find({ order: { code: 'ASC' } });
  }

  async createDepartment(data: { code: string; name: string; type?: string }, actorId: string) {
    const code = data.code.trim().toUpperCase();
    const name = data.name.trim();
    const deptType = (data.type as DepartmentType) || DepartmentType.UG;
    const totalSemesters = SEMESTERS_BY_TYPE[deptType] || 8;

    if (!code || !name) throw new BadRequestException('Code and name are required');

    const existing = await this.departmentRepo.findOne({ where: { code } });
    if (existing) throw new ConflictException(`Department "${code}" already exists`);

    const dept = await this.departmentRepo.save({ code, name, type: deptType, totalSemesters });

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'CREATE_DEPARTMENT',
      entityType: 'department',
      entityId: dept.id,
      newValue: { code, name, type: deptType, totalSemesters } as unknown as Record<string, unknown>,
    });

    return dept;
  }

  async updateDepartment(id: string, data: { code?: string; name?: string }, actorId: string) {
    const dept = await this.departmentRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');

    const oldValue = { code: dept.code, name: dept.name };

    if (data.code) {
      const newCode = data.code.trim().toUpperCase();
      if (newCode !== dept.code) {
        const duplicate = await this.departmentRepo.findOne({ where: { code: newCode } });
        if (duplicate) throw new ConflictException(`Department "${newCode}" already exists`);

        // Update all batches and students referencing the old code
        await this.batchRepo
          .createQueryBuilder()
          .update()
          .set({ department: newCode, name: () => `REPLACE(name, '${dept.code}', '${newCode}')` })
          .where('department = :old', { old: dept.code })
          .execute();

        await this.studentRepo
          .createQueryBuilder()
          .update()
          .set({ department: newCode })
          .where('department = :old', { old: dept.code })
          .execute();

        dept.code = newCode;
      }
    }
    if (data.name) dept.name = data.name.trim();

    await this.departmentRepo.save(dept);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'UPDATE_DEPARTMENT',
      entityType: 'department',
      entityId: id,
      oldValue: oldValue as unknown as Record<string, unknown>,
      newValue: { code: dept.code, name: dept.name } as unknown as Record<string, unknown>,
    });

    return dept;
  }

  async deleteDepartment(id: string, actorId: string) {
    const dept = await this.departmentRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');

    // Check if any batches or students reference this department
    const batchCount = await this.batchRepo.count({ where: { department: dept.code } });
    const studentCount = await this.studentRepo.count({ where: { department: dept.code } });

    if (batchCount > 0 || studentCount > 0) {
      throw new BadRequestException(
        `Cannot delete "${dept.code}" — it is used by ${batchCount} batch(es) and ${studentCount} student(s). Remove references first.`,
      );
    }

    await this.departmentRepo.delete(id);

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'DELETE_DEPARTMENT',
      entityType: 'department',
      entityId: id,
    });

    return { message: `Department "${dept.code}" deleted` };
  }
}
