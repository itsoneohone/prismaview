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
} from '@nestjs/common';
import { AccessKeyService } from 'src/access-key/access-key.service';
import { CreateAccessKeyDto } from 'src/access-key/dto';
import { GetUserFromJwt } from 'src/auth/decorators';
import { PaginateDto } from 'src/shared/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('access-key')
export class AccessKeyController {
  constructor(
    private service: AccessKeyService,
    private prisma: PrismaService,
  ) {}

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
