import { ExchangeNameEnum } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetExchangeDto {
  // The internal Id of the access key
  @IsNumber()
  @IsOptional()
  accessKeyId: number;

  // The owner of the access key
  @IsNumber()
  userId: number;

  @IsString()
  key: string;

  @IsString()
  secret: string;

  @IsEnum(ExchangeNameEnum)
  exchange: ExchangeNameEnum;
}
