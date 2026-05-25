import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { BulkUploadService } from './bulk-upload.service';
import { DriveService } from './drive.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UserRole } from '../entities/user.entity';
import { CreateCompanyDto, CreateStudentDto, BulkApproveDto, UpdateStudentDto, PaginationDto } from './dto/admin.dto';

@Controller('api/v1/admin')
@Auth(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly bulkUploadService: BulkUploadService,
    private readonly driveService: DriveService,
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

  @Post('students')
  async createStudent(
    @Body() dto: CreateStudentDto,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.createStudent(dto, actorId);
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async bulkUploadStudents(
    @UploadedFile() file: Express.Multer.File,
    @Body('department') department: string,
    @Body('batch') batch: string,
    @CurrentUser('id') actorId: string,
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

    const result = await this.bulkUploadService.processExcel(file.buffer, actorId, department, batch);
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

  @Delete('companies/:id')
  async deleteCompany(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.deleteCompany(id, actorId);
    return { success: true, ...data };
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

  // ─── Department Management ─────────────────────
  @Get('departments')
  async listDepartments() {
    const data = await this.adminService.listDepartments();
    return { success: true, data };
  }

  @Post('departments')
  async createDepartment(
    @Body() body: { code: string; name: string },
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.createDepartment(body, actorId);
    return { success: true, data };
  }

  @Patch('departments/:id')
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: { code?: string; name?: string },
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.updateDepartment(id, body, actorId);
    return { success: true, data };
  }

  @Delete('departments/:id')
  async deleteDepartment(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.deleteDepartment(id, actorId);
    return { success: true, ...data };
  }

  // ─── Batch Management ──────────────────────────
  @Post('batches')
  async createBatch(
    @Body() body: { department: string; year: number; currentSemester: number },
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.createBatch(body, actorId);
    return { success: true, data };
  }

  @Get('batches')
  async listBatches() {
    const data = await this.adminService.listBatches();
    return { success: true, data };
  }

  @Post('batches/:id/promote')
  async promoteBatch(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.promoteBatch(id, actorId);
    return { success: true, data };
  }

  @Delete('batches/:id')
  async deleteBatch(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.adminService.deleteBatch(id, actorId);
    return { success: true, ...data };
  }

  // ─── Drive Management ──────────────────────────
  @Post('drives')
  async createDrive(
    @Body() body: {
      title: string;
      type: 'single' | 'multiple';
      jobId: string;
      description?: string;
      driveDate?: string;
      departments?: string[];
    },
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.driveService.createDrive(body, actorId);
    return { success: true, data };
  }

  @Get('drives')
  async listDrives() {
    const data = await this.driveService.listDrives();
    return { success: true, data };
  }

  @Get('drives/:id')
  async getDriveDetail(@Param('id') id: string) {
    const data = await this.driveService.getDriveDetail(id);
    return { success: true, data };
  }

  @Post('drives/:id/reject')
  async rejectDriveStudents(
    @Param('id') id: string,
    @Body() body: { studentIds: string[]; reason?: string },
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.driveService.rejectStudents(id, body.studentIds, body.reason || null, actorId);
    return { success: true, data };
  }

  @Post('drives/:id/approve-all')
  async approveAllDrive(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.driveService.approveAllPending(id, actorId);
    return { success: true, data };
  }

  @Post('drives/:id/allocate-slots')
  async allocateDriveSlots(
    @Param('id') id: string,
    @Body() body: {
      slots: Array<{ timeSlot: string; classroom: string; departments: string[] }>;
    },
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.driveService.allocateSlots(id, body.slots, actorId);
    return { success: true, data };
  }

  @Patch('drives/:id/status')
  async updateDriveStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.driveService.updateDriveStatus(id, body.status, actorId);
    return { success: true, data };
  }

  @Delete('drives/:id')
  async deleteDrive(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    const data = await this.driveService.deleteDrive(id, actorId);
    return { success: true, ...data };
  }
}
