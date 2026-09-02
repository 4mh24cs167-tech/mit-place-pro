import { Injectable, Logger, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { StudentDriveFeedback } from '../entities/feedback.entity';
import { CompanyDriveFeedback } from '../entities/feedback.entity';
import { Drive } from '../entities/drive.entity';
import { DriveRegistration } from '../entities/drive.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectRepository(StudentDriveFeedback) private readonly studentFeedbackRepo: Repository<StudentDriveFeedback>,
    @InjectRepository(CompanyDriveFeedback) private readonly companyFeedbackRepo: Repository<CompanyDriveFeedback>,
    @InjectRepository(Drive) private readonly driveRepo: Repository<Drive>,
    @InjectRepository(DriveRegistration) private readonly regRepo: Repository<DriveRegistration>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
  ) {}

  // ─── Student submits feedback ──────────────────
  async submitStudentFeedback(studentId: string, driveId: string, data: Partial<StudentDriveFeedback>) {
    // Check drive exists
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    // Check student registered for this drive
    const reg = await this.regRepo.findOne({ where: { driveId, studentId } });
    if (!reg) throw new NotFoundException('You are not registered for this drive');

    // Check if already submitted
    const existing = await this.studentFeedbackRepo.findOne({ where: { driveId, studentId } });
    if (existing) throw new ConflictException('Feedback already submitted for this drive');

    const feedback = this.studentFeedbackRepo.create({
      driveId,
      studentId,
      overallRating: data.overallRating,
      processRating: data.processRating,
      communicationRating: data.communicationRating,
      difficultyLevel: data.difficultyLevel,
      roundsFaced: data.roundsFaced,
      interviewExperience: data.interviewExperience,
      questionsAsked: data.questionsAsked || null,
      tips: data.tips || null,
      wouldRecommend: data.wouldRecommend ?? true,
      comments: data.comments || null,
    });

    await this.studentFeedbackRepo.save(feedback);
    this.logger.log(`Student ${studentId} submitted feedback for drive ${driveId}`);
    return { message: 'Feedback submitted successfully', id: feedback.id };
  }

  // ─── Get drives needing feedback ───────────────
  async getPendingFeedback(studentId: string) {
    // Find drives where student registered and drive is completed/scheduled
    const registrations = await this.regRepo.find({
      where: { studentId, status: In(['approved', 'pending']) },
    });

    if (registrations.length === 0) return [];

    const driveIds = registrations.map(r => r.driveId);

    // Find completed drives
    const drives = await this.driveRepo.find({
      where: { id: In(driveIds), status: In(['completed', 'scheduled']) },
    });

    if (drives.length === 0) return [];

    // Find already submitted feedback
    const submitted = await this.studentFeedbackRepo.find({
      where: { studentId, driveId: In(drives.map(d => d.id)) },
      select: ['driveId'],
    });
    const submittedIds = new Set(submitted.map(f => f.driveId));

    // Return drives without feedback
    return drives
      .filter(d => !submittedIds.has(d.id))
      .map(d => ({ driveId: d.id, driveTitle: d.title, driveDate: d.driveDate, status: d.status }));
  }

  // ─── Company submits overall drive feedback ─────
  async submitCompanyFeedback(companyId: string, driveId: string, data: Partial<CompanyDriveFeedback>) {
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    const participation = await this.driveRepo.manager.query(
      `SELECT 1 FROM drive_company_jobs dcj JOIN jobs j ON dcj.job_id = j.id WHERE dcj.drive_id = $1 AND j.company_id = $2 LIMIT 1`,
      [driveId, companyId]
    );
    if (!participation.length) {
      throw new ForbiddenException('Company did not participate in this drive');
    }

    const existing = await this.companyFeedbackRepo.findOne({ where: { driveId, companyId } });
    if (existing) throw new ConflictException('Feedback already submitted for this drive');

    const feedback = this.companyFeedbackRepo.create({
      driveId,
      companyId,
      overallRating: data.overallRating,
      studentQualityRating: data.studentQualityRating,
      organizationRating: data.organizationRating,
      infrastructureRating: data.infrastructureRating,
      communicationRating: data.communicationRating,
      whatWentWell: data.whatWentWell || null,
      areasOfImprovement: data.areasOfImprovement || null,
      suggestions: data.suggestions || null,
      wouldReturn: data.wouldReturn ?? true,
      comments: data.comments || null,
    });

    await this.companyFeedbackRepo.save(feedback);
    this.logger.log(`Company ${companyId} submitted feedback for drive ${driveId}`);
    return { message: 'Feedback submitted successfully', id: feedback.id };
  }

  // ─── Admin: student feedback for drive ─────────
  async getStudentFeedbackForDrive(driveId: string) {
    const feedback = await this.studentFeedbackRepo.find({
      where: { driveId },
      order: { createdAt: 'DESC' },
    });

    const studentIds = feedback.map(f => f.studentId);
    const students = studentIds.length > 0
      ? await this.studentRepo.find({ where: { id: In(studentIds) }, select: ['id', 'fullName', 'usn', 'department'] })
      : [];
    const studentMap = new Map(students.map(s => [s.id, s]));

    return feedback.map(f => ({
      ...f,
      student: studentMap.get(f.studentId) || null,
    }));
  }

  // ─── Admin: company drive feedback ─────────────
  async getCompanyFeedbackForDrive(driveId: string) {
    return this.companyFeedbackRepo.find({
      where: { driveId },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Admin: feedback summary/stats ─────────────
  async getDriveFeedbackSummary(driveId: string) {
    const studentFeedback = await this.studentFeedbackRepo.find({ where: { driveId } });
    const companyFeedback = await this.companyFeedbackRepo.find({ where: { driveId } });

    const totalStudentFeedbacks = studentFeedback.length;
    const totalCompanyFeedbacks = companyFeedback.length;

    // Student averages
    const avgOverall = totalStudentFeedbacks > 0 ? studentFeedback.reduce((s, f) => s + f.overallRating, 0) / totalStudentFeedbacks : 0;
    const avgProcess = totalStudentFeedbacks > 0 ? studentFeedback.reduce((s, f) => s + f.processRating, 0) / totalStudentFeedbacks : 0;
    const avgComm = totalStudentFeedbacks > 0 ? studentFeedback.reduce((s, f) => s + f.communicationRating, 0) / totalStudentFeedbacks : 0;

    const difficultyBreakdown = { easy: 0, moderate: 0, hard: 0 };
    studentFeedback.forEach(f => { if (f.difficultyLevel in difficultyBreakdown) difficultyBreakdown[f.difficultyLevel as keyof typeof difficultyBreakdown]++; });

    const recommendCount = studentFeedback.filter(f => f.wouldRecommend).length;
    const recommendPercent = totalStudentFeedbacks > 0 ? Math.round((recommendCount / totalStudentFeedbacks) * 100) : 0;

    // Company averages (overall drive feedback)
    const avgCompOverall = totalCompanyFeedbacks > 0 ? companyFeedback.reduce((s, f) => s + f.overallRating, 0) / totalCompanyFeedbacks : 0;
    const avgStudentQuality = totalCompanyFeedbacks > 0 ? companyFeedback.reduce((s, f) => s + f.studentQualityRating, 0) / totalCompanyFeedbacks : 0;
    const avgOrganization = totalCompanyFeedbacks > 0 ? companyFeedback.reduce((s, f) => s + f.organizationRating, 0) / totalCompanyFeedbacks : 0;
    const avgInfra = totalCompanyFeedbacks > 0 ? companyFeedback.reduce((s, f) => s + f.infrastructureRating, 0) / totalCompanyFeedbacks : 0;

    const returnCount = companyFeedback.filter(f => f.wouldReturn).length;
    const wouldReturnPercent = totalCompanyFeedbacks > 0 ? Math.round((returnCount / totalCompanyFeedbacks) * 100) : 0;

    return {
      studentFeedback: {
        total: totalStudentFeedbacks,
        avgOverallRating: +avgOverall.toFixed(1),
        avgProcessRating: +avgProcess.toFixed(1),
        avgCommunicationRating: +avgComm.toFixed(1),
        difficultyBreakdown,
        recommendPercent,
      },
      companyFeedback: {
        total: totalCompanyFeedbacks,
        avgOverallRating: +avgCompOverall.toFixed(1),
        avgStudentQualityRating: +avgStudentQuality.toFixed(1),
        avgOrganizationRating: +avgOrganization.toFixed(1),
        avgInfrastructureRating: +avgInfra.toFixed(1),
        wouldReturnPercent,
      },
    };
  }

  // ─── Student: own feedback list ────────────────
  async getMyFeedback(studentId: string) {
    const feedback = await this.studentFeedbackRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });

    const driveIds = feedback.map(f => f.driveId);
    const drives = driveIds.length > 0
      ? await this.driveRepo.find({ where: { id: In(driveIds) }, select: ['id', 'title', 'driveDate'] })
      : [];
    const driveMap = new Map(drives.map(d => [d.id, d]));

    return feedback.map(f => ({
      ...f,
      drive: driveMap.get(f.driveId) || null,
    }));
  }

  // ─── Company: own feedback for drives ──────────
  async getCompanyFeedbackByCompany(companyId: string) {
    return this.companyFeedbackRepo.find({
      where: { companyId },
      relations: ['drive'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Company: pending drives needing feedback ──
  async getCompanyPendingFeedback(companyId: string) {
    // Drives are linked to companies through Jobs (Drive.jobId -> Job.companyId)
    const drives = await this.driveRepo
      .createQueryBuilder('d')
      .innerJoin('jobs', 'j', 'j.id = d.job_id')
      .where('j.company_id = :companyId', { companyId })
      .andWhere('d.status IN (:...statuses)', { statuses: ['completed', 'scheduled'] })
      .select(['d.id', 'd.title', 'd.drive_date', 'd.status'])
      .getRawMany();

    if (drives.length === 0) return [];

    const driveIds = drives.map((d: Record<string, string>) => d.d_id);
    const submitted = await this.companyFeedbackRepo.find({
      where: { companyId, driveId: In(driveIds) },
      select: ['driveId'],
    });
    const submittedIds = new Set(submitted.map(f => f.driveId));

    return drives
      .filter((d: Record<string, string>) => !submittedIds.has(d.d_id))
      .map((d: Record<string, string>) => ({
        driveId: d.d_id,
        driveTitle: d.d_title,
        driveDate: d.d_drive_date,
        status: d.d_status,
      }));
  }

  // ─── userId wrappers for student controller ─────
  private async resolveStudent(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  async submitStudentFeedbackByUserId(userId: string, driveId: string, data: Partial<StudentDriveFeedback>) {
    const student = await this.resolveStudent(userId);
    return this.submitStudentFeedback(student.id, driveId, data);
  }

  async getMyFeedbackByUserId(userId: string) {
    const student = await this.resolveStudent(userId);
    return this.getMyFeedback(student.id);
  }

  async getPendingFeedbackByUserId(userId: string) {
    const student = await this.resolveStudent(userId);
    return this.getPendingFeedback(student.id);
  }
}
