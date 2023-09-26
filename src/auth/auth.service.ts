import * as argon from 'argon2';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prismaService: PrismaService) {}

  async signup(dto: AuthDto) {
    // Check if the user exists
    const userExists = await this.prismaService.user.count({
      where: {
        email: dto.email,
      },
    });

    if (userExists) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Hash the password
    const hashedPassword = await argon.hash(dto.password);

    // Store the user in the DB
    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        hash: hashedPassword,
      },
    });

    return { id: user.id, email: user.email };
  }

  async signin(dto: AuthDto) {
    // Get user by email
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Verify hashed password
    const passwordMatches = await argon.verify(user.hash, dto.password);

    if (!passwordMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Return user information
    return { id: user.id, email: user.email };
  }
}
