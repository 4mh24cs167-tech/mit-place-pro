import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { StudentDriveFeedback } from '../entities/feedback.entity';
import { CompanyStudentFeedback } from '../entities/feedback.entity';
import { Drive } from '../entities/drive.entity';
import { DriveRegistration } from '../entities/drive.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    @InjectRepository(StudentDriveFeedback) private readonly studentFeedbackRepo: Repository<StudentDriveFeedback>,
    @InjectRepository(CompanyStudentFeedback) private readonly companyFeedbackRepo: Repository<CompanyStudentFeedback>,
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

  // ─── Company submits feedback on student ───────
  async submitCompanyFeedback(companyId: string, driveId: string, studentId: string, data: Partial<CompanyStudentFeedback>) {
    const drive = await this.driveRepo.findOne({ where: { id: driveId } });
    if (!drive) throw new NotFoundException('Drive not found');

    const existing = await this.companyFeedbackRepo.findOne({ where: { driveId, studentId, companyId } });
    if (existing) throw new ConflictException('Feedback already submitted for this student');

    const feedback = this.companyFeedbackRepo.create({
      driveId,
      studentId,
      companyId,
      technicalRating: data.technicalRating,
      communicationRating: data.communicationRating,
      attitudeRating: data.attitudeRating,
      overallRating: data.overallRating,
      strengths: data.strengths || null,
      areasOfImprovement: data.areasOfImprovement || null,
      remarks: data.remarks || null,
      recommendForHire: data.recommendForHire || 'maybe',
    });

    await this.companyFeedbackRepo.save(feedback);
    this.logger.log(`Company ${companyId} submitted feedback for student ${studentId} in drive ${driveId}`);
    return { message: 'Feedback submitted successfully', id: feedback.id };
  }

  // ─── Admin: student feedback for drive ─────────
  async getStudentFeedbackForDrive(driveId: string) {
    const feedback = await this.studentFeedbackRepo.find({
      where: { driveId },
      order: { createdAt: 'DESC' },
    });

    // Enrich with student names
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

  // ─── Admin: company feedback for drive ─────────
  async getCompanyFeedbackForDrive(driveId: string) {
    const feedback = await this.companyFeedbackRepo.find({
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

    // Company averages
    const avgTechnical = totalCompanyFeedbacks > 0 ? companyFeedback.reduce((s, f) => s + f.technicalRating, 0) / totalCompanyFeedbacks : 0;
    const avgCompComm = totalCompanyFeedbacks > 0 ? companyFeedback.reduce((s, f) => s + f.communicationRating, 0) / totalCompanyFeedbacks : 0;
    const avgAttitude = totalCompanyFeedbacks > 0 ? companyFeedback.reduce((s, f) => s + f.attitudeRating, 0) / totalCompanyFeedbacks : 0;
    const avgCompOverall = totalCompanyFeedbacks > 0 ? companyFeedback.reduce((s, f) => s + f.overallRating, 0) / totalCompanyFeedbacks : 0;

    const hireBreakdown = { yes: 0, no: 0, maybe: 0 };
    companyFeedback.forEach(f => { if (f.recommendForHire in hireBreakdown) hireBreakdown[f.recommendForHire as keyof typeof hireBreakdown]++; });

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
        avgTechnicalRating: +avgTechnical.toFixed(1),
        avgCommunicationRating: +avgCompComm.toFixed(1),
        avgAttitudeRating: +avgAttitude.toFixed(1),
        avgOverallRating: +avgCompOverall.toFixed(1),
        hireBreakdown,
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

  // ─── Company: own feedback for a drive ─────────
  async getCompanyFeedbackByCompany(companyId: string, driveId?: string) {
    const where: Record<string, unknown> = { companyId };
    if (driveId) where.driveId = driveId;

    const feedback = await this.companyFeedbackRepo.find({
      where,
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
