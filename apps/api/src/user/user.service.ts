import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prismaModule/prisma.service';
import { CreateUserDto } from '@user/dto';
import { UserSettingName } from '@user/common/constants';
import { FiatCurrency } from '@shared/constants/currency';
import {
  serializeUserForSelf,
  serializeUserForPublic,
  serializeUsers,
} from '@user/serializers';
import { UserWithSettings, SerializationLevel } from '@user/types';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user with their default settings
   *
   * @param userDto
   * @returns
   */
  async createUser(userDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...userDto,
        userSettings: {
          create: [
            // USD is the default base currency
            {
              name: UserSettingName.BASE_CURRENCY,
              value: FiatCurrency.USD,
            },
          ],
        },
      },
    });
  }

  /**
   * Get current user with settings (for self view)
   */
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        userSettings: true,
      },
    });

    if (!user) {
      return null;
    }

    return serializeUserForSelf(user as UserWithSettings);
  }

  /**
   * Get all users with public information
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        userSettings: true,
      },
    });

    return serializeUsers(
      users as UserWithSettings[],
      SerializationLevel.PUBLIC,
    );
  }

  /**
   * Get user by ID with settings (for admin view)
   */
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        userSettings: true,
      },
    });

    if (!user) {
      return null;
    }

    return serializeUserForSelf(user as UserWithSettings);
  }

  /**
   * Get user by ID with public information only
   */
  async getPublicUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        userSettings: true,
      },
    });

    if (!user) {
      return null;
    }

    return serializeUserForPublic(user as UserWithSettings);
  }

  async getMeTest(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    delete user.hash;

    return user;
  }
}
