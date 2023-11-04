import { ExchangeNameEnum } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class GetExchangeDto {
  @IsString()
  key: string;

  @IsString()
  secret: string;

  @IsEnum(ExchangeNameEnum)
  exchange: ExchangeNameEnum;
}
