import { Controller, Get, Patch, Post, Body, Param, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UserRole } from '../entities/user.entity';
import { UpdateProfileDto, ApplyJobDto } from './dto/student.dto';

@Controller('api/v1/student')
@Auth(UserRole.STUDENT)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // ─── Profile ────────────────────────────────────
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    const data = await this.studentService.getProfile(userId);
    return { success: true, data };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.studentService.updateProfile(userId, dto);
    return { success: true, data };
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
}
