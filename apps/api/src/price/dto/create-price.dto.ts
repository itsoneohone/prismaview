import { ExchangeNameEnum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePriceDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsString()
  @IsOptional()
  base: string;

  @IsString()
  @IsOptional()
  quote: string;

  @IsDecimal()
  @IsNotEmpty()
  open: Decimal;

  @IsDecimal()
  @IsNotEmpty()
  high: Decimal;

  @IsDecimal()
  @IsNotEmpty()
  low: Decimal;

  @IsDecimal()
  @IsNotEmpty()
  close: Decimal;

  @IsDecimal()
  @IsNotEmpty()
  volume: Decimal;

  // @IsNotEmpty()
  @IsOptional()
  timestamp: bigint;

  @IsDateString()
  @IsOptional()
  datetime: Date;

  @IsEnum(ExchangeNameEnum)
  @IsNotEmpty()
  exchange: ExchangeNameEnum;
}
