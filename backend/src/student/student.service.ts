import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Student } from '../entities/student.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { Cv } from '../entities/cv.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { UpdateProfileDto, ApplyJobDto } from './dto/student.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application) private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Cv) private readonly cvRepo: Repository<Cv>,
    @InjectRepository(InterviewSlot) private readonly slotRepo: Repository<InterviewSlot>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
  ) {}

  // ─── Profile ────────────────────────────────────
  async getProfile(userId: string) {
    const student = await this.studentRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    if (dto.fullName) student.fullName = dto.fullName;
    if (dto.phone) student.phone = dto.phone;
    if (dto.tenthPercent !== undefined) student.tenthPercent = dto.tenthPercent;
    if (dto.twelfthPercent !== undefined) student.twelfthPercent = dto.twelfthPercent;
    if (dto.cgpa !== undefined) student.cgpa = dto.cgpa;
    if (dto.activeBacklogs !== undefined) student.backlogs = dto.activeBacklogs;

    if (dto.profileData) {
      student.profileData = { ...(student.profileData || {}), ...dto.profileData };
    }
    if (dto.skills) {
      student.profileData = { ...(student.profileData || {}), skills: dto.skills };
    }
    if (dto.certifications) {
      student.profileData = { ...(student.profileData || {}), certifications: dto.certifications };
    }

    // Calculate profile completeness
    const fields = [student.fullName, student.phone, student.usn, student.department,
      student.tenthPercent, student.twelfthPercent, student.cgpa];
    const filledCount = fields.filter((f) => f !== null && f !== undefined).length;
    const completePct = Math.round((filledCount / fields.length) * 100);
    student.profileComplete = completePct >= 100;

    await this.studentRepo.save(student);
    return student;
  }

  // ─── Eligible Jobs ──────────────────────────────
  async getEligibleJobs(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const openJobs = await this.jobRepo.find({
      where: { status: 'open' },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });

    const studentCgpa = student.cgpa ?? 0;
    const studentTenth = student.tenthPercent ?? 0;
    const studentTwelfth = student.twelfthPercent ?? 0;

    // Filter by eligibility
    const eligible = openJobs.filter((job) => {
      const cgpaOk = !job.minCgpa || studentCgpa >= Number(job.minCgpa);
      const tenthOk = !job.minTenthPercent || studentTenth >= Number(job.minTenthPercent);
      const twelfthOk = !job.minTwelfthPercent || studentTwelfth >= Number(job.minTwelfthPercent);
      const backlogsOk = job.maxBacklogs === undefined || student.backlogs <= job.maxBacklogs;
      const deptOk = !job.allowedDepartments?.length || job.allowedDepartments.includes(student.department);

      return cgpaOk && tenthOk && twelfthOk && backlogsOk && deptOk;
    });

    // Attach application status
    const appliedApps = await this.applicationRepo.find({
      where: { studentId: student.id },
    });
    const appliedMap = new Map(appliedApps.map((a) => [a.jobId, a]));

    return eligible.map((job) => {
      const app = appliedMap.get(job.id);
      return {
        id: job.id,
        title: job.title,
        companyName: job.company?.name,
        description: job.description,
        ctcMinLpa: job.ctcMinLpa,
        ctcMaxLpa: job.ctcMaxLpa,
        totalVacancies: job.totalVacancies,
        workMode: job.workMode,
        workLocation: job.workLocation,
        requiredSkills: job.requiredSkills,
        alreadyApplied: !!app,
        applicationStatus: app?.finalResult || null,
        applicationId: app?.id || null,
      };
    });
  }

  // ─── Apply ──────────────────────────────────────
  async applyForJob(userId: string, dto: ApplyJobDto) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    if (student.placementStatus === 'placed') {
      throw new ForbiddenException('You are already placed. Contact admin to apply again.');
    }

    const job = await this.jobRepo.findOne({ where: { id: dto.jobId }, relations: ['company'] });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'open') throw new BadRequestException('Job is not open for applications');

    // Check duplicate
    const existing = await this.applicationRepo.findOne({
      where: { studentId: student.id, jobId: dto.jobId },
    });
    if (existing) throw new ConflictException('Already applied for this job');

    // Calculate match score
    const matchScore = this.calculateMatchScore(student, job);

    const application = await this.applicationRepo.save({
      studentId: student.id,
      jobId: dto.jobId,
      cvId: dto.cvId || null,
      matchScore,
    });

    return {
      id: application.id,
      jobTitle: job.title,
      companyName: job.company?.name,
      matchScore,
    };
  }

  private calculateMatchScore(student: Student, job: Job): number {
    let score = 0;
    let totalWeights = 0;
    const studentCgpa = student.cgpa ?? 0;

    // CGPA match (40% weight)
    if (job.minCgpa && Number(job.minCgpa) > 0) {
      totalWeights += 40;
      const ratio = studentCgpa / Number(job.minCgpa);
      score += Math.min(ratio, 1.5) * 40;
    }

    // Skill match (30% weight)
    if (job.requiredSkills?.length) {
      totalWeights += 30;
      const studentSkills = (student.profileData as Record<string, unknown>)?.skills as string[] || [];
      const matchedSkills = job.requiredSkills.filter((s) =>
        studentSkills.some((ss) => ss.toLowerCase().includes(s.toLowerCase())),
      );
      score += (matchedSkills.length / job.requiredSkills.length) * 30;
    }

    // Department match (20% weight)
    if (job.allowedDepartments?.length) {
      totalWeights += 20;
      if (job.allowedDepartments.includes(student.department)) {
        score += 20;
      }
    }

    // Profile completeness (10% weight)
    totalWeights += 10;
    score += (student.profileComplete ? 10 : 3);

    return totalWeights > 0 ? Math.round((score / totalWeights) * 100) : 50;
  }

  // ─── My Applications ───────────────────────────
  async getMyApplications(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const applications = await this.applicationRepo.find({
      where: { studentId: student.id },
      relations: ['job', 'job.company', 'cv'],
      order: { createdAt: 'DESC' },
    });

    return applications.map((app) => ({
      id: app.id,
      jobTitle: app.job?.title,
      companyName: app.job?.company?.name,
      matchScore: app.matchScore,
      atsScore: app.atsScore,
      adminApproved: app.adminApproved,
      currentRound: app.currentRound,
      finalResult: app.finalResult,
      appliedAt: app.createdAt,
    }));
  }

  // ─── Upcoming Interviews ───────────────────────
  async getUpcomingInterviews(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const applications = await this.applicationRepo.find({
      where: { studentId: student.id },
    });
    if (!applications.length) return [];

    const appIds = applications.map((a) => a.id);
    const slots = await this.slotRepo.find({
      where: {
        applicationId: In(appIds),
        scheduledStart: MoreThanOrEqual(new Date()),
        attendance: 'pending',
      },
      relations: ['application', 'application.job', 'application.job.company'],
      order: { scheduledStart: 'ASC' },
    });

    return slots.map((s) => ({
      id: s.id,
      jobTitle: s.application?.job?.title,
      companyName: s.application?.job?.company?.name,
      roundNumber: s.roundNumber,
      scheduledStart: s.scheduledStart,
      scheduledEnd: s.scheduledEnd,
      venue: s.venue,
    }));
  }

  // ─── Notifications ─────────────────────────────
  async getNotifications(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const notif = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new NotFoundException('Notification not found');

    notif.isRead = true;
    await this.notificationRepo.save(notif);
    return { message: 'Marked as read' };
  }
}
