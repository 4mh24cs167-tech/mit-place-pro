import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
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

  async validateUser(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'email', 'role', 'isActive'],
    });
  }
}
