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
import { AccessKeyService } from '@/access-key/access-key.service';
import { CreateAccessKeyDto } from '@/access-key/dto';
import { GetUserFromJwt } from '@/auth/decorators';
import { PaginateDto } from '@shared/dto';
import { PrismaService } from '@/prisma/prisma.service';
import { UserCacheInterceptor } from '@shared/interceptors/user-cache.interceptor';

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
