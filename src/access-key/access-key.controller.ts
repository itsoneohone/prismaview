import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { AccessKeyService } from 'src/access-key/access-key.service';
import { CreateAccessKeyDto } from 'src/access-key/dto';
import { GetUserFromJwt } from 'src/auth/decorators';
import { PaginateDto } from 'src/shared/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheKey, CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { UserCacheInterceptor } from 'src/shared/interceptors/user-cache.interceptor';

@Controller('access-key')
export class AccessKeyController {
  constructor(
    private service: AccessKeyService,
    private prisma: PrismaService,
  ) {}

  @UseInterceptors(UserCacheInterceptor('access-keys'))
  @Get()
  getApiKeys(
    @GetUserFromJwt('id') userId: number,
    @Query() paginate: PaginateDto,
  ) {
    return this.service.getApiKeys(userId, paginate);
  }

  @Post()
  createApiKey(
    @GetUserFromJwt('id') userId: number,
    @Body() dto: CreateAccessKeyDto,
  ) {
    return this.service.createApiKey(userId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteApiKeyById(
    @GetUserFromJwt('id') userId: number,
    @Param('id') id: number,
  ) {
    return this.service.deleteApiKeyById(userId, id);
  }
}
