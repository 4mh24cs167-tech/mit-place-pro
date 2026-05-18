import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { LoginDto, ChangePasswordDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto } from './dto/auth.dto';
import { EmailService } from '../admin/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
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

  async validateUser(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'email', 'role', 'isActive'],
    });
  }
}
