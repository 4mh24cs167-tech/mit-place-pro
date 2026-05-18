import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { BulkUploadService } from './bulk-upload.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UserRole } from '../entities/user.entity';
import { CreateCompanyDto, BulkApproveDto, UpdateStudentDto, PaginationDto } from './dto/admin.dto';

@Controller('api/v1/admin')
@Auth(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly bulkUploadService: BulkUploadService,
  ) {}

  // ─── Dashboard ──────────────────────────────────
  @Get('dashboard')
  async getDashboard() {
    const stats = await this.adminService.getDashboardStats();
    return { success: true, data: stats };
  }

  @Get('activity')
  async getRecentActivity(@Query('limit') limit?: number) {
    const data = await this.adminService.getRecentActivity(limit || 10);
    return { success: true, data };
  }

  // ─── Students ───────────────────────────────────
  // IMPORTANT: Template route MUST come BEFORE :id route
  @Get('students/template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = this.bulkUploadService.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=student_upload_template.xlsx',
    });
    res.send(buffer);
  }

  @Get('students')
  async listStudents(@Query() query: PaginationDto) {
    const result = await this.adminService.listStudents(query);
    return { success: true, ...result };
  }

  @Get('students/:id')
  async getStudent(@Param('id') id: string) {
    const data = await this.adminService.getStudent(id);
    return { success: true, data };
  }

  @Patch('students/:id')
  async updateStudent(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.updateStudent(id, dto, actorId);
    return { success: true, data };
  }

  @Delete('students/:id')
  async deleteStudent(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.deleteStudent(id, actorId);
    return { success: true, ...data };
  }

  // ─── Bulk Upload ────────────────────────────────
  @Post('students/bulk-upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async bulkUploadStudents(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') actorId: string,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  ) {
    if (!file) {
      return { success: false, message: 'No file uploaded' };
    }
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.mimetype)) {
      return { success: false, message: 'Only .xlsx or .xls files are accepted' };
    }

    const result = await this.bulkUploadService.processExcel(file.buffer, actorId);
    return { success: true, data: result };
  }

  // ─── Companies ──────────────────────────────────
  @Post('companies')
  async createCompany(
    @Body() dto: CreateCompanyDto,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.createCompany(dto, actorId);
    return { success: true, data };
  }

  @Get('companies')
  async listCompanies(@Query() query: PaginationDto) {
    const result = await this.adminService.listCompanies(query);
    return { success: true, ...result };
  }

  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    const data = await this.adminService.getCompany(id);
    return { success: true, data };
  }

  // ─── Jobs (Admin View) ─────────────────────────
  @Get('jobs')
  async listJobs(@Query() query: PaginationDto) {
    const result = await this.adminService.listJobs(query);
    return { success: true, ...result };
  }

  // ─── Applications (Admin View) ─────────────────
  @Get('applications')
  async listApplications(@Query() query: PaginationDto) {
    const result = await this.adminService.listApplications(query);
    return { success: true, ...result };
  }

  // ─── Shortlist Approval ─────────────────────────
  @Get('jobs/:jobId/shortlist')
  async getShortlist(@Param('jobId') jobId: string) {
    const data = await this.adminService.getShortlist(jobId);
    return { success: true, data };
  }

  @Post('jobs/:jobId/approve')
  async bulkApprove(
    @Param('jobId') jobId: string,
    @Body() dto: BulkApproveDto,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.bulkApprove(jobId, dto, actorId);
    return { success: true, data };
  }

  // ─── Slot Management ───────────────────────────
  @Get('slots')
  async listSlots(@Query('jobId') jobId?: string) {
    const data = await this.adminService.listSlots(jobId);
    return { success: true, data };
  }

  @Post('slots/generate')
  async generateSlots(
    @Body() body: { jobId: string; round: number; venue?: string; durationMin?: number; startHour?: number },
  ) {
    const data = await this.adminService.generateSlots(body.jobId, body.round, {
      venue: body.venue,
      durationMin: body.durationMin,
      startHour: body.startHour,
    });
    return { success: true, data };
  }

  @Get('slots/timeline')
  async getSlotTimeline(@Query('date') date?: string) {
    const data = await this.adminService.getSlotTimeline(date);
    return { success: true, data };
  }
}
