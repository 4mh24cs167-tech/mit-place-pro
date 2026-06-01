import { Controller, Get, Patch, Post, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentService } from './student.service';
import { UploadService } from '../upload/upload.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UserRole } from '../entities/user.entity';
import { UpdateProfileDto, ApplyJobDto } from './dto/student.dto';

@Controller('api/v1/student')
@Auth(UserRole.STUDENT)
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly uploadService: UploadService,
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
}
