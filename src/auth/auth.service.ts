import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async signup(dto: AuthDto) {
    // Get email and password
    // Check if the user exists

    // Hash the password

    const userExists = await this.prismaService.user.findFirst({
      where: {
        email: dto.email,
      },
    });
    // Store the user in the DB
    return { msg: 'sign up fn' };
  }

  signin() {
    return { msg: 'sign in fn' };
  }
}
