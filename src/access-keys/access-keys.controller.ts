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
import { AccessKeysService } from 'src/access-keys/access-keys.service';
import { CreateAccessKeyDto } from 'src/access-keys/dto';
import { GetUserFromJwt } from 'src/auth/decorators';
import { PaginateDto } from 'src/common/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('access-keys')
export class AccessKeysController {
  constructor(
    private service: AccessKeysService,
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
    return this.service.deleteApiKey(userId, id);
  }
}
