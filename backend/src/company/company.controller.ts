import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UserRole } from '../entities/user.entity';
import { CreateJobDto, AddAvailabilityDto, MarkAttendanceDto, MarkRoundResultDto, UpdateCompanyProfileDto, SubmitRoundResultsDto, UpdateJobRoundsDto, CreateRoundMeetingDto, UpdateRoundMeetingDto } from './dto/company.dto';
import { FeedbackService } from '../admin/feedback.service';

@Controller('api/v1/company')
@Auth(UserRole.COMPANY)
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly feedbackService: FeedbackService,
  ) {}

  // ─── Dashboard ──────────────────────────────────
  @Get('dashboard')
  async getDashboard(@CurrentUser('id') userId: string) {
    const data = await this.companyService.getDashboard(userId);
    return { success: true, data };
  }

  // ─── Profile ────────────────────────────────────
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const data = await this.companyService.getProfile(userId);
    return { success: true, data };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCompanyProfileDto,
  ) {
    const data = await this.companyService.updateProfile(userId, dto);
    return { success: true, data };
  }

  // ─── Jobs ───────────────────────────────────────
  @Post('jobs')
  async createJob(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJobDto,
  ) {
    const data = await this.companyService.createJob(userId, dto);
    return { success: true, data };
  }

  @Get('jobs')
  async listJobs(@CurrentUser('id') userId: string) {
    const data = await this.companyService.listJobs(userId);
    return { success: true, data };
  }

  @Get('jobs/:jobId')
  async getJob(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    const data = await this.companyService.getJob(userId, jobId);
    return { success: true, data };
  }

  @Patch('jobs/:jobId/publish')
  async publishJob(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    const data = await this.companyService.publishJob(userId, jobId);
    return { success: true, data };
  }

  @Patch('jobs/:jobId/rounds')
  async updateJobRounds(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobRoundsDto,
  ) {
    const data = await this.companyService.updateJobRounds(userId, jobId, dto);
    return { success: true, data };
  }

  // ─── Availability ──────────────────────────────
  @Post('jobs/:jobId/availability')
  async addAvailability(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
    @Body() dto: AddAvailabilityDto,
  ) {
    const data = await this.companyService.addAvailability(userId, jobId, dto);
    return { success: true, data };
  }

  @Get('jobs/:jobId/availability')
  async getAvailability(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    const data = await this.companyService.getAvailability(userId, jobId);
    return { success: true, data };
  }

  // ─── Candidates ─────────────────────────────────
  @Get('jobs/:jobId/candidates')
  async getCandidates(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    const data = await this.companyService.getCandidates(userId, jobId);
    return { success: true, data };
  }

  @Get('students/:studentId')
  async getStudentProfile(
    @CurrentUser('id') userId: string,
    @Param('studentId') studentId: string,
  ) {
    const data = await this.companyService.getStudentProfile(userId, studentId);
    return { success: true, data };
  }

  // ─── Drives (slots, student counts, depts) ────
  @Get('drives')
  async getMyDrives(@CurrentUser('id') userId: string) {
    const data = await this.companyService.getMyDrives(userId);
    return { success: true, data };
  }

  @Get('drives/:driveId/attendees')
  async getDriveAttendees(
    @CurrentUser('id') userId: string,
    @Param('driveId') driveId: string,
  ) {
    const data = await this.companyService.getDriveAttendees(userId, driveId);
    return { success: true, data };
  }

  // ─── Attendance & Results ─────────────────────
  @Patch('attendance')
  async markAttendance(
    @CurrentUser('id') userId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    const data = await this.companyService.markAttendance(userId, dto);
    return { success: true, data };
  }

  @Patch('round-result')
  async markRoundResult(
    @CurrentUser('id') userId: string,
    @Body() dto: MarkRoundResultDto,
  ) {
    const data = await this.companyService.markRoundResult(userId, dto);
    return { success: true, data };
  }

  @Post('jobs/:jobId/submit-round-results')
  async submitRoundResults(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
    @Body() dto: SubmitRoundResultsDto,
  ) {
    const data = await this.companyService.submitRoundResults(userId, jobId, dto);
    return { success: true, data };
  }

  // ─── Round Meetings ───────────────────────────────
  @Post('meetings')
  async createRoundMeeting(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRoundMeetingDto,
  ) {
    const data = await this.companyService.createRoundMeeting(userId, dto);
    return { success: true, data };
  }

  @Get('jobs/:jobId/meetings')
  async getRoundMeetings(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    const data = await this.companyService.getRoundMeetings(userId, jobId);
    return { success: true, data };
  }

  @Get('meetings/:meetingId')
  async getRoundMeeting(
    @CurrentUser('id') userId: string,
    @Param('meetingId') meetingId: string,
  ) {
    const data = await this.companyService.getRoundMeeting(userId, meetingId);
    return { success: true, data };
  }

  @Patch('meetings/:meetingId')
  async updateRoundMeeting(
    @CurrentUser('id') userId: string,
    @Param('meetingId') meetingId: string,
    @Body() dto: UpdateRoundMeetingDto,
  ) {
    const data = await this.companyService.updateRoundMeeting(userId, meetingId, dto);
    return { success: true, data };
  }

  @Delete('meetings/:meetingId')
  async deleteRoundMeeting(
    @CurrentUser('id') userId: string,
    @Param('meetingId') meetingId: string,
  ) {
    const data = await this.companyService.deleteRoundMeeting(userId, meetingId);
    return { success: true, data };
  }

  // ─── Feedback ───────────────────────────────────
  @Post('drives/:driveId/feedback')
  async submitDriveFeedback(
    @CurrentUser('id') userId: string,
    @Param('driveId') driveId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const company = await this.companyService.getCompanyByUserId(userId);
    const data = await this.feedbackService.submitCompanyFeedback(company.id, driveId, body as any);
    return { success: true, ...data };
  }

  @Get('feedback')
  async getMyFeedback(@CurrentUser('id') userId: string) {
    const company = await this.companyService.getCompanyByUserId(userId);
    const data = await this.feedbackService.getCompanyFeedbackByCompany(company.id);
    return { success: true, data };
  }

  @Get('feedback/pending')
  async getPendingFeedback(@CurrentUser('id') userId: string) {
    const company = await this.companyService.getCompanyByUserId(userId);
    const data = await this.feedbackService.getCompanyPendingFeedback(company.id);
    return { success: true, data };
  }
}
