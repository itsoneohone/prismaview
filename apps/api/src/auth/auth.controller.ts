import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Session,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { UserSession } from './types';
import { PublicRoute } from './decorators';
import { RoleEnum } from '@prisma/client';
import { Response } from 'express';

@PublicRoute()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Not used
  private _serializeSession(
    id: number,
    email: string,
    role: RoleEnum,
    session: UserSession,
  ) {
    session.user = {
      id,
      email,
      role,
    };
  }

  // Not used
  @Post('signup-session')
  async signupSession(@Body() dto: AuthDto, @Session() session: UserSession) {
    const { id, email, role } = await this.authService.signup(dto);
    return this._serializeSession(id, email, role, session);
  }

  // Not used
  @HttpCode(HttpStatus.OK)
  @Post('signin-session')
  async signinSession(@Body() dto: AuthDto, @Session() session: UserSession) {
    const { id, email, role } = await this.authService.signin(dto);
    return this._serializeSession(id, email, role, session);
  }

  @Get('signin')
  signinForm(@Res() res: Response) {
    return res.render('auth/signin', {
      // layout: 'layouts/index',
      message: 'Sign in form',
    });
  }

  @Post('signup')
  async signup(@Body() dto: AuthDto) {
    return this.authService.jwtSignup(dto);
  }

  @Post('signin')
  async signin(@Body() dto: AuthDto) {
    return this.authService.jwtSignin(dto);
  }
}
