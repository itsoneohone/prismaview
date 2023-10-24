import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessKey } from '@prisma/client';
import { CreateAccessKeyDto } from 'src/access-keys/dto';
import { PaginateDto, PaginateResultDto } from 'src/common/dto';
import { preparePaginateResultDto } from 'src/common/utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AccessKeysService {
  constructor(private prisma: PrismaService) {}

  async getApiKeys(
    userId: number,
    paginate: PaginateDto,
  ): Promise<PaginateResultDto> {
    const [accessKeys, count] = await Promise.all([
      this.prisma.accessKey.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: paginate.limit,
        skip: paginate.offset,
      }),
      this.prisma.accessKey.count({
        where: {
          userId,
        },
      }),
    ]);

    return preparePaginateResultDto(accessKeys, count, paginate);
  }

  createApiKey(userId: number, dto: CreateAccessKeyDto): Promise<AccessKey> {
    return this.prisma.accessKey.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async deleteApiKey(userId: number, id: number) {
    const accessKey = await this.prisma.accessKey.findFirst({
      where: { userId, id },
    });

    if (!accessKey) {
      throw new NotFoundException('Resource does not exist');
    }

    if (accessKey.userId !== userId) {
      throw new ForbiddenException('Access to resource unauthorized');
    }

    return this.prisma.accessKey.delete({
      where: {
        id: accessKey.id,
        userId,
      },
    });
  }
}
