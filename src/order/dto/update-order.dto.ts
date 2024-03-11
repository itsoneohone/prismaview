import { OrderSideEnum, OrderStatusEnum, OrderTypeEnum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateOrderDto {
  @IsString()
  @IsOptional()
  orderId: string;

  @IsNumber()
  @IsOptional()
  timestamp: bigint;

  @IsDateString()
  @IsOptional()
  datetime: Date;

  @IsEnum(OrderStatusEnum)
  @IsOptional()
  status: OrderStatusEnum;

  @IsString()
  @IsOptional()
  symbol: string;

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

  // filled * price
  @IsDecimal()
  @IsOptional()
  cost: Decimal;

  @IsDecimal()
  @IsOptional()
  fee: Decimal;
}
