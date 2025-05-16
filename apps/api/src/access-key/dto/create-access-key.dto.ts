import { ExchangeNameEnum } from '@prisma/client';
import { IsEnum, IsNumber, IsString } from 'class-validator';

export class CreateAccessKeyDto {
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsString()
  secret: string;

  @IsEnum(ExchangeNameEnum)
  exchange: ExchangeNameEnum;
}
