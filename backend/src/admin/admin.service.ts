import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, Like, ILike, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EmailService } from './email.service';
import { CreateCompanyDto, BulkApproveDto, UpdateStudentDto, PaginationDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application) private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(InterviewSlot) private readonly slotRepo: Repository<InterviewSlot>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Dashboard Stats ───────────────────────────
  async getDashboardStats() {
    const [totalStudents, totalCompanies, totalJobs, totalApplications] = await Promise.all([
      this.studentRepo.count(),
      this.companyRepo.count(),
      this.jobRepo.count(),
      this.applicationRepo.count(),
    ]);

    const placedStudents = await this.studentRepo.count({ where: { placementStatus: 'placed' } });
    const activeJobs = await this.jobRepo.count({ where: { status: 'open' } });
    const pendingApprovals = await this.applicationRepo.count({ where: { adminApproved: null as unknown as boolean } });

    return {
      totalStudents,
      totalCompanies,
      totalJobs,
      totalApplications,
      placedStudents,
      activeJobs,
      pendingApprovals,
      placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
    };
  }

  // ─── Student Management ─────────────────────────
  async listStudents(query: PaginationDto) {
    const { page = 1, limit = 20, search, department, status } = query;
    const where: Record<string, unknown> = {};

    if (department) where.department = department;
    if (status) where.placementStatus = status;

    const queryBuilder = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('student.createdAt', 'DESC');

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
      queryBuilder.andWhere('student.placement_status = :status', { status });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((s) => ({
        id: s.id,
        usn: s.usn,
        fullName: s.fullName,
        email: s.user?.email,
        department: s.department,
        cgpa: s.cgpa,
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

  // ─── Company Management ─────────────────────────
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

    await this.auditRepo.save({
      actorUserId: actorId,
      action: 'CREATE_COMPANY',
      entityType: 'company',
      entityId: company.id,
      newValue: { name: dto.name, email: dto.hrEmail } as unknown as Record<string, unknown>,
    });

    // Send credentials via email (fire-and-forget, don't block response)
    const loginUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/login';
    const emailSent = await this.emailService.sendCompanyCredentials({
      companyName: dto.name,
      hrName: dto.hrName,
      email: dto.hrEmail.toLowerCase(),
      temporaryPassword: rawPassword,
      loginUrl,
    });

    return {
      company,
      credentials: {
        email: dto.hrEmail.toLowerCase(),
        temporaryPassword: rawPassword,
      },
      emailSent,
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
      relations: ['student', 'cv'],
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
      .leftJoinAndSelect('app.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('app.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(student.full_name ILIKE :search OR student.usn ILIKE :search OR company.name ILIKE :search OR job.title ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status === 'pending') {
      queryBuilder.andWhere('app.admin_approved IS NULL');
    } else if (status === 'approved') {
      queryBuilder.andWhere('app.admin_approved = true');
    } else if (status === 'rejected') {
      queryBuilder.andWhere('app.admin_approved = false');
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
}
