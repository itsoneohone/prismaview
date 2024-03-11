import { OrderSideEnum, OrderStatusEnum, OrderTypeEnum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  orderId: string;

  @IsNumber()
  @IsOptional()
  timestamp: bigint;

  @IsDateString()
  @IsNotEmpty()
  datetime: Date;

  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  status: OrderStatusEnum;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  // This is calculated using the symbol
  @IsString()
  @IsOptional()
  base: string;

  // This is calculated using the symbol
  @IsString()
  @IsOptional()
  quote: string;

  // All amounts are designated in this currency, which is the same as the quote currency.
  // This is a calculated field
  @IsString()
  @IsOptional()
  currency: string;

  @IsEnum(OrderTypeEnum)
  @IsNotEmpty()
  type: OrderTypeEnum;

  @IsEnum(OrderSideEnum)
  @IsNotEmpty()
  side: OrderSideEnum;

  @IsDecimal()
  @IsNotEmpty()
  price: Decimal;

  // actual order amount filled
  @IsDecimal()
  @IsNotEmpty()
  filled: Decimal;

  // filled * price
  @IsDecimal()
  @IsOptional()
  cost: Decimal;

  @IsDecimal()
  @IsNotEmpty()
  fee: Decimal;

  @IsNumber()
  @IsOptional()
  accessKeyId: number;

  @IsNumber()
  @IsOptional()
  userId: number;

  @IsOptional()
  rawData: string;
}
