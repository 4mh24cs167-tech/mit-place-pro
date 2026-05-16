import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { UserRole } from '../entities/user.entity';
import { CreateCompanyDto, BulkApproveDto, UpdateStudentDto, PaginationDto } from './dto/admin.dto';

@Controller('api/v1/admin')
@Auth(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
}
