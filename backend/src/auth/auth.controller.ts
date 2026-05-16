import { Controller, Post, Body, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto';
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
}
