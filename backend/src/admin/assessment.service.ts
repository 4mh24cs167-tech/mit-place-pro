import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Assessment, AssessmentLink, AssessmentSubmission } from '../entities/assessment.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    @InjectRepository(Assessment) private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(AssessmentLink) private readonly linkRepo: Repository<AssessmentLink>,
    @InjectRepository(AssessmentSubmission) private readonly submissionRepo: Repository<AssessmentSubmission>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
  ) {}

  // ─── Create Assessment ────────────────────────────
  async createAssessment(createdBy: string, data: {
    title: string; description?: string; type?: string;
    departments?: string[]; batchIds?: string[];
    status?: string; deadline?: string; maxScore?: number;
    links?: { title: string; url: string; platform?: string; instructions?: string }[];
  }) {
    const assessment = await this.assessmentRepo.save({
      title: data.title,
      description: data.description || null,
      type: (data.type || 'aptitude') as Assessment['type'],
      departments: data.departments || [],
      batchIds: data.batchIds || [],
      status: (data.status || 'draft') as Assessment['status'],
      deadline: data.deadline ? new Date(data.deadline) : null,
      maxScore: data.maxScore ?? null,
      createdBy,
    });

    // Save links
    if (data.links && data.links.length > 0) {
      const linkEntities = data.links.map((l, i) => ({
        assessmentId: assessment.id,
        title: l.title,
        url: l.url,
        platform: l.platform || 'custom',
        displayOrder: i,
        instructions: l.instructions || null,
      }));
      await this.linkRepo.save(linkEntities);
    }

    // Auto-assign submissions if status is active
    if (data.status === 'active') {
      await this.assignStudents(assessment.id, data.departments || [], data.batchIds || []);
    }

    return this.getAssessment(assessment.id);
  }

  // ─── Assign students based on department/batch ────
  private async assignStudents(assessmentId: string, departments: string[], batchIds: string[]) {
    const qb = this.studentRepo.createQueryBuilder('s');

    if (departments.length > 0) {
      qb.andWhere('s.department IN (:...departments)', { departments });
    }
    if (batchIds.length > 0) {
      qb.andWhere('s.batch_id IN (:...batchIds)', { batchIds });
    }

    const students = await qb.select(['s.id']).getMany();
    if (students.length === 0) return 0;

    // Check existing submissions
    const existing = await this.submissionRepo.find({
      where: { assessmentId, studentId: In(students.map(s => s.id)) },
      select: ['studentId'],
    });
    const existingIds = new Set(existing.map(e => e.studentId));

    const newSubmissions = students
      .filter(s => !existingIds.has(s.id))
      .map(s => ({ assessmentId, studentId: s.id, status: 'pending' as const }));

    if (newSubmissions.length > 0) {
      await this.submissionRepo.save(newSubmissions);
    }

    this.logger.log(`Assigned ${newSubmissions.length} students to assessment ${assessmentId}`);
    return newSubmissions.length;
  }

  // ─── List Assessments ─────────────────────────────
  async listAssessments(filters?: { type?: string; status?: string; department?: string }) {
    const qb = this.assessmentRepo.createQueryBuilder('a')
      .loadRelationCountAndMap('a.totalSubmissions', 'a.submissions')
      .loadRelationCountAndMap('a.completedCount', 'a.submissions', 'cs', (sq) =>
        sq.where('cs.status = :st', { st: 'completed' }),
      )
      .orderBy('a.createdAt', 'DESC');

    if (filters?.type) qb.andWhere('a.type = :type', { type: filters.type });
    if (filters?.status) qb.andWhere('a.status = :status', { status: filters.status });
    if (filters?.department) qb.andWhere(':dept = ANY(a.departments)', { dept: filters.department });

    const assessments = await qb.getMany();

    // Get submission counts manually for accuracy
    const ids = assessments.map(a => a.id);
    if (ids.length === 0) return [];

    const counts = await this.submissionRepo
      .createQueryBuilder('s')
      .select('s.assessment_id', 'assessmentId')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN s.status = \'completed\' THEN 1 ELSE 0 END)', 'completed')
      .addSelect('SUM(CASE WHEN s.status = \'absent\' THEN 1 ELSE 0 END)', 'absent')
      .where('s.assessment_id IN (:...ids)', { ids })
      .groupBy('s.assessment_id')
      .getRawMany();

    const countMap = new Map(counts.map((c: { assessmentId: string; total: string; completed: string; absent: string }) => [
      c.assessmentId, { total: +c.total, completed: +c.completed, absent: +c.absent },
    ]));

    return assessments.map(a => ({
      id: a.id, title: a.title, description: a.description, type: a.type,
      departments: a.departments, batchIds: a.batchIds, status: a.status,
      deadline: a.deadline, maxScore: a.maxScore, createdAt: a.createdAt,
      counts: countMap.get(a.id) || { total: 0, completed: 0, absent: 0 },
    }));
  }

  // ─── Get Assessment Detail ────────────────────────
  async getAssessment(id: string) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id },
      relations: ['links', 'submissions', 'submissions.student'],
      order: { links: { displayOrder: 'ASC' } },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    return {
      ...assessment,
      links: (assessment.links || []).map(l => ({
        id: l.id, title: l.title, url: l.url, platform: l.platform,
        displayOrder: l.displayOrder, instructions: l.instructions,
      })),
      submissions: (assessment.submissions || []).map(s => ({
        id: s.id, studentId: s.studentId,
        studentName: s.student?.fullName || null,
        usn: s.student?.usn || null,
        department: s.student?.department || null,
        status: s.status, score: s.score, remarks: s.remarks,
        attemptedAt: s.attemptedAt, gradedAt: s.gradedAt,
      })),
    };
  }

  // ─── Update Assessment ────────────────────────────
  async updateAssessment(id: string, data: {
    title?: string; description?: string; type?: string;
    departments?: string[]; batchIds?: string[];
    status?: string; deadline?: string; maxScore?: number;
  }) {
    const assessment = await this.assessmentRepo.findOne({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const wasNotActive = assessment.status !== 'active';

    if (data.title !== undefined) assessment.title = data.title;
    if (data.description !== undefined) assessment.description = data.description;
    if (data.type !== undefined) assessment.type = data.type as Assessment['type'];
    if (data.departments !== undefined) assessment.departments = data.departments;
    if (data.batchIds !== undefined) assessment.batchIds = data.batchIds;
    if (data.status !== undefined) assessment.status = data.status as Assessment['status'];
    if (data.deadline !== undefined) assessment.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.maxScore !== undefined) assessment.maxScore = data.maxScore;

    await this.assessmentRepo.save(assessment);

    // If newly activated, assign students
    if (wasNotActive && assessment.status === 'active') {
      await this.assignStudents(assessment.id, assessment.departments, assessment.batchIds);
    }

    return this.getAssessment(id);
  }

  // ─── Delete Assessment ────────────────────────────
  async deleteAssessment(id: string) {
    const assessment = await this.assessmentRepo.findOne({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');
    await this.assessmentRepo.remove(assessment);
    return { message: 'Assessment deleted' };
  }

  // ─── Add Link ─────────────────────────────────────
  async addLink(assessmentId: string, data: { title: string; url: string; platform?: string; instructions?: string }) {
    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const maxOrder = await this.linkRepo
      .createQueryBuilder('l')
      .select('MAX(l.display_order)', 'max')
      .where('l.assessment_id = :assessmentId', { assessmentId })
      .getRawOne();

    const link = await this.linkRepo.save({
      assessmentId,
      title: data.title,
      url: data.url,
      platform: data.platform || 'custom',
      displayOrder: (maxOrder?.max ?? -1) + 1,
      instructions: data.instructions || null,
    });
    return link;
  }

  // ─── Remove Link ──────────────────────────────────
  async removeLink(linkId: string) {
    const link = await this.linkRepo.findOne({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Link not found');
    await this.linkRepo.remove(link);
    return { message: 'Link removed' };
  }

  // ─── Bulk Grade via Excel data ────────────────────
  // Format: [{ usn: string, score: number, remarks?: string }]
  async bulkGrade(assessmentId: string, grades: { usn: string; score: number; remarks?: string }[]) {
    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    // Find all students by USN
    const usns = grades.map(g => g.usn.trim().toUpperCase());
    const students = await this.studentRepo
      .createQueryBuilder('s')
      .where('UPPER(s.usn) IN (:...usns)', { usns })
      .getMany();

    const usnToStudent = new Map(students.map(s => [s.usn.toUpperCase(), s]));

    let graded = 0;
    let notFound = 0;
    const notFoundUsns: string[] = [];

    for (const grade of grades) {
      const student = usnToStudent.get(grade.usn.trim().toUpperCase());
      if (!student) {
        notFound++;
        notFoundUsns.push(grade.usn);
        continue;
      }

      // Upsert submission
      let submission = await this.submissionRepo.findOne({
        where: { assessmentId, studentId: student.id },
      });

      if (submission) {
        submission.score = grade.score;
        submission.status = 'completed';
        submission.remarks = grade.remarks || submission.remarks;
        submission.gradedAt = new Date();
        submission.attemptedAt = submission.attemptedAt || new Date();
        await this.submissionRepo.save(submission);
      } else {
        await this.submissionRepo.save({
          assessmentId,
          studentId: student.id,
          score: grade.score,
          status: 'completed' as const,
          remarks: grade.remarks || null,
          gradedAt: new Date(),
          attemptedAt: new Date(),
        });
      }
      graded++;
    }

    // Mark all students without scores as absent
    await this.submissionRepo
      .createQueryBuilder()
      .update()
      .set({ status: 'absent' as const })
      .where('assessment_id = :assessmentId', { assessmentId })
      .andWhere('status = :pending', { pending: 'pending' })
      .execute();

    return { graded, notFound, notFoundUsns, totalInFile: grades.length };
  }

  // ─── Get Assessment Stats ─────────────────────────
  async getAssessmentStats(id: string) {
    const assessment = await this.assessmentRepo.findOne({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const submissions = await this.submissionRepo.find({
      where: { assessmentId: id },
      relations: ['student'],
    });

    const total = submissions.length;
    const completed = submissions.filter(s => s.status === 'completed').length;
    const absent = submissions.filter(s => s.status === 'absent').length;
    const pending = submissions.filter(s => s.status === 'pending').length;

    const scores = submissions.filter(s => s.score != null).map(s => +s.score!);
    const avgScore = scores.length > 0 ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;
    const maxScoreAchieved = scores.length > 0 ? Math.max(...scores) : null;
    const minScoreAchieved = scores.length > 0 ? Math.min(...scores) : null;

    // Department-wise breakdown
    const deptMap = new Map<string, { total: number; completed: number; avgScore: number; scores: number[] }>();
    for (const s of submissions) {
      const dept = s.student?.department || 'Unknown';
      if (!deptMap.has(dept)) deptMap.set(dept, { total: 0, completed: 0, avgScore: 0, scores: [] });
      const d = deptMap.get(dept)!;
      d.total++;
      if (s.status === 'completed') d.completed++;
      if (s.score != null) d.scores.push(+s.score);
    }
    const departmentStats = Array.from(deptMap.entries()).map(([dept, d]) => ({
      department: dept, total: d.total, completed: d.completed,
      avgScore: d.scores.length > 0 ? +(d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(2) : null,
    }));

    return {
      total, completed, absent, pending,
      completionRate: total > 0 ? +((completed / total) * 100).toFixed(1) : 0,
      avgScore, maxScoreAchieved, minScoreAchieved,
      departmentStats,
    };
  }

  // ─── Student: Get My Assessments ──────────────────
  async getStudentAssessments(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const now = new Date();

    const submissions = await this.submissionRepo.find({
      where: { studentId: student.id },
      relations: ['assessment', 'assessment.links'],
      order: { createdAt: 'DESC' },
    });

    return submissions.map(s => {
      const isExpired = s.assessment?.deadline && new Date(s.assessment.deadline) < now;
      return {
        id: s.id, assessmentId: s.assessmentId,
        title: s.assessment?.title, description: s.assessment?.description,
        type: s.assessment?.type, status: s.status,
        score: s.score, maxScore: s.assessment?.maxScore,
        remarks: s.remarks,
        deadline: s.assessment?.deadline,
        isExpired: !!isExpired,
        links: isExpired ? [] : (s.assessment?.links || []).map(l => ({
          id: l.id, title: l.title, url: l.url, platform: l.platform, instructions: l.instructions,
        })),
        gradedAt: s.gradedAt, attemptedAt: s.attemptedAt,
      };
    });
  }
}
