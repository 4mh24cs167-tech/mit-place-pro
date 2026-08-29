import { Controller, Get, Patch, Post, Delete, Body, Param, Query, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { UploadService } from '../upload/upload.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UserRole } from '../entities/user.entity';
import { UpdateProfileDto, ApplyJobDto, CreateEducationDto, UpdateEducationDto } from './dto/student.dto';
import { FeedbackService } from '../admin/feedback.service';
import { AssessmentService } from '../admin/assessment.service';
import { InternshipService } from '../admin/internship.service';
import { Response } from 'express';

@Controller('api/v1/student')
@Auth(UserRole.STUDENT)
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly uploadService: UploadService,
    private readonly feedbackService: FeedbackService,
    private readonly assessmentService: AssessmentService,
    private readonly internshipService: InternshipService,
  ) {}

  // ─── Profile ────────────────────────────────────
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getProfile(userId);
    // Attach photo URL if S3 key exists
    const photoUrl = data.photoS3Key ? this.uploadService.getPublicUrl(data.photoS3Key) : null;
    return { success: true, data: { ...data, photoUrl } };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.studentService.updateProfile(userId, dto);
    return { success: true, data };
  }

  @Post('profile/photo')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async uploadProfilePhoto(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    const { key, url } = await this.uploadService.uploadFile(file, 'profile-photos');
    await this.studentService.updateProfilePhoto(userId, key);

    return { success: true, data: { photoUrl: url } };
  }

  // ─── Jobs ───────────────────────────────────────
  @Get('jobs')
  async getEligibleJobs(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getEligibleJobs(userId);
    return { success: true, data };
  }

  @Post('apply')
  async applyForJob(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyJobDto,
  ) {
    const data = await this.studentService.applyForJob(userId, dto);
    return { success: true, data };
  }

  // ─── Applications ──────────────────────────────
  @Get('applications')
  async getMyApplications(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getMyApplications(userId);
    return { success: true, data };
  }

  // ─── Interviews ─────────────────────────────────
  @Get('interviews')
  async getUpcomingInterviews(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getUpcomingInterviews(userId);
    return { success: true, data };
  }

  // ─── Drives (opt-in workflow) ──────────────────
  @Get('drives/available')
  async getAvailableDrives(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getAvailableDrives(userId);
    return { success: true, data };
  }

  @Post('drives/:driveId/register')
  async registerForDrive(
    @CurrentUser('id') userId: string,
    @Param('driveId') driveId: string,
  ) {
    const data = await this.studentService.registerForDrive(userId, driveId);
    return { success: true, data };
  }

  @Post('drives/:driveId/decline')
  async declineDrive(
    @CurrentUser('id') userId: string,
    @Param('driveId') driveId: string,
  ) {
    const data = await this.studentService.declineDrive(userId, driveId);
    return { success: true, data };
  }

  @Get('drives')
  async getMyDriveAllocations(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getMyDriveAllocations(userId);
    return { success: true, data };
  }

  // ─── Meetings ──────────────────────────────────────
  @Get('meetings')
  async getMyMeetings(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getMyMeetings(userId);
    return { success: true, data };
  }

  // ─── Notifications ─────────────────────────────
  @Get('notifications')
  async getNotifications(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getNotifications(userId);
    return { success: true, data };
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const data = await this.studentService.markNotificationRead(userId, id);
    return { success: true, ...data };
  }

  // ─── Feedback ───────────────────────────────────
  @Post('drives/:driveId/feedback')
  async submitDriveFeedback(
    @CurrentUser('id') userId: string,
    @Param('driveId') driveId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.feedbackService.submitStudentFeedbackByUserId(userId, driveId, body as any);
    return { success: true, ...data };
  }

  @Get('feedback')
  async getMyFeedback(@CurrentUser('id') userId: string) {
    const data = await this.feedbackService.getMyFeedbackByUserId(userId);
    return { success: true, data };
  }

  @Get('feedback/pending')
  async getPendingFeedback(@CurrentUser('id') userId: string) {
    const data = await this.feedbackService.getPendingFeedbackByUserId(userId);
    return { success: true, data };
  }

  // ─── Assessments ───────────────────────────────
  @Get('assessments')
  async getMyAssessments(@CurrentUser('id') userId: string) {
    const data = await this.assessmentService.getStudentAssessments(userId);
    return { success: true, data };
  }

  // ─── Internship Permission ─────────────────────
  @Post('internship-permission')
  async submitInternshipPermission(
    @CurrentUser('id') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.internshipService.submitForm(userId, body);
    return { success: true, data };
  }

  @Get('internship-permissions')
  async getMyInternshipPermissions(@CurrentUser('id') userId: string) {
    const data = await this.internshipService.getStudentForms(userId);
    return { success: true, data };
  }

  @Get('internship-permissions/:id')
  async getInternshipPermission(
    @Param('id') id: string,
  ) {
    const data = await this.internshipService.getFormById(id);
    return { success: true, data };
  }

  // ─── Education ────────────────────────────────────
  @Get('education')
  async listEducations(@CurrentUser('id') userId: string) {
    const data = await this.studentService.listEducations(userId);
    return { success: true, data };
  }

  @Post('education')
  async addEducation(@CurrentUser('id') userId: string, @Body() dto: CreateEducationDto) {
    const data = await this.studentService.addEducation(userId, dto);
    return { success: true, data };
  }

  @Patch('education/:id')
  async updateEducation(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateEducationDto) {
    const data = await this.studentService.updateEducation(userId, id, dto);
    return { success: true, data };
  }

  @Delete('education/:id')
  async deleteEducation(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.studentService.deleteEducation(userId, id);
    return { success: true, data };
  }

  @Post('education/:id/document')
  @UseInterceptors(FileInterceptor('document', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async uploadEducationDocument(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const data = await this.studentService.uploadEducationDocument(userId, id, file);
    return { success: true, data };
  }

  @Get('education/:id/document')
  async getEducationDocument(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const doc = await this.studentService.getEducationDocument(userId, id);
    res.set({ 'Content-Type': doc.type, 'Content-Disposition': `inline; filename="${doc.name}"` });
    res.send(doc.data);
  }
}
