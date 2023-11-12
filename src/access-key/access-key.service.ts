import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessKey, ExchangeNameEnum } from '@prisma/client';
import { CreateAccessKeyDto } from 'src/access-key/dto';
import { PaginateDto, PaginateResultDto } from 'src/common/dto';
import { GetExchangeDto } from 'src/common/exchange/dto';
import { ExchangeFactory } from 'src/common/exchange/exchange.factory';
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
        select: { id: true, name: true, key: true, exchange: true },
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

  /**
   * Validate whether the API credentials are correct and do not provide broad permissions.
   *
   * @param dto CreateAccessKeyDto
   */
  async validateApiCredentials(dto: CreateAccessKeyDto) {
    // Instantiate the right exchange instance
    const exchangeDto: GetExchangeDto = {
      key: dto.key,
      secret: dto.secret,
      exchange: ExchangeNameEnum[dto.exchange],
    };
    const exchange = ExchangeFactory.create(exchangeDto);

    // Ensure the provided API credentials are valid
    const areCredentialsValid = await exchange.validateCredentials();
    if (areCredentialsValid === false) {
      throw new ForbiddenException(
        'The provided API credentials are incorrect or you have not enabled websocket connections.',
      );
    }

    // Ensure the provided API credentials to not give access to sensitive user information
    const areApiCredentialsLimited =
      await exchange.validateCredentialLimitations();
    if (areApiCredentialsLimited === false) {
      throw new ForbiddenException(
        'The provided API credentials provide broad permissions.',
      );
    }
  }

  async createApiKey(
    userId: number,
    dto: CreateAccessKeyDto,
  ): Promise<AccessKey> {
    await this.validateApiCredentials(dto);

    const accessKey = await this.prisma.accessKey.create({
      data: {
        ...dto,
        userId,
      },
    });
    delete accessKey.secret;
    delete accessKey.isDeleted;
    delete accessKey.userId;

    return accessKey;
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
