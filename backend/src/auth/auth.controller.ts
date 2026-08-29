import { Controller, Post, Body, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto, ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto, RegisterSendOtpDto, RegisterVerifyOtpDto, RegisterStudentDto, RegisterCompanyDto } from './dto/auth.dto';
import { Auth, CurrentUser } from './auth.decorators';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return { success: true, data: result };
  }

  @Patch('change-password')
  @Auth()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(userId, dto);
    return { success: true, data: result };
  }

  // ── Public: Forgot Password (Send OTP) ──────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    return { success: true, data: result };
  }

  // ── Public: Verify OTP ──────────────────────────────────
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(dto);
    return { success: true, data: result };
  }

  // ── Public: Reset Password with OTP ─────────────────────
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return { success: true, data: result };
  }

  // ── Public: Registration - Send OTP ─────────────────────
  @Post('register/send-otp')
  @HttpCode(HttpStatus.OK)
  async registerSendOtp(@Body() dto: RegisterSendOtpDto) {
    const result = await this.authService.sendRegistrationOtp(dto);
    return { success: true, data: result };
  }

  // ── Public: Registration - Verify OTP ───────────────────
  @Post('register/verify-otp')
  @HttpCode(HttpStatus.OK)
  async registerVerifyOtp(@Body() dto: RegisterVerifyOtpDto) {
    const result = await this.authService.verifyRegistrationOtp(dto);
    return { success: true, data: result };
  }

  // ── Public: Registration - Complete Student Registration ─
  @Post('register/student')
  @HttpCode(HttpStatus.CREATED)
  async registerStudent(@Body() dto: RegisterStudentDto) {
    const result = await this.authService.registerStudent(dto);
    return { success: true, data: result };
  }

  // ── Public: Registration - Complete Company Registration ──
  @Post('register/company')
  @HttpCode(HttpStatus.CREATED)
  async registerCompany(@Body() dto: RegisterCompanyDto) {
    const result = await this.authService.registerCompany(dto);
    return { success: true, data: result };
  }
}
