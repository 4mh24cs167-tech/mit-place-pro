import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { CompanyAvailability } from '../entities/company-availability.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { Student } from '../entities/student.entity';
import { Drive, DriveSlot, DriveRegistration } from '../entities/drive.entity';
import { DriveCompanyJob } from '../entities/drive-company-job.entity';
import { DriveAttendance } from '../entities/drive-attendance.entity';
import { RoundMeeting, MeetingGroup, MeetingAssignment } from '../entities/round-meeting.entity';
import type { MeetingStatus } from '../entities/round-meeting.entity';
import { CreateJobDto, AddAvailabilityDto, MarkAttendanceDto, MarkRoundResultDto, SubmitRoundResultsDto, UpdateJobRoundsDto, CreateRoundMeetingDto, UpdateRoundMeetingDto } from './dto/company.dto';
import { EmailService } from '../admin/email.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

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
    @InjectRepository(DriveRegistration) private readonly driveRegRepo: Repository<DriveRegistration>,
    @InjectRepository(DriveCompanyJob) private readonly dcjRepo: Repository<DriveCompanyJob>,
    @InjectRepository(DriveAttendance) private readonly attendanceRepo: Repository<DriveAttendance>,
    @InjectRepository(RoundMeeting) private readonly roundMeetingRepo: Repository<RoundMeeting>,
    @InjectRepository(MeetingGroup) private readonly meetingGroupRepo: Repository<MeetingGroup>,
    @InjectRepository(MeetingAssignment) private readonly meetingAssignmentRepo: Repository<MeetingAssignment>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Helper ──────────────────────────────────────
  async getCompanyByUserId(userId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');
    return company;
  }

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

  async updateJobRounds(userId: string, jobId: string, dto: UpdateJobRoundsDto) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');

    job.roundsConfig = dto.roundsConfig as unknown as Record<string, unknown>[];
    job.numRounds = dto.roundsConfig.length;
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
      relations: ['student', 'student.batch', 'student.user'],
      order: { matchScore: 'DESC' },
    });

    return applications.map((app) => {
      const student = app.student;
      const pd = (student?.profileData || {}) as Record<string, unknown>;
      return {
        applicationId: app.id,
        studentId: app.studentId,
        studentName: student?.fullName,
        usn: student?.usn,
        department: student?.department,
        batchName: student?.batch?.name || null,
        semester: student?.semester,
        cgpa: student?.cgpa,
        matchScore: app.matchScore,
        atsScore: app.atsScore,
        currentRound: app.currentRound,
        finalResult: app.finalResult,
        // ─── Enhanced profile fields ───
        phone: student?.phone || null,
        email: student?.user?.email || null,
        gender: student?.gender || null,
        tenthPercent: student?.tenthPercent || null,
        twelfthPercent: student?.twelfthPercent || null,
        backlogs: student?.backlogs ?? 0,
        resumeLink: student?.resumeLink || null,
        driveLink: student?.driveLink || null,
        skills: (pd.skills as string[]) || [],
        certifications: (pd.certifications as string[]) || [],
        linkedin: (pd.linkedin as string) || null,
        github: (pd.github as string) || null,
        aboutMe: (pd.aboutMe as string) || null,
        profileComplete: student?.profileComplete || false,
      };
    });
  }

  async getStudentProfile(userId: string, studentId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    // Verify the student has applied to one of this company's jobs
    const jobs = await this.jobRepo.find({ where: { companyId: company.id } });
    if (jobs.length === 0) throw new NotFoundException('No jobs found');

    const jobIds = jobs.map(j => j.id);
    const application = await this.applicationRepo.findOne({
      where: { studentId, jobId: In(jobIds), adminApproved: true },
    });
    if (!application) throw new ForbiddenException('Student has not applied to your jobs');

    // Get full student profile
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['user', 'batch'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const pd = (student.profileData || {}) as Record<string, unknown>;
    return {
      id: student.id,
      fullName: student.fullName,
      usn: student.usn,
      department: student.department,
      batchName: student.batch?.name || null,
      semester: student.semester,
      cgpa: student.cgpa,
      email: student.user?.email || null,
      phone: student.phone || null,
      gender: student.gender || null,
      dateOfBirth: student.dateOfBirth || null,
      tenthPercent: student.tenthPercent || null,
      tenthBoard: student.tenthBoard || null,
      tenthYear: student.tenthYear || null,
      twelfthPercent: student.twelfthPercent || null,
      twelfthBoard: student.twelfthBoard || null,
      twelfthYear: student.twelfthYear || null,
      twelfthStream: student.twelfthStream || null,
      backlogs: student.backlogs ?? 0,
      resumeLink: student.resumeLink || null,
      driveLink: student.driveLink || null,
      familyIncome: student.familyIncome || null,
      category: student.category || null,
      profileComplete: student.profileComplete || false,
      placementStatus: student.placementStatus,
      skills: (pd.skills as string[]) || [],
      certifications: (pd.certifications as string[]) || [],
      linkedin: (pd.linkedin as string) || null,
      github: (pd.github as string) || null,
      aboutMe: (pd.aboutMe as string) || null,
      tenthMarksCardLink: (pd.tenthMarksCardLink as string) || null,
      twelfthMarksCardLink: (pd.twelfthMarksCardLink as string) || null,
      qualificationType: (pd.qualificationType as string) || '12th',
      diplomaBranch: (pd.diplomaBranch as string) || null,
    };
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

    // After existing drive lookup, also find drives via DriveCompanyJob
    const dcjDriveIds = await this.dcjRepo.find({
      where: { companyId: company.id },
      select: ['driveId'],
    });
    const additionalDriveIds = dcjDriveIds.map(d => d.driveId).filter(id => !drives.some(d => d.id === id));
    if (additionalDriveIds.length > 0) {
      const additionalDrives = await this.driveRepo.find({
        where: { id: In(additionalDriveIds) },
        relations: ['job', 'slots'],
        order: { createdAt: 'DESC' },
      });
      drives.push(...additionalDrives);
    }

    // Collect all jobIds from d.jobIds across all matching drives
    const allJobIds = [...new Set(drives.flatMap((d) => d.jobIds || (d.jobId ? [d.jobId] : [])))];
    
    // Fetch all these jobs in one query
    let allJobsMap = new Map<string, Job>();
    if (allJobIds.length > 0) {
      const jobsList = await this.jobRepo.find({ where: { id: In(allJobIds) } });
      allJobsMap = new Map(jobsList.map((j) => [j.id, j]));
    }

    // Get approved registration counts for each drive
    const driveIds = drives.map((d) => d.id);
    const approvedCounts: Record<string, number> = {};
    if (driveIds.length > 0) {
      const counts = await this.driveRegRepo
        .createQueryBuilder('reg')
        .select('reg.driveId', 'driveId')
        .addSelect('COUNT(*)', 'count')
        .where('reg.driveId IN (:...driveIds)', { driveIds })
        .andWhere('reg.status = :status', { status: 'approved' })
        .groupBy('reg.driveId')
        .getRawMany();
      counts.forEach((c) => { approvedCounts[c.driveId] = parseInt(c.count, 10); });
    }

    return drives.map((drive) => {
      const driveJobIds = drive.jobIds && drive.jobIds.length > 0 ? drive.jobIds : (drive.jobId ? [drive.jobId] : []);
      const matchedJobs = driveJobIds.map((id) => allJobsMap.get(id)).filter(Boolean) as Job[];
      
      const jobTitles = matchedJobs.length > 0 
        ? matchedJobs.map((j) => j.title).join(', ') 
        : (drive.job?.title || 'Unknown');

      return {
        id: drive.id,
        title: drive.title,
        status: drive.status,
        driveDate: drive.driveDate,
        departments: drive.departments,
        jobTitle: jobTitles,
        approvedStudents: approvedCounts[drive.id] || 0,
        slots: (drive.slots || []).map((s) => ({
          id: s.id,
          timeSlot: s.timeSlot,
          classroom: s.classroom,
          departments: s.departments,
          studentCount: s.studentCount,
        })),
        createdAt: drive.createdAt,
      };
    });
  }

  async getDriveAttendees(userId: string, driveId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    // Verify company is part of this drive
    const dcjs = await this.dcjRepo.find({
      where: { driveId, companyId: company.id },
      relations: ['job'],
    });
    
    // Also check single-company drives
    if (dcjs.length === 0) {
      const drive = await this.driveRepo.findOne({ where: { id: driveId } });
      if (!drive) throw new NotFoundException('Drive not found');
      // Fall back to checking if any of company's jobs are in the drive
      const companyJobs = await this.jobRepo.find({ where: { companyId: company.id } });
      const companyJobIds = companyJobs.map(j => j.id);
      const driveJobIds = drive.jobIds && drive.jobIds.length > 0 ? drive.jobIds : (drive.jobId ? [drive.jobId] : []);
      const overlap = driveJobIds.filter(id => companyJobIds.includes(id));
      if (overlap.length === 0) throw new ForbiddenException('You are not part of this drive');
    }

    // Get all attendance records for this company in this drive
    const attendances = await this.attendanceRepo.find({
      where: { driveId, companyId: company.id },
      relations: ['job'],
    });

    if (attendances.length === 0) return { jobs: [], totalAttendees: 0 };

    // Get student details
    const studentIds = [...new Set(attendances.map(a => a.studentId))];
    const students = await this.studentRepo.find({
      where: { id: In(studentIds) },
      relations: ['user', 'batch'],
    });
    const studentMap = new Map(students.map(s => [s.id, s]));

    // Group by job
    const jobMap = new Map<string, { jobId: string; jobTitle: string; students: Array<{ studentId: string; fullName: string; usn: string; department: string; cgpa: number | null; email: string; phone: string | null; semester: number | null; resumeLink: string | null; driveLink: string | null; attendedAt: Date }> }>();

    for (const att of attendances) {
      if (!jobMap.has(att.jobId)) {
        jobMap.set(att.jobId, {
          jobId: att.jobId,
          jobTitle: att.job?.title || 'Unknown',
          students: [],
        });
      }
      const student = studentMap.get(att.studentId);
      if (student) {
        jobMap.get(att.jobId)!.students.push({
          studentId: student.id,
          fullName: student.fullName,
          usn: student.usn,
          department: student.department,
          cgpa: student.cgpa,
          email: student.user?.email || '',
          phone: student.phone,
          semester: student.semester,
          resumeLink: student.resumeLink,
          driveLink: student.driveLink,
          attendedAt: att.createdAt,
        });
      }
    }

    return {
      jobs: Array.from(jobMap.values()),
      totalAttendees: studentIds.length,
    };
  }

  // ─── Bulk Round Results ─────────────────────────
  async submitRoundResults(userId: string, jobId: string, dto: SubmitRoundResultsDto) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');

    const round = dto.round;
    if (round < 1 || round > job.numRounds) {
      throw new BadRequestException(`Invalid round ${round}. Job has ${job.numRounds} rounds.`);
    }

    // Get all approved applications currently at this round
    const applications = await this.applicationRepo.find({
      where: { jobId, adminApproved: true, currentRound: round, finalResult: 'pending' },
      relations: ['student', 'student.user'],
    });

    if (applications.length === 0) {
      throw new BadRequestException('No pending candidates found for this round');
    }

    const selectedIds = new Set(dto.selectedStudentIds);
    const isFinalRound = round >= job.numRounds;
    const loginUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/login';

    let selectedCount = 0;
    let rejectedCount = 0;

    for (const app of applications) {
      const isSelected = selectedIds.has(app.studentId);

      if (isSelected) {
        if (isFinalRound) {
          app.finalResult = 'selected';
          app.offeredCtcLpa = job.ctcMaxLpa;
          if (app.student) {
            app.student.placementStatus = 'placed';
            await this.studentRepo.save(app.student);
          }
        } else {
          app.currentRound = round + 1;
        }
        selectedCount++;

        // In-app notification
        if (app.student) {
          await this.notificationRepo.save({
            userId: app.student.userId,
            type: isFinalRound ? 'placed' : 'round_selected',
            title: isFinalRound
              ? `🎉 Placed at ${company.name}!`
              : `✅ Round ${round} Cleared — ${job.title}`,
            body: isFinalRound
              ? `Congratulations! You have been selected for the ${job.title} role.`
              : `You cleared Round ${round}. Prepare for Round ${round + 1}.`,
            metadata: { jobId, applicationId: app.id, round },
          });

          // Email (async via event emitter)
          if (app.student.user?.email) {
            this.eventEmitter.emit('email.round_selected', {
              type: 'round_selected',
              email: app.student.user.email,
              studentName: app.student.fullName,
              jobTitle: job.title,
              companyName: company.name,
              roundNumber: round,
              totalRounds: job.numRounds,
              loginUrl,
            });
          }
        }
      } else {
        app.finalResult = 'rejected';
        rejectedCount++;

        // In-app notification
        if (app.student) {
          await this.notificationRepo.save({
            userId: app.student.userId,
            type: 'round_rejected',
            title: `Round ${round} Result — ${job.title}`,
            body: `Thank you for participating. Unfortunately, you were not selected to advance.`,
            metadata: { jobId, applicationId: app.id, round },
          });

          // Email (async via event emitter)
          if (app.student.user?.email) {
            this.eventEmitter.emit('email.round_rejected', {
              type: 'round_rejected',
              email: app.student.user.email,
              studentName: app.student.fullName,
              jobTitle: job.title,
              companyName: company.name,
              roundNumber: round,
              loginUrl,
            });
          }
        }
      }

      await this.applicationRepo.save(app);
    }

    return {
      round,
      totalProcessed: applications.length,
      selected: selectedCount,
      rejected: rejectedCount,
      isFinalRound,
    };
  }

  // ─── Round Meetings ─────────────────────────────────
  async createRoundMeeting(userId: string, dto: CreateRoundMeetingDto) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: dto.jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');

    if (dto.roundNumber < 1 || dto.roundNumber > job.numRounds) {
      throw new BadRequestException(`Invalid round ${dto.roundNumber}. Job has ${job.numRounds} rounds.`);
    }

    const meeting = await this.roundMeetingRepo.save({
      jobId: dto.jobId,
      roundNumber: dto.roundNumber,
      meetingType: dto.meetingType as 'virtual' | 'group_discussion' | 'one_on_one',
      meetingLink: dto.meetingLink || null,
      scheduledDate: dto.scheduledDate || null,
      scheduledTime: dto.scheduledTime || null,
      venue: dto.venue || null,
      instructions: dto.instructions || null,
      status: 'scheduled' as const,
    });

    const applications = await this.applicationRepo.find({
      where: { jobId: dto.jobId, adminApproved: true, currentRound: dto.roundNumber, finalResult: 'pending' },
      relations: ['student', 'student.user'],
    });

    const loginUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/login';

    if (dto.meetingType === 'virtual') {
      for (const app of applications) {
        await this.meetingAssignmentRepo.save({
          roundMeetingId: meeting.id,
          applicationId: app.id,
          studentId: app.studentId,
          status: 'notified' as const,
        });

        if (app.student) {
          await this.notificationRepo.save({
            userId: app.student.userId,
            type: 'meeting_scheduled',
            title: `📹 Virtual Meeting — ${job.title} Round ${dto.roundNumber}`,
            body: `A virtual meeting has been scheduled. ${dto.meetingLink ? 'Join link: ' + dto.meetingLink : 'Check your dashboard for details.'}`,
            metadata: { jobId: job.id, meetingId: meeting.id, meetingLink: dto.meetingLink, roundNumber: dto.roundNumber },
          });

          if (app.student.user?.email) {
            this.eventEmitter.emit('email.meeting_scheduled', {
              email: app.student.user.email,
              studentName: app.student.fullName,
              jobTitle: job.title,
              companyName: company.name,
              roundNumber: dto.roundNumber,
              meetingType: 'virtual',
              meetingLink: dto.meetingLink || null,
              scheduledDate: dto.scheduledDate || null,
              scheduledTime: dto.scheduledTime || null,
              instructions: dto.instructions || null,
              groupName: null,
              loginUrl,
            });
          }
        }
      }
    } else if (dto.meetingType === 'group_discussion' && dto.groups) {
      for (const groupConfig of dto.groups) {
        const group = await this.meetingGroupRepo.save({
          roundMeetingId: meeting.id,
          groupName: groupConfig.groupName,
          meetingLink: groupConfig.meetingLink || null,
          scheduledDate: groupConfig.scheduledDate || null,
          scheduledTime: groupConfig.scheduledTime || null,
          maxParticipants: groupConfig.maxParticipants || null,
        });

        for (const studentId of groupConfig.studentIds) {
          const app = applications.find(a => a.studentId === studentId);
          if (app) {
            await this.meetingAssignmentRepo.save({
              roundMeetingId: meeting.id,
              meetingGroupId: group.id,
              applicationId: app.id,
              studentId: app.studentId,
              status: 'notified' as const,
            });

            if (app.student) {
              await this.notificationRepo.save({
                userId: app.student.userId,
                type: 'meeting_scheduled',
                title: `👥 Group Discussion — ${job.title} Round ${dto.roundNumber}`,
                body: `You are assigned to ${groupConfig.groupName}. ${groupConfig.meetingLink ? 'Join link: ' + groupConfig.meetingLink : 'Check your dashboard.'}`,
                metadata: { jobId: job.id, meetingId: meeting.id, groupId: group.id, groupName: groupConfig.groupName, meetingLink: groupConfig.meetingLink, roundNumber: dto.roundNumber },
              });

              if (app.student.user?.email) {
                this.eventEmitter.emit('email.meeting_scheduled', {
                  email: app.student.user.email,
                  studentName: app.student.fullName,
                  jobTitle: job.title,
                  companyName: company.name,
                  roundNumber: dto.roundNumber,
                  meetingType: 'group_discussion',
                  meetingLink: groupConfig.meetingLink || null,
                  scheduledDate: groupConfig.scheduledDate || dto.scheduledDate || null,
                  scheduledTime: groupConfig.scheduledTime || dto.scheduledTime || null,
                  instructions: dto.instructions || null,
                  groupName: groupConfig.groupName,
                  loginUrl,
                });
              }
            }
          }
        }
      }
    } else if (dto.meetingType === 'one_on_one' && dto.slots) {
      for (const slot of dto.slots) {
        const app = applications.find(a => a.studentId === slot.studentId);
        if (app) {
          await this.meetingAssignmentRepo.save({
            roundMeetingId: meeting.id,
            applicationId: app.id,
            studentId: app.studentId,
            personalLink: slot.personalLink || null,
            scheduledStart: slot.scheduledStart ? new Date(slot.scheduledStart) : null,
            scheduledEnd: slot.scheduledEnd ? new Date(slot.scheduledEnd) : null,
            status: 'notified' as const,
          });

          if (app.student) {
            await this.notificationRepo.save({
              userId: app.student.userId,
              type: 'meeting_scheduled',
              title: `🎯 Interview Scheduled — ${job.title} Round ${dto.roundNumber}`,
              body: `Your one-on-one interview has been scheduled. ${slot.personalLink ? 'Join link: ' + slot.personalLink : 'Check your dashboard for details.'}`,
              metadata: { jobId: job.id, meetingId: meeting.id, personalLink: slot.personalLink, roundNumber: dto.roundNumber },
            });

            if (app.student.user?.email) {
              this.eventEmitter.emit('email.meeting_scheduled', {
                email: app.student.user.email,
                studentName: app.student.fullName,
                jobTitle: job.title,
                companyName: company.name,
                roundNumber: dto.roundNumber,
                meetingType: 'one_on_one',
                meetingLink: slot.personalLink || null,
                scheduledDate: dto.scheduledDate || null,
                scheduledTime: slot.scheduledStart || null,
                instructions: dto.instructions || null,
                groupName: null,
                loginUrl,
              });
            }
          }
        }
      }
    }

    return this.roundMeetingRepo.findOne({
      where: { id: meeting.id },
      relations: ['groups', 'groups.assignments', 'assignments'],
    });
  }

  async getRoundMeetings(userId: string, jobId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const job = await this.jobRepo.findOne({ where: { id: jobId, companyId: company.id } });
    if (!job) throw new NotFoundException('Job not found');

    const meetings = await this.roundMeetingRepo.find({
      where: { jobId },
      relations: ['groups', 'groups.assignments', 'groups.assignments.student', 'assignments', 'assignments.student'],
      order: { roundNumber: 'ASC', createdAt: 'DESC' },
    });

    return meetings.map(m => ({
      id: m.id,
      jobId: m.jobId,
      roundNumber: m.roundNumber,
      meetingType: m.meetingType,
      meetingLink: m.meetingLink,
      scheduledDate: m.scheduledDate,
      scheduledTime: m.scheduledTime,
      venue: m.venue,
      instructions: m.instructions,
      status: m.status,
      createdAt: m.createdAt,
      groups: (m.groups || []).map(g => ({
        id: g.id,
        groupName: g.groupName,
        meetingLink: g.meetingLink,
        scheduledDate: g.scheduledDate,
        scheduledTime: g.scheduledTime,
        maxParticipants: g.maxParticipants,
        students: (g.assignments || []).map(a => ({
          studentId: a.studentId,
          studentName: a.student?.fullName || null,
          status: a.status,
        })),
      })),
      assignments: (m.assignments || []).map(a => ({
        id: a.id,
        studentId: a.studentId,
        studentName: a.student?.fullName || null,
        personalLink: a.personalLink,
        scheduledStart: a.scheduledStart,
        scheduledEnd: a.scheduledEnd,
        groupId: a.meetingGroupId,
        status: a.status,
      })),
    }));
  }

  async getRoundMeeting(userId: string, meetingId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const meeting = await this.roundMeetingRepo.findOne({
      where: { id: meetingId },
      relations: ['job', 'groups', 'groups.assignments', 'groups.assignments.student', 'assignments', 'assignments.student'],
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.job.companyId !== company.id) throw new ForbiddenException('Not authorized');

    return meeting;
  }

  async updateRoundMeeting(userId: string, meetingId: string, dto: UpdateRoundMeetingDto) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const meeting = await this.roundMeetingRepo.findOne({
      where: { id: meetingId },
      relations: ['job'],
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.job.companyId !== company.id) throw new ForbiddenException('Not authorized');

    if (dto.meetingLink !== undefined) meeting.meetingLink = dto.meetingLink;
    if (dto.scheduledDate !== undefined) meeting.scheduledDate = dto.scheduledDate;
    if (dto.scheduledTime !== undefined) meeting.scheduledTime = dto.scheduledTime;
    if (dto.venue !== undefined) meeting.venue = dto.venue;
    if (dto.instructions !== undefined) meeting.instructions = dto.instructions;
    if (dto.status !== undefined) meeting.status = dto.status as MeetingStatus;

    await this.roundMeetingRepo.save(meeting);
    return meeting;
  }

  async deleteRoundMeeting(userId: string, meetingId: string) {
    const company = await this.companyRepo.findOne({ where: { userId } });
    if (!company) throw new NotFoundException('Company profile not found');

    const meeting = await this.roundMeetingRepo.findOne({
      where: { id: meetingId },
      relations: ['job'],
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    if (meeting.job.companyId !== company.id) throw new ForbiddenException('Not authorized');

    await this.roundMeetingRepo.remove(meeting);
    return { message: 'Meeting deleted successfully' };
  }
}
