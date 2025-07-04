import * as argon from 'argon2';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private userService: UserService,
    private config: ConfigService,
  ) {}

  /**
   * Sign up a user
   *
   * Currently not in used as we don't use sessions but rely on jwt tokens.
   *
   * @param dto
   * @returns
   */
  async signup(dto: AuthDto) {
    // Check if the user exists
    const userExists = await this.prisma.user.count({
      where: {
        email: dto.email,
      },
    });

    if (userExists) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Hash the password - the generated hash includes all the necessary information
    // (algorithm, parameters, salt, and the hashed password) in a single string.
    const hashedPassword = await argon.hash(dto.password);

    // Store the user in the DB
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash: hashedPassword,
      },
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  /**
   * Sign in a user
   *
   * Currently not in used as we don't use sessions but rely on jwt tokens.
   *
   * @param dto
   * @returns
   */
  async signin(dto: AuthDto) {
    // Get user by email
    const user = await this.prisma.user.findUnique({
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
    return { id: user.id, email: user.email, role: user.role };
  }

  /**
   * Sign a jwt token for a user.
   *
   * The token expires in 60minutes.
   *
   * @param userId
   * @param email
   * @param role
   * @returns
   */
  private async signJwtToken(userId: number, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
    };
    const jwtSignOptions: JwtSignOptions = {
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
      secret: this.config.get('JWT_SECRET'),
    };
    const accessToken = await this.jwt.signAsync(payload, jwtSignOptions);

    return {
      access_token: accessToken,
    };
  }

  /**
   * Create a new user and return a jwt access token
   *
   * @param dto AuthDto
   * @returns
   */
  async jwtSignup(dto: AuthDto) {
    const hash = await argon.hash(dto.password);

    const createUserDto: CreateUserDto = {
      email: dto.email,
      hash,
    };
    const user = await this.userService.createUser(createUserDto);

    return this.signJwtToken(user.id, user.email, user.role);
  }

  /**
   * Sign in the user and return a jwt access token
   *
   * @param dto AuthDto
   * @returns
   */
  async jwtSignin(dto: AuthDto) {
    // Check if the user exists
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Verify the password
    const pswdMatches = await argon.verify(user.hash, dto.password);

    if (!pswdMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }

    // Return the jwt access token
    return this.signJwtToken(user.id, user.email, user.role);
  }
}
