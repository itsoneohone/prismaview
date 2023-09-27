import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Session,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { UserSession } from './types';
import { PublicRoute } from './decorators';

@PublicRoute()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: AuthDto, @Session() session: UserSession) {
    const { id, email } = await this.authService.signup(dto);
    this.serializeSession(id, email, session);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Body() dto: AuthDto, @Session() session: UserSession) {
    const { id, email } = await this.authService.signin(dto);
    this.serializeSession(id, email, session);
  }

  private serializeSession(id: number, email: string, session: UserSession) {
    session.user = {
      id,
      email,
    };
  }
}
