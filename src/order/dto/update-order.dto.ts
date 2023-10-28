import {
  OrderCurrency,
  OrderSide,
  OrderStatus,
  OrderType,
} from '@prisma/client';
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
  timestamp: number;

  @IsDateString()
  @IsOptional()
  datetime: Date;

  @IsEnum(OrderStatus)
  @IsOptional()
  status: OrderStatus;

  @IsString()
  @IsOptional()
  symbol: string;

  @IsEnum(OrderType)
  @IsOptional()
  type: OrderType;

  @IsEnum(OrderSide)
  @IsOptional()
  side: OrderSide;

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

  @IsEnum(OrderCurrency)
  @IsOptional()
  currency: OrderCurrency;
}
