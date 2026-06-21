import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Assessment, AssessmentLink, AssessmentSubmission, AssessmentSchedule, AssessmentSubItem, AssessmentCredential } from '../entities/assessment.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    @InjectRepository(Assessment) private readonly assessmentRepo: Repository<Assessment>,
    @InjectRepository(AssessmentLink) private readonly linkRepo: Repository<AssessmentLink>,
    @InjectRepository(AssessmentSubmission) private readonly submissionRepo: Repository<AssessmentSubmission>,
    @InjectRepository(AssessmentSchedule) private readonly scheduleRepo: Repository<AssessmentSchedule>,
    @InjectRepository(AssessmentSubItem) private readonly subItemRepo: Repository<AssessmentSubItem>,
    @InjectRepository(AssessmentCredential) private readonly credentialRepo: Repository<AssessmentCredential>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
  ) {}

  // ─── Create Assessment ────────────────────────────
  async createAssessment(createdBy: string, data: {
    title: string; description?: string; types?: string[];
    departments?: string[]; batchIds?: string[];
    status?: string; deadline?: string; maxScore?: number;
    links?: { title: string; url: string; platform?: string; instructions?: string }[];
    schedules?: { batchLabel: string; departments: string[]; scheduleDate: string; startTime?: string; endTime?: string; venue?: string; usnStart?: number; usnEnd?: number }[];
    subItems?: { title: string; type?: string; description?: string; scheduleDate?: string; startTime?: string; endTime?: string; is24Hours?: boolean; links?: { title: string; url: string; platform?: string }[] }[];
  }) {
    const assessment = await this.assessmentRepo.save({
      title: data.title,
      description: data.description || null,
      types: data.types || ['aptitude'],
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

    // Save schedules (batch time slots)
    if (data.schedules && data.schedules.length > 0) {
      const scheduleEntities = data.schedules.map(s => ({
        assessmentId: assessment.id,
        batchLabel: s.batchLabel,
        departments: s.departments,
        scheduleDate: s.scheduleDate,
        startTime: s.startTime || null,
        endTime: s.endTime || null,
        venue: s.venue || null,
        usnStart: s.usnStart ?? null,
        usnEnd: s.usnEnd ?? null,
      }));
      await this.scheduleRepo.save(scheduleEntities);
    }

    // Save sub-items
    if (data.subItems && data.subItems.length > 0) {
      const subEntities = data.subItems.map((si, i) => ({
        assessmentId: assessment.id,
        title: si.title,
        type: si.type || 'custom',
        description: si.description || null,
        scheduleDate: si.scheduleDate || null,
        startTime: si.startTime || null,
        endTime: si.endTime || null,
        is24Hours: si.is24Hours || false,
        links: si.links || [],
        displayOrder: i,
      }));
      await this.subItemRepo.save(subEntities);
    }

    // Auto-assign submissions if status is active
    if (data.status === 'active') {
      await this.assignStudents(assessment.id);
    }

    return this.getAssessment(assessment.id);
  }

  /** Extract numeric suffix from USN, e.g. "1MS21CS045" → 45 */
  private extractUsnNumber(usn: string): number {
    const match = usn.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // ─── Assign students based on schedules/departments ──
  private async assignStudents(assessmentId: string) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id: assessmentId },
      relations: ['schedules'],
    });
    if (!assessment) return 0;

    const schedules = assessment.schedules || [];
    let totalAssigned = 0;

    if (schedules.length > 0) {
      // Use assessment-level departments (or schedule-level as fallback)
      const depts = assessment.departments.length > 0 ? assessment.departments : [...new Set(schedules.flatMap(s => s.departments))];
      if (depts.length === 0) return 0;

      // Fetch all students in these departments with USN
      const allStudents = await this.studentRepo.createQueryBuilder('s')
        .where('s.department IN (:...departments)', { departments: depts })
        .select(['s.id', 's.usn'])
        .getMany();

      const existing = await this.submissionRepo.find({
        where: { assessmentId, studentId: In(allStudents.map(s => s.id)) },
        select: ['studentId'],
      });
      const existingIds = new Set(existing.map(e => e.studentId));

      for (const schedule of schedules) {
        const scheduleDepts = schedule.departments.length > 0 ? schedule.departments : depts;
        let eligible = allStudents.filter(s => {
          // Check department match
          const dept = (s as any).department;
          if (dept && !scheduleDepts.includes(dept)) return false;
          return true;
        });

        // Filter by USN range if specified
        if (schedule.usnStart != null && schedule.usnEnd != null) {
          eligible = eligible.filter(s => {
            const num = this.extractUsnNumber(s.usn || '');
            return num >= schedule.usnStart! && num <= schedule.usnEnd!;
          });
        }

        const newSubs = eligible
          .filter(s => !existingIds.has(s.id))
          .map(s => ({ assessmentId, studentId: s.id, scheduleId: schedule.id, status: 'pending' as const }));

        if (newSubs.length > 0) {
          await this.submissionRepo.save(newSubs);
          newSubs.forEach(ns => existingIds.add(ns.studentId));
          totalAssigned += newSubs.length;
        }
      }
    } else if (assessment.departments.length > 0) {
      // Fallback: assign by assessment-level departments (no schedule)
      const students = await this.studentRepo.createQueryBuilder('s')
        .where('s.department IN (:...departments)', { departments: assessment.departments })
        .select(['s.id'])
        .getMany();

      const existing = await this.submissionRepo.find({
        where: { assessmentId, studentId: In(students.map(s => s.id)) },
        select: ['studentId'],
      });
      const existingIds = new Set(existing.map(e => e.studentId));

      const newSubs = students
        .filter(s => !existingIds.has(s.id))
        .map(s => ({ assessmentId, studentId: s.id, status: 'pending' as const }));

      if (newSubs.length > 0) {
        await this.submissionRepo.save(newSubs);
        totalAssigned = newSubs.length;
      }
    }

    this.logger.log(`Assigned ${totalAssigned} students to assessment ${assessmentId}`);
    return totalAssigned;
  }

  // ─── List Assessments ─────────────────────────────
  async listAssessments(filters?: { type?: string; status?: string; department?: string }) {
    const qb = this.assessmentRepo.createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC');

    if (filters?.type) qb.andWhere(':type = ANY(a.types)', { type: filters.type });
    if (filters?.status) qb.andWhere('a.status = :status', { status: filters.status });
    if (filters?.department) qb.andWhere(':dept = ANY(a.departments)', { dept: filters.department });

    const assessments = await qb.getMany();

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

    // Get schedule counts
    const scheduleCounts = await this.scheduleRepo
      .createQueryBuilder('sc')
      .select('sc.assessment_id', 'assessmentId')
      .addSelect('COUNT(*)', 'count')
      .where('sc.assessment_id IN (:...ids)', { ids })
      .groupBy('sc.assessment_id')
      .getRawMany();
    const scheduleMap = new Map(scheduleCounts.map((s: { assessmentId: string; count: string }) => [s.assessmentId, +s.count]));

    return assessments.map(a => ({
      id: a.id, title: a.title, description: a.description, types: a.types,
      departments: a.departments, batchIds: a.batchIds, status: a.status,
      deadline: a.deadline, maxScore: a.maxScore, createdAt: a.createdAt,
      counts: countMap.get(a.id) || { total: 0, completed: 0, absent: 0 },
      scheduleCount: scheduleMap.get(a.id) || 0,
    }));
  }

  // ─── Get Assessment Detail ────────────────────────
  async getAssessment(id: string) {
    const assessment = await this.assessmentRepo.findOne({
      where: { id },
      relations: ['links', 'subItems', 'schedules', 'submissions', 'submissions.student', 'submissions.schedule'],
      order: { links: { displayOrder: 'ASC' }, subItems: { displayOrder: 'ASC' }, schedules: { scheduleDate: 'ASC' } },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    return {
      ...assessment,
      links: (assessment.links || []).map(l => ({
        id: l.id, title: l.title, url: l.url, platform: l.platform,
        displayOrder: l.displayOrder, instructions: l.instructions,
      })),
      subItems: (assessment.subItems || []).map(si => ({
        id: si.id, title: si.title, type: si.type, description: si.description,
        scheduleDate: si.scheduleDate, startTime: si.startTime, endTime: si.endTime,
        is24Hours: si.is24Hours, links: si.links || [], displayOrder: si.displayOrder,
      })),
      schedules: (assessment.schedules || []).map(s => ({
        id: s.id, batchLabel: s.batchLabel, departments: s.departments,
        scheduleDate: s.scheduleDate, startTime: s.startTime, endTime: s.endTime, venue: s.venue,
        usnStart: s.usnStart, usnEnd: s.usnEnd,
      })),
      submissions: (assessment.submissions || []).map(s => ({
        id: s.id, studentId: s.studentId,
        studentName: s.student?.fullName || null,
        usn: s.student?.usn || null,
        department: s.student?.department || null,
        status: s.status, score: s.score, remarks: s.remarks,
        attemptedAt: s.attemptedAt, gradedAt: s.gradedAt,
        scheduleId: s.scheduleId,
        batchLabel: s.schedule?.batchLabel || null,
        scheduleDate: s.schedule?.scheduleDate || null,
        startTime: s.schedule?.startTime || null,
        endTime: s.schedule?.endTime || null,
      })).sort((a, b) => (a.usn || '').localeCompare(b.usn || '', undefined, { numeric: true })),
    };
  }

  // ─── Update Assessment ────────────────────────────
  async updateAssessment(id: string, data: {
    title?: string; description?: string; types?: string[];
    departments?: string[]; batchIds?: string[];
    status?: string; deadline?: string; maxScore?: number;
  }) {
    const assessment = await this.assessmentRepo.findOne({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const wasNotActive = assessment.status !== 'active';

    if (data.title !== undefined) assessment.title = data.title;
    if (data.description !== undefined) assessment.description = data.description;
    if (data.types !== undefined) assessment.types = data.types;
    if (data.departments !== undefined) assessment.departments = data.departments;
    if (data.batchIds !== undefined) assessment.batchIds = data.batchIds;
    if (data.status !== undefined) assessment.status = data.status as Assessment['status'];
    if (data.deadline !== undefined) assessment.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.maxScore !== undefined) assessment.maxScore = data.maxScore;

    await this.assessmentRepo.save(assessment);

    if (wasNotActive && assessment.status === 'active') {
      await this.assignStudents(assessment.id);
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

    return this.linkRepo.save({
      assessmentId,
      title: data.title, url: data.url,
      platform: data.platform || 'custom',
      displayOrder: (maxOrder?.max ?? -1) + 1,
      instructions: data.instructions || null,
    });
  }

  // ─── Remove Link ──────────────────────────────────
  async removeLink(linkId: string) {
    const link = await this.linkRepo.findOne({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Link not found');
    await this.linkRepo.remove(link);
    return { message: 'Link removed' };
  }

  // ─── Add Schedule ─────────────────────────────────
  async addSchedule(assessmentId: string, data: {
    batchLabel: string; departments: string[];
    scheduleDate: string; startTime?: string; endTime?: string; venue?: string;
    usnStart?: number; usnEnd?: number;
  }) {
    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const schedule = await this.scheduleRepo.save({
      assessmentId,
      batchLabel: data.batchLabel,
      departments: data.departments,
      scheduleDate: data.scheduleDate,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      venue: data.venue || null,
      usnStart: data.usnStart ?? null,
      usnEnd: data.usnEnd ?? null,
    });

    // If assessment is active, auto-assign students from these departments
    if (assessment.status === 'active' && data.departments.length > 0) {
      // Build query for students in the specified departments
      let studentQuery = this.studentRepo.createQueryBuilder('s')
        .where('s.department IN (:...departments)', { departments: data.departments });

      // If USN range provided, filter by last 3 digits of USN
      if (data.usnStart != null && data.usnEnd != null) {
        studentQuery = studentQuery.andWhere(
          "CAST(RIGHT(s.usn, 3) AS INTEGER) BETWEEN :usnStart AND :usnEnd",
          { usnStart: data.usnStart, usnEnd: data.usnEnd }
        );
      }

      const students = await studentQuery.select(['s.id']).getMany();
      const studentIds = students.map(s => s.id);

      if (studentIds.length > 0) {
        // Update existing submissions to assign this schedule
        await this.submissionRepo.createQueryBuilder()
          .update()
          .set({ scheduleId: schedule.id })
          .where('assessment_id = :assessmentId', { assessmentId })
          .andWhere('student_id IN (:...studentIds)', { studentIds })
          .execute();

        // Create new submissions for students not yet assigned
        const existing = await this.submissionRepo.find({
          where: { assessmentId, studentId: In(studentIds) },
          select: ['studentId'],
        });
        const existingIds = new Set(existing.map(e => e.studentId));

        const newSubs = students
          .filter(s => !existingIds.has(s.id))
          .map(s => ({ assessmentId, studentId: s.id, scheduleId: schedule.id, status: 'pending' as const }));

        if (newSubs.length > 0) await this.submissionRepo.save(newSubs);
      }
    }

    return schedule;
  }

  // ─── Remove Schedule ──────────────────────────────
  async removeSchedule(scheduleId: string) {
    const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    await this.scheduleRepo.remove(schedule);
    return { message: 'Schedule removed' };
  }

  // ─── Add Sub-Item ────────────────────────────────
  async addSubItem(assessmentId: string, data: {
    title: string; type?: string; description?: string;
    scheduleDate?: string; startTime?: string; endTime?: string;
    is24Hours?: boolean; links?: { title: string; url: string; platform?: string }[];
  }) {
    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const maxOrder = await this.subItemRepo
      .createQueryBuilder('si')
      .select('MAX(si.display_order)', 'max')
      .where('si.assessment_id = :assessmentId', { assessmentId })
      .getRawOne();

    return this.subItemRepo.save({
      assessmentId,
      title: data.title,
      type: data.type || 'custom',
      description: data.description || null,
      scheduleDate: data.scheduleDate || null,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      is24Hours: data.is24Hours || false,
      links: data.links || [],
      displayOrder: (maxOrder?.max ?? -1) + 1,
    });
  }

  // ─── Update Sub-Item ─────────────────────────────
  async updateSubItem(subItemId: string, data: {
    title?: string; type?: string; description?: string;
    scheduleDate?: string; startTime?: string; endTime?: string;
    is24Hours?: boolean; links?: { title: string; url: string; platform?: string }[];
  }) {
    const subItem = await this.subItemRepo.findOne({ where: { id: subItemId } });
    if (!subItem) throw new NotFoundException('Sub-item not found');

    if (data.title !== undefined) subItem.title = data.title;
    if (data.type !== undefined) subItem.type = data.type;
    if (data.description !== undefined) subItem.description = data.description || null;
    if (data.scheduleDate !== undefined) subItem.scheduleDate = data.scheduleDate || null;
    if (data.startTime !== undefined) subItem.startTime = data.startTime || null;
    if (data.endTime !== undefined) subItem.endTime = data.endTime || null;
    if (data.is24Hours !== undefined) subItem.is24Hours = data.is24Hours;
    if (data.links !== undefined) subItem.links = data.links;

    return this.subItemRepo.save(subItem);
  }

  // ─── Remove Sub-Item ─────────────────────────────
  async removeSubItem(subItemId: string) {
    const subItem = await this.subItemRepo.findOne({ where: { id: subItemId } });
    if (!subItem) throw new NotFoundException('Sub-item not found');
    await this.subItemRepo.remove(subItem);
    return { message: 'Sub-item removed' };
  }

  // ─── Bulk Grade via Excel data ────────────────────
  async bulkGrade(assessmentId: string, grades: { usn: string; score: number; remarks?: string }[]) {
    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

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
      if (!student) { notFound++; notFoundUsns.push(grade.usn); continue; }

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
          assessmentId, studentId: student.id,
          score: grade.score, status: 'completed' as const,
          remarks: grade.remarks || null,
          gradedAt: new Date(), attemptedAt: new Date(),
        });
      }
      graded++;
    }

    // Mark remaining pending as absent
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

    const deptMap = new Map<string, { total: number; completed: number; scores: number[] }>();
    for (const s of submissions) {
      const dept = s.student?.department || 'Unknown';
      if (!deptMap.has(dept)) deptMap.set(dept, { total: 0, completed: 0, scores: [] });
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

  // ─── Upload Credentials (CSV: email, loginId, password) ──
  async uploadCredentials(assessmentId: string, credentials: { email: string; loginId: string; password: string }[]) {
    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    // Get all unique emails from the CSV
    const emails = [...new Set(credentials.map(c => c.email.trim().toLowerCase()))];

    // Find students by email (via User relation)
    const students = await this.studentRepo.createQueryBuilder('s')
      .innerJoin('s.user', 'u')
      .where('LOWER(u.email) IN (:...emails)', { emails })
      .select(['s.id', 'u.email'])
      .addSelect('u.email', 'userEmail')
      .getRawMany();

    const emailToStudentId = new Map<string, string>();
    for (const s of students) {
      emailToStudentId.set((s.userEmail || s.u_email || '').toLowerCase(), s.s_id);
    }

    let matched = 0;
    let notFound = 0;

    for (const cred of credentials) {
      const email = cred.email.trim().toLowerCase();
      const studentId = emailToStudentId.get(email);
      if (!studentId) { notFound++; continue; }

      // Upsert credential
      const existing = await this.credentialRepo.findOne({
        where: { assessmentId, studentId },
      });
      if (existing) {
        existing.loginId = cred.loginId;
        existing.loginPassword = cred.password;
        await this.credentialRepo.save(existing);
      } else {
        await this.credentialRepo.save({
          assessmentId, studentId,
          loginId: cred.loginId,
          loginPassword: cred.password,
        });
      }
      matched++;
    }

    this.logger.log(`Credentials uploaded: ${matched} matched, ${notFound} not found`);
    return { matched, notFound, total: credentials.length };
  }

  // ─── Student: Get My Assessments ──────────────────
  async getStudentAssessments(userId: string) {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const now = new Date();

    const submissions = await this.submissionRepo.find({
      where: { studentId: student.id },
      relations: ['assessment', 'assessment.links', 'assessment.subItems', 'schedule'],
      order: { createdAt: 'DESC' },
    });

    // Fetch all credentials for this student's assessments
    const assessmentIds = [...new Set(submissions.map(s => s.assessmentId))];
    let credMap = new Map<string, { loginId: string; loginPassword: string }>();
    if (assessmentIds.length > 0) {
      const creds = await this.credentialRepo.find({
        where: { studentId: student.id, assessmentId: In(assessmentIds) },
      });
      credMap = new Map(creds.map(c => [c.assessmentId, { loginId: c.loginId, loginPassword: c.loginPassword }]));
    }

    return submissions.map(s => {
      const isExpired = s.assessment?.deadline && new Date(s.assessment.deadline) < now;
      const cred = credMap.get(s.assessmentId);
      return {
        id: s.id, assessmentId: s.assessmentId,
        title: s.assessment?.title, description: s.assessment?.description,
        types: s.assessment?.types || [], status: s.status,
        score: s.score, maxScore: s.assessment?.maxScore,
        remarks: s.remarks,
        deadline: s.assessment?.deadline,
        isExpired: !!isExpired,
        links: isExpired ? [] : (s.assessment?.links || []).map(l => ({
          id: l.id, title: l.title, url: l.url, platform: l.platform, instructions: l.instructions,
        })),
        subItems: isExpired ? [] : (s.assessment?.subItems || []).map(si => ({
          id: si.id, title: si.title, type: si.type, description: si.description,
          scheduleDate: si.scheduleDate, startTime: si.startTime, endTime: si.endTime,
          is24Hours: si.is24Hours, links: si.links || [],
        })),
        gradedAt: s.gradedAt, attemptedAt: s.attemptedAt,
        // Credentials for this assessment
        credentials: cred ? { loginId: cred.loginId, password: cred.loginPassword } : null,
        // Schedule / batch info
        schedule: s.schedule ? {
          batchLabel: s.schedule.batchLabel,
          scheduleDate: s.schedule.scheduleDate,
          startTime: s.schedule.startTime,
          endTime: s.schedule.endTime,
          venue: s.schedule.venue,
        } : null,
      };
    });
  }
}
