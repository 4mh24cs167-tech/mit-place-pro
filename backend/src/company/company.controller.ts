import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UserRole } from '../entities/user.entity';
import { CreateJobDto, AddAvailabilityDto, MarkAttendanceDto, MarkRoundResultDto } from './dto/company.dto';

@Controller('api/v1/company')
@Auth(UserRole.COMPANY)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

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

  // ─── Drives (slots, student counts, depts) ────
  @Get('drives')
  async getMyDrives(@CurrentUser('id') userId: string) {
    const data = await this.companyService.getMyDrives(userId);
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
}
