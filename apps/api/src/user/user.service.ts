import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from '@/user/dto';
import { UserSettingName } from '@/user/common/constants';
import { FiatCurrency } from '@/shared/constants/currency';

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

  getMe(userId: number) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }

  getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
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
