import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Company } from '../entities/company.entity';
import { Department } from '../entities/department.entity';
import { Batch } from '../entities/batch.entity';
import { LoginDto, ChangePasswordDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto, RegisterSendOtpDto, RegisterVerifyOtpDto, RegisterStudentDto, RegisterCompanyDto } from './dto/auth.dto';
import { EmailService } from '../admin/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly registrationOtps = new Map<string, { otp: string; expiresAt: Date; fullName?: string }>();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Your account is pending admin approval. Please wait for approval before logging in.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepo.update(userId, {
      passwordHash: newHash,
      mustChangePassword: false,
    });

    return { message: 'Password changed successfully' };
  }

  // ── Forgot Password: Send OTP ─────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), isActive: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.warn(`Forgot password requested for non-existent email: ${dto.email}`);
      return { message: 'If the email exists, an OTP has been sent.' };
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user record
    await this.userRepo.update(user.id, {
      resetOtp: otp,
      resetOtpExpiresAt: expiresAt,
    });

    // Send OTP via email
    const sent = await this.emailService.sendOtpEmail(user.email, otp);
    if (!sent) {
      this.logger.warn(`OTP email delivery failed for ${user.email}. OTP: ${otp}`);
    }

    this.logger.log(`OTP generated for ${user.email}, expires at ${expiresAt.toISOString()}`);

    return { message: 'If the email exists, an OTP has been sent.' };
  }

  // ── Verify OTP ─────────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), isActive: true },
    });

    if (!user || !user.resetOtp || !user.resetOtpExpiresAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (new Date() > user.resetOtpExpiresAt) {
      // Clear expired OTP
      await this.userRepo.update(user.id, {
        resetOtp: null,
        resetOtpExpiresAt: null,
      });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (user.resetOtp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    return { verified: true, message: 'OTP verified successfully' };
  }

  // ── Reset Password with OTP ────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), isActive: true },
    });

    if (!user || !user.resetOtp || !user.resetOtpExpiresAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (new Date() > user.resetOtpExpiresAt) {
      await this.userRepo.update(user.id, {
        resetOtp: null,
        resetOtpExpiresAt: null,
      });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (user.resetOtp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    // Update password and clear OTP
    await this.userRepo.update(user.id, {
      passwordHash: newHash,
      mustChangePassword: false,
      resetOtp: null,
      resetOtpExpiresAt: null,
    });

    this.logger.log(`Password reset successfully for ${user.email}`);

    return { message: 'Password has been reset successfully' };
  }

  // ── Registration: Send OTP ────────────────────────────────
  async sendRegistrationOtp(dto: RegisterSendOtpDto) {
    const email = dto.email.toLowerCase();
    
    // Check if email already exists
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('An account with this email already exists');
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in memory map
    this.registrationOtps.set(email, { otp, expiresAt });

    // Send OTP via email
    const sent = await this.emailService.sendOtpEmail(email, otp);
    if (!sent) {
      this.logger.warn(`Registration OTP email delivery failed for ${email}. OTP: ${otp}`);
    }

    this.logger.log(`Registration OTP generated for ${email}`);
    return { message: 'OTP sent to your email address' };
  }

  // ── Registration: Verify OTP ──────────────────────────────
  async verifyRegistrationOtp(dto: RegisterVerifyOtpDto) {
    const email = dto.email.toLowerCase();
    const stored = this.registrationOtps.get(email);

    if (!stored) {
      throw new BadRequestException('No OTP found for this email. Please request a new one.');
    }

    if (new Date() > stored.expiresAt) {
      this.registrationOtps.delete(email);
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (stored.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    return { verified: true, message: 'Email verified successfully' };
  }

  // ── Registration: Register Student ────────────────────────
  async registerStudent(dto: RegisterStudentDto) {
    const email = dto.email.toLowerCase();

    // Verify OTP one final time
    const stored = this.registrationOtps.get(email);
    if (!stored || stored.otp !== dto.otp || new Date() > stored.expiresAt) {
      throw new BadRequestException('Invalid or expired OTP. Please start over.');
    }

    // Check email not taken
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('An account with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user
    const user = this.userRepo.create({
      email,
      passwordHash,
      role: 'student' as any,
      mustChangePassword: false,
      isActive: true,
    });
    await this.userRepo.save(user);

    // Ensure GLOBAL department exists
    let globalDept = await this.departmentRepo.findOne({ where: { code: 'GLOBAL' } });
    if (!globalDept) {
      globalDept = this.departmentRepo.create({
        code: 'GLOBAL',
        name: 'Global (Self-Registered)',
        isActive: true,
      });
      await this.departmentRepo.save(globalDept);
    }

    // Ensure GLOBAL batch exists for current year
    const currentYear = new Date().getFullYear();
    let globalBatch = await this.batchRepo.findOne({
      where: { department: 'GLOBAL', year: currentYear },
    });
    if (!globalBatch) {
      globalBatch = this.batchRepo.create({
        name: `GLOBAL ${currentYear}`,
        department: 'GLOBAL',
        year: currentYear,
        currentSemester: 1,
        studentCount: 0,
      });
      await this.batchRepo.save(globalBatch);
    }

    // Create student record with batch assignment
    const student = this.studentRepo.create({
      user,
      fullName: dto.fullName,
      usn: `SELF-${Date.now()}`,
      department: 'GLOBAL',
      batchId: globalBatch.id,
      semester: globalBatch.currentSemester,
      profileComplete: false,
      profileData: {},
    });
    await this.studentRepo.save(student);

    // Update batch student count
    globalBatch.studentCount += 1;
    await this.batchRepo.save(globalBatch);

    // Clean up OTP
    this.registrationOtps.delete(email);

    this.logger.log(`Student registered successfully: ${email}`);
    return { message: 'Registration successful! You can now login.' };
  }

  // ── Helper: Validate company domain email ──────────────────
  private isCompanyDomainEmail(email: string): boolean {
    const freeEmailDomains = [
      'gmail.com', 'yahoo.com', 'yahoo.co.in', 'hotmail.com', 'outlook.com',
      'live.com', 'aol.com', 'protonmail.com', 'icloud.com', 'mail.com',
      'zoho.com', 'yandex.com', 'gmx.com', 'rediffmail.com',
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return domain ? !freeEmailDomains.includes(domain) : false;
  }

  // ── Registration: Register Company ────────────────────────
  async registerCompany(dto: RegisterCompanyDto) {
    const email = dto.email.toLowerCase();

    // Validate company domain email
    if (!this.isCompanyDomainEmail(email)) {
      throw new BadRequestException('Please use a company domain email address (e.g. name@company.com). Free email providers like Gmail, Yahoo are not accepted.');
    }

    // Verify OTP one final time
    const stored = this.registrationOtps.get(email);
    if (!stored || stored.otp !== dto.otp || new Date() > stored.expiresAt) {
      throw new BadRequestException('Invalid or expired OTP. Please start over.');
    }

    // Check email not taken
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('An account with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user with company role
    const user = this.userRepo.create({
      email,
      passwordHash,
      role: 'company' as any,
      mustChangePassword: false,
      isActive: false,
    });
    await this.userRepo.save(user);

    // Create company record
    const company = this.companyRepo.create({
      user,
      name: dto.companyName,
      hrPhone: dto.companyPhone,
      profileComplete: false,
    });
    await this.companyRepo.save(company);

    // Clean up OTP
    this.registrationOtps.delete(email);

    this.logger.log(`Company registered successfully: ${email}`);
    return { message: 'Registration successful! Your account is pending admin approval. You will be notified once approved.' };
  }

  async validateUser(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'email', 'role', 'isActive'],
    });
  }
}
