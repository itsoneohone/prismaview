import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Render,
  Res,
  Session,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { UserSession } from './types';
import { PublicRoute } from './decorators';
import { Role } from '@prisma/client';
import { Response } from 'express';

@PublicRoute()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: AuthDto, @Session() session: UserSession) {
    const { id, email, role } = await this.authService.signup(dto);
    return this.serializeSession(id, email, role, session);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signin(@Body() dto: AuthDto, @Session() session: UserSession) {
    const { id, email, role } = await this.authService.signin(dto);
    return this.serializeSession(id, email, role, session);
  }

  private serializeSession(
    id: number,
    email: string,
    role: Role,
    session: UserSession,
  ) {
    session.user = {
      id,
      email,
      role,
    };
  }

  @Get('signin')
  orderList(@Res() res: Response) {
    return res.render('auth/signin', {
      // layout: 'layouts/index',
      message: 'Sign in form',
    });
  }
}
