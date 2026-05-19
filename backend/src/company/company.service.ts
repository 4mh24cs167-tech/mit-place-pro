import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { CompanyAvailability } from '../entities/company-availability.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { Student } from '../entities/student.entity';
import { Drive, DriveSlot } from '../entities/drive.entity';
import { CreateJobDto, AddAvailabilityDto, MarkAttendanceDto, MarkRoundResultDto } from './dto/company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application) private readonly applicationRepo: Repository<Application>,
    @InjectRepository(CompanyAvailability) private readonly availabilityRepo: Repository<CompanyAvailability>,
    @InjectRepository(InterviewSlot) private readonly slotRepo: Repository<InterviewSlot>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Drive) private readonly driveRepo: Repository<Drive>,
    @InjectRepository(DriveSlot) private readonly driveSlotRepo: Repository<DriveSlot>,
  ) {}

  // ─── Company Profile ────────────────────────────
  async getProfile(userId: string) {
    const company = await this.companyRepo.findOne({ where: { userId }, relations: ['user'] });
    if (!company) throw new NotFoundException('Company profile not found');
    return company;
  }

  async updateProfile(userId: string, dto: {
    name?: string; website?: string; hqCity?: string; sector?: string;
    annualTurnoverRange?: string; description?: string; hrName?: string; hrPhone?: string;
  }) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    if (dto.name !== undefined) company.name = dto.name;
    if (dto.website !== undefined) company.website = dto.website;
    if (dto.hqCity !== undefined) company.hqCity = dto.hqCity;
    if (dto.sector !== undefined) company.sector = dto.sector;
    if (dto.annualTurnoverRange !== undefined) company.annualTurnoverRange = dto.annualTurnoverRange;
    if (dto.description !== undefined) company.description = dto.description;
    if (dto.hrName !== undefined) company.hrName = dto.hrName;
    if (dto.hrPhone !== undefined) company.hrPhone = dto.hrPhone;

    // Auto-mark profile as complete if key fields are filled
    if (company.name && company.sector && company.hrName) {
      company.profileComplete = true;
    }

    await this.companyRepo.save(company);
    return company;
  }

  // ─── Job Management ─────────────────────────────
  async createJob(userId: string, dto: CreateJobDto) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.save({
      companyId: company.id,
      ...dto,
      status: 'draft',
    });

    return job;
  }

  async listJobs(userId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    return this.jobRepo.find({
      where: { companyId: company.id },
      order: { createdAt: 'DESC' },
    });
  }

  async getJob(userId: string, jobId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async publishJob(userId: string, jobId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== 'draft') throw new BadRequestException('Only draft jobs can be published');

    job.status = 'open';
    await this.jobRepo.save(job);
    return job;
  }

  // ─── Availability ──────────────────────────────
  async addAvailability(userId: string, jobId: string, dto: AddAvailabilityDto) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');

    return this.availabilityRepo.save({
      jobId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      breakStart: dto.breakStart || null,
      breakEnd: dto.breakEnd || null,
      venue: dto.venue || null,
    });
  }

  async getAvailability(userId: string, jobId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');

    return this.availabilityRepo.find({
      where: { jobId },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  // ─── Candidates Pipeline ──────────────────────
  async getCandidates(userId: string, jobId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');

    const applications = await this.applicationRepo.find({
      where: { jobId, adminApproved: true },
      relations: ['student'],
      order: { matchScore: 'DESC' },
    });

    return applications.map((app) => ({
      applicationId: app.id,
      studentName: app.student?.fullName,
      usn: app.student?.usn,
      department: app.student?.department,
      cgpa: app.student?.cgpa,
      matchScore: app.matchScore,
      atsScore: app.atsScore,
      currentRound: app.currentRound,
      finalResult: app.finalResult,
    }));
  }

  // ─── Attendance & Results ─────────────────────
  async markAttendance(userId: string, dto: MarkAttendanceDto) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const slot = await this.slotRepo.findOne({
      where: { id: dto.slotId },
      relations: ['application', 'application.job'],
    });
    if (!slot) throw new NotFoundException('Interview slot not found');
    if (slot.application.job.companyId !== company.id) throw new ForbiddenException('Not authorized');

    slot.attendance = dto.attendance;
    slot.markedBy = userId;
    slot.markedAt = new Date();
    await this.slotRepo.save(slot);

    return slot;
  }

  async markRoundResult(userId: string, dto: MarkRoundResultDto) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const slot = await this.slotRepo.findOne({
      where: { id: dto.slotId },
      relations: ['application', 'application.job'],
    });
    if (!slot) throw new NotFoundException('Interview slot not found');
    if (slot.application.job.companyId !== company.id) throw new ForbiddenException('Not authorized');

    slot.roundResult = dto.result;
    await this.slotRepo.save(slot);

    // If selected, advance application to next round
    const app = slot.application;
    if (dto.result === 'selected') {
      const job = await this.jobRepo.findOne({ where: { id: app.jobId } });
      if (job && slot.roundNumber >= job.numRounds) {
        // Final round — mark as placed
        app.finalResult = 'selected';
        app.offeredCtcLpa = job.ctcMaxLpa;
        await this.applicationRepo.save(app);

        // Update student status
        const student = await this.studentRepo.findOne({ where: { id: app.studentId } });
        if (student) {
          student.placementStatus = 'placed';
          await this.studentRepo.save(student);

          // Notify student
          await this.notificationRepo.save({
            userId: student.userId,
            type: 'placed',
            title: `Congratulations! Placed at ${job.company?.name || 'Company'}`,
            body: `You have been selected for the ${job.title} role.`,
            metadata: { jobId: job.id, applicationId: app.id },
          });
        }
      } else {
        app.currentRound = slot.roundNumber + 1;
        await this.applicationRepo.save(app);
      }
    } else {
      app.finalResult = 'rejected';
      await this.applicationRepo.save(app);
    }

    return { message: `Round result: ${dto.result}`, application: app };
  }

  // ─── Dashboard Stats ───────────────────────────
  async getDashboard(userId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const jobs = await this.jobRepo.find({ where: { companyId: company.id } });
    const jobIds = jobs.map((j) => j.id);

    let totalApplications = 0;
    let totalSelected = 0;
    let totalPending = 0;

    if (jobIds.length > 0) {
      totalApplications = await this.applicationRepo.count({ where: { jobId: In(jobIds) } });
      totalSelected = await this.applicationRepo.count({ where: { jobId: In(jobIds), finalResult: 'selected' } });
      totalPending = await this.applicationRepo.count({ where: { jobId: In(jobIds), finalResult: 'pending' } });
    }

    return {
      companyName: company.name,
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === 'open').length,
      totalApplications,
      totalSelected,
      totalPending,
    };
  }

  // ─── Company Drives (view slots, student counts, depts) ──
  async getMyDrives(userId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const jobs = await this.jobRepo.find({ where: { companyId: company.id } });
    if (jobs.length === 0) return [];

    const jobIds = jobs.map((j) => j.id);

    const drives = await this.driveRepo.find({
      where: { jobId: In(jobIds) },
      relations: ['job', 'slots'],
      order: { createdAt: 'DESC' },
    });

    return drives.map((drive) => ({
      id: drive.id,
      title: drive.title,
      status: drive.status,
      driveDate: drive.driveDate,
      departments: drive.departments,
      jobTitle: drive.job?.title,
      slots: (drive.slots || []).map((s) => ({
        id: s.id,
        timeSlot: s.timeSlot,
        classroom: s.classroom,
        departments: s.departments,
        studentCount: s.studentCount,
      })),
      createdAt: drive.createdAt,
    }));
  }
}
