import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from 'src/services/auth.service';
import { LoginDto, SupervisorLoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('supervisor/login')
  supervisorLogin(@Body() supervisorLoginDto: SupervisorLoginDto) {
    return this.authService.supervisorLogin(supervisorLoginDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
