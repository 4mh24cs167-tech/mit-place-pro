import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Student } from '../entities/student.entity';
import { Department } from '../entities/department.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { Cv } from '../entities/cv.entity';
import { InterviewSlot } from '../entities/interview-slot.entity';
import { Notification } from '../entities/notification.entity';
import { Drive, DriveRegistration, DriveSlot } from '../entities/drive.entity';
import { MeetingAssignment } from '../entities/round-meeting.entity';
import { UpdateProfileDto, ApplyJobDto } from './dto/student.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Department) private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application) private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Cv) private readonly cvRepo: Repository<Cv>,
    @InjectRepository(InterviewSlot) private readonly slotRepo: Repository<InterviewSlot>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Drive) private readonly driveRepo: Repository<Drive>,
    @InjectRepository(DriveRegistration) private readonly driveRegRepo: Repository<DriveRegistration>,
    @InjectRepository(DriveSlot) private readonly driveSlotRepo: Repository<DriveSlot>,
    @InjectRepository(MeetingAssignment) private readonly meetingAssignmentRepo: Repository<MeetingAssignment>,
  ) {}

  // ─── Profile ────────────────────────────────────
  async getProfile(userId: string) {
    const student = await this.studentRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!student) throw new NotFoundException('Student profile not found');

    // Resolve department type for frontend
    const dept = await this.departmentRepo.findOne({ where: { code: student.department } });
    const result = {
      ...student,
      departmentType: dept?.type || 'UG',
      totalSemesters: dept?.totalSemesters || 8,
    };
    return result;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    // Basic info
    if (dto.fullName) student.fullName = dto.fullName;
    if (dto.phone) student.phone = dto.phone;
    if (dto.dateOfBirth) student.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender) student.gender = dto.gender;
    if (dto.semester !== undefined) student.semester = dto.semester;

    // Academic scores
    if (dto.tenthPercent !== undefined) student.tenthPercent = dto.tenthPercent;
    if (dto.tenthBoard) student.tenthBoard = dto.tenthBoard;
    if (dto.tenthYear !== undefined) student.tenthYear = dto.tenthYear;
    if (dto.twelfthPercent !== undefined) student.twelfthPercent = dto.twelfthPercent;
    if (dto.twelfthBoard) student.twelfthBoard = dto.twelfthBoard;
    if (dto.twelfthYear !== undefined) student.twelfthYear = dto.twelfthYear;
    if (dto.twelfthStream) student.twelfthStream = dto.twelfthStream;
    if (dto.cgpa !== undefined) student.cgpa = dto.cgpa;
    if (dto.activeBacklogs !== undefined) student.backlogs = dto.activeBacklogs;

    // Additional info
    if (dto.familyIncome !== undefined) student.familyIncome = dto.familyIncome;
    if (dto.category) student.category = dto.category;
    if (dto.driveLink !== undefined) student.driveLink = dto.driveLink;
    if (dto.resumeLink !== undefined) student.resumeLink = dto.resumeLink;
    if (dto.addressJson) student.addressJson = dto.addressJson;

    if (dto.profileData) {
      student.profileData = { ...(student.profileData || {}), ...dto.profileData };
    }
    if (dto.skills) {
      student.profileData = { ...(student.profileData || {}), skills: dto.skills };
    }
    if (dto.certifications) {
      student.profileData = { ...(student.profileData || {}), certifications: dto.certifications };
    }

    // Extended profile fields — stored in profileData JSONB
    if (dto.linkedin !== undefined) {
      student.profileData = { ...(student.profileData || {}), linkedin: dto.linkedin };
    }
    if (dto.github !== undefined) {
      student.profileData = { ...(student.profileData || {}), github: dto.github };
    }
    if (dto.aboutMe !== undefined) {
      student.profileData = { ...(student.profileData || {}), aboutMe: dto.aboutMe };
    }
    if (dto.tenthMarksCardLink !== undefined) {
      student.profileData = { ...(student.profileData || {}), tenthMarksCardLink: dto.tenthMarksCardLink };
    }
    if (dto.twelfthMarksCardLink !== undefined) {
      student.profileData = { ...(student.profileData || {}), twelfthMarksCardLink: dto.twelfthMarksCardLink };
    }

    // PG-specific fields — stored in profileData JSONB
    if (dto.ugDegreeName !== undefined) {
      student.profileData = { ...(student.profileData || {}), ugDegreeName: dto.ugDegreeName };
    }
    if (dto.ugUniversity !== undefined) {
      student.profileData = { ...(student.profileData || {}), ugUniversity: dto.ugUniversity };
    }
    if (dto.ugCgpa !== undefined) {
      student.profileData = { ...(student.profileData || {}), ugCgpa: dto.ugCgpa };
    }
    if (dto.ugYearOfPassing !== undefined) {
      student.profileData = { ...(student.profileData || {}), ugYearOfPassing: dto.ugYearOfPassing };
    }

    // Calculate profile completeness — all 7 mandatory fields must be filled
    const mandatoryFields = [
      student.fullName,
      student.phone,
      student.dateOfBirth,
      student.gender,
      student.tenthPercent,
      student.twelfthPercent,
      student.cgpa,
    ];
    student.profileComplete = mandatoryFields.every((f) => f !== null && f !== undefined && f !== '');

    await this.studentRepo.save(student);
    return student;
  }

  async updateProfilePhoto(userId: string, s3Key: string): Promise<Student> {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    student.photoS3Key = s3Key;
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
        companyLogo: job.company?.name?.charAt(0) || '?',
        description: job.description,
        ctcMinLpa: job.ctcMinLpa,
        ctcMaxLpa: job.ctcMaxLpa,
        totalVacancies: job.totalVacancies,
        workMode: job.workMode,
        workLocation: job.workLocation,
        requiredSkills: job.requiredSkills,
        allowedDepartments: job.allowedDepartments,
        jobType: job.jobType || 'placement',
        isUnpaid: job.isUnpaid || false,
        internshipDuration: job.internshipDuration,
        stipendAmount: job.stipendAmount,
        joiningDate: job.joiningDate,
        bondYears: job.bondYears,
        createdAt: job.createdAt,
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

  // ─── Available Drives (opt-in workflow) ─────────
  async getAvailableDrives(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    // Get all open drives that match the student's department
    const drives = await this.driveRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .where('d.status = :status', { status: 'open' })
      .orderBy('d.createdAt', 'DESC')
      .getMany();

    // Filter drives matching student's department
    const matchingDrives = drives.filter((d) =>
      !d.departments || d.departments.length === 0 || d.departments.includes(student.department),
    );

    if (matchingDrives.length === 0) return [];

    // Collect all jobIds from d.jobIds across matching drives
    const allJobIds = [...new Set(matchingDrives.flatMap((d) => d.jobIds || (d.jobId ? [d.jobId] : [])))];
    
    // Fetch all these jobs in one query
    let allJobsMap = new Map<string, Job>();
    if (allJobIds.length > 0) {
      const jobs = await this.jobRepo.find({ where: { id: In(allJobIds) }, relations: ['company'] });
      allJobsMap = new Map(jobs.map((j) => [j.id, j]));
    }

    // Check which drives the student already registered for
    const driveIds = matchingDrives.map((d) => d.id);
    const existingRegs = await this.driveRegRepo.find({
      where: { studentId: student.id, driveId: In(driveIds) },
    });
    const registeredDriveIds = new Set(existingRegs.map((r) => r.driveId));

    return matchingDrives.map((drive) => {
      const registered = registeredDriveIds.has(drive.id);
      const reg = existingRegs.find((r) => r.driveId === drive.id);

      // Resolve multiple jobs
      const jobIds = drive.jobIds && drive.jobIds.length > 0 ? drive.jobIds : (drive.jobId ? [drive.jobId] : []);
      const matchedJobs = jobIds.map((id) => allJobsMap.get(id)).filter(Boolean) as Job[];
      
      const companyName = matchedJobs[0]?.company?.name || drive.job?.company?.name || 'Unknown';
      const jobTitles = matchedJobs.length > 0 
        ? matchedJobs.map((j) => j.title).join(', ') 
        : (drive.job?.title || 'Unknown');

      // CTC Range
      let ctcRange: string | null = null;
      if (matchedJobs.length > 0) {
        const ctcs = matchedJobs.map(j => j.ctcMaxLpa).filter((c): c is number => c !== null && c !== undefined);
        const minCtc = Math.min(...matchedJobs.map(j => j.ctcMinLpa || 0));
        const maxCtc = ctcs.length > 0 ? Math.max(...ctcs) : 0;
        ctcRange = `${minCtc} - ${maxCtc} LPA`;
      } else if (drive.job) {
        ctcRange = `${drive.job.ctcMinLpa || 0} - ${drive.job.ctcMaxLpa || 0} LPA`;
      }

      return {
        id: drive.id,
        title: drive.title,
        type: drive.type,
        status: drive.status,
        driveDate: drive.driveDate,
        departments: drive.departments,
        description: drive.description,
        company: companyName,
        jobTitle: jobTitles,
        ctcRange,
        alreadyRegistered: registered,
        registrationStatus: reg?.status || null,
        createdAt: drive.createdAt,
      };
    });
  }

  // ─── Register for a Drive (student opts in) ────
  async registerForDrive(userId: string, driveId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const drive = await this.driveRepo.findOne({
      where: { id: driveId },
      relations: ['job', 'job.company'],
    });
    if (!drive) throw new NotFoundException('Drive not found');
    if (drive.status !== 'open') throw new BadRequestException('This drive is no longer accepting registrations');

    // Check if already registered
    const existing = await this.driveRegRepo.findOne({
      where: { driveId, studentId: student.id },
    });
    if (existing) throw new ConflictException('You have already registered for this drive');

    // Resolve multiple jobs
    const jobIds = drive.jobIds && drive.jobIds.length > 0 ? drive.jobIds : (drive.jobId ? [drive.jobId] : []);
    const jobs = jobIds.length > 0 ? await this.jobRepo.find({ where: { id: In(jobIds) }, relations: ['company'] }) : [];

    // Check eligibility
    const eligibleDepts = drive.departments && drive.departments.length > 0 
      ? drive.departments 
      : [...new Set(jobs.flatMap(j => j.allowedDepartments || []))];

    if (eligibleDepts.length > 0 && !eligibleDepts.includes(student.department)) {
      throw new BadRequestException('Your department is not eligible for this drive');
    }

    const minCgpas = jobs.map(j => j.minCgpa).filter(c => c != null && c > 0);
    if (minCgpas.length > 0) {
      const minCgpa = Math.min(...minCgpas);
      if ((student.cgpa ?? 0) < minCgpa) {
        throw new BadRequestException(`You do not meet the minimum CGPA requirement of ${minCgpa} for this drive`);
      }
    }

    // Create pending registration
    const registration = await this.driveRegRepo.save({
      driveId,
      studentId: student.id,
      status: 'pending' as const,
    });

    const companyName = jobs[0]?.company?.name || drive.job?.company?.name || 'A company';

    return {
      id: registration.id,
      driveTitle: drive.title,
      company: companyName,
      status: 'pending',
      message: 'You have registered for this drive. Your registration is pending admin approval.',
    };
  }

  // ─── Decline a Drive (student opts out) ─────────
  async declineDrive(userId: string, driveId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    const registration = await this.driveRegRepo.findOne({
      where: { driveId, studentId: student.id },
    });

    if (!registration) {
      // Student wasn't registered — create a declined entry
      await this.driveRegRepo.save({
        driveId,
        studentId: student.id,
        status: 'declined' as const,
      });
      return { message: 'You have declined this drive.' };
    }

    if (registration.status === 'declined') {
      throw new ConflictException('You have already declined this drive');
    }

    // Update existing registration to declined
    registration.status = 'declined' as const;
    await this.driveRegRepo.save(registration);

    return { message: 'You have declined this drive.' };
  }

  // ─── My Drive Registrations (all statuses) ─────
  async getMyDriveAllocations(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    // Find ALL drive registrations for this student (not just approved)
    const registrations = await this.driveRegRepo.find({
      where: { studentId: student.id },
    });

    if (registrations.length === 0) return [];

    const driveIds = [...new Set(registrations.map((r) => r.driveId))];

    // Get drives with slots and job/company info
    const drives = await this.driveRepo.find({
      where: { id: In(driveIds) },
      relations: ['job', 'job.company', 'slots'],
      order: { createdAt: 'DESC' },
    });

    // Collect all jobIds from d.jobIds across matches
    const allJobIds = [...new Set(drives.flatMap((d) => d.jobIds || (d.jobId ? [d.jobId] : [])))];
    
    // Fetch all these jobs in one query
    let allJobsMap = new Map<string, Job>();
    if (allJobIds.length > 0) {
      const jobs = await this.jobRepo.find({ where: { id: In(allJobIds) }, relations: ['company'] });
      allJobsMap = new Map(jobs.map((j) => [j.id, j]));
    }

    const regMap = new Map(registrations.map((r) => [r.driveId, r]));

    return drives.map((drive) => {
      const reg = regMap.get(drive.id);
      // Filter slots to only those matching the student's department
      const mySlots = (drive.slots || []).filter(
        (slot) => slot.departments.includes(student.department),
      );

      // Resolve multiple jobs
      const jobIds = drive.jobIds && drive.jobIds.length > 0 ? drive.jobIds : (drive.jobId ? [drive.jobId] : []);
      const matchedJobs = jobIds.map((id) => allJobsMap.get(id)).filter(Boolean) as Job[];
      
      const companyName = matchedJobs[0]?.company?.name || drive.job?.company?.name || 'Unknown';
      const jobTitles = matchedJobs.length > 0 
        ? matchedJobs.map((j) => j.title).join(', ') 
        : (drive.job?.title || 'Unknown');

      return {
        driveId: drive.id,
        title: drive.title,
        status: drive.status,
        driveDate: drive.driveDate,
        company: companyName,
        jobTitle: jobTitles,
        registrationStatus: reg?.status || 'pending',
        rejectionReason: reg?.rejectionReason || null,
        slots: reg?.status === 'approved' ? mySlots.map((s) => ({
          id: s.id,
          timeSlot: s.timeSlot,
          classroom: s.classroom,
          departments: s.departments,
          studentCount: s.studentCount,
        })) : [], // Only show slots if approved
      };
    });
  }

  // ─── Meetings ──────────────────────────────────────
  async getMyMeetings(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const assignments = await this.meetingAssignmentRepo.find({
      where: { studentId: student.id },
      relations: ['roundMeeting', 'roundMeeting.job', 'roundMeeting.job.company', 'meetingGroup'],
      order: { createdAt: 'DESC' },
    });

    return assignments.map(a => ({
      id: a.id,
      meetingType: a.roundMeeting?.meetingType,
      roundNumber: a.roundMeeting?.roundNumber,
      jobTitle: a.roundMeeting?.job?.title || null,
      companyName: a.roundMeeting?.job?.company?.name || null,
      meetingLink: a.personalLink || a.meetingGroup?.meetingLink || a.roundMeeting?.meetingLink || null,
      scheduledDate: a.roundMeeting?.scheduledDate || a.meetingGroup?.scheduledDate || null,
      scheduledTime: a.roundMeeting?.scheduledTime || a.meetingGroup?.scheduledTime || null,
      venue: a.roundMeeting?.venue || null,
      instructions: a.roundMeeting?.instructions || null,
      groupName: a.meetingGroup?.groupName || null,
      personalLink: a.personalLink,
      scheduledStart: a.scheduledStart,
      scheduledEnd: a.scheduledEnd,
      status: a.status,
      meetingStatus: a.roundMeeting?.status,
      createdAt: a.createdAt,
    }));
  }
}
