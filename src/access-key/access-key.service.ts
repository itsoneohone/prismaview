import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessKey } from '@prisma/client';
import { CreateAccessKeyDto } from 'src/access-key/dto';
import { PaginateDto, PaginateResultDto } from 'src/common/dto';
import {
  preparePaginateResultDto,
  SEARCH_LIMIT,
} from 'src/common/search-utils';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AccessKeyService {
  constructor(private prisma: PrismaService) {}

  async getApiKeys(
    userId: number,
    paginate?: PaginateDto,
  ): Promise<PaginateResultDto> {
    if (!paginate) {
      paginate = {
        limit: SEARCH_LIMIT,
        offset: 0,
      };
    }

    const [accessKeys, count] = await Promise.all([
      this.prisma.accessKey.findMany({
        where: {
          userId,
          isDeleted: false,
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
          isDeleted: false,
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

  async deleteApiKeyById(userId: number, id: number) {
    const accessKey = await this.prisma.accessKey.findFirst({
      where: { userId, id, isDeleted: false },
    });

    if (!accessKey) {
      throw new NotFoundException('Resource does not exist');
    }

    if (accessKey.userId !== userId) {
      throw new ForbiddenException('Access to resource unauthorized');
    }

    return await this.prisma.accessKey.update({
      where: {
        id: id,
        userId,
      },
      data: {
        isDeleted: true,
      },
    });
  }
}
