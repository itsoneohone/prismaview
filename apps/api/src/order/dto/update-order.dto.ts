import { OrderSideEnum, OrderStatusEnum, OrderTypeEnum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { OmitType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  orderId: string;

  @IsOptional()
  timestamp: string | number;

  @IsDateString()
  @IsOptional()
  datetime: Date;

  @IsEnum(OrderStatusEnum)
  @IsOptional()
  status: OrderStatusEnum;

  @IsString()
  @IsOptional()
  symbol: string;

  @IsEnum(OrderTypeEnum)
  @IsOptional()
  type: OrderTypeEnum;

  @IsEnum(OrderSideEnum)
  @IsOptional()
  side: OrderSideEnum;

  @IsDecimal()
  @IsOptional()
  price: Decimal;

  // actual order amount filled
  @IsDecimal()
  @IsOptional()
  filled: Decimal;

  @IsDecimal()
  @IsOptional()
  fee: Decimal;
}

export class UpdateOrderDbDto extends OmitType(UpdateOrderDto, ['timestamp']) {
  declare timestamp: bigint;

  @IsString()
  @IsOptional()
  base: string;

  @IsString()
  @IsOptional()
  quote: string;

  // All amounts are designated in this currency, which is the same as the quote currency.
  @IsString()
  @IsOptional()
  currency: string;

  // filled * price
  @IsDecimal()
  @IsOptional()
  cost: Decimal;
}
