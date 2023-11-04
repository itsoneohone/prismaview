import {
  OrderCurrencyEnum,
  OrderSideEnum,
  OrderStatusEnum,
  OrderTypeEnum,
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

  // filled * price
  @IsDecimal()
  @IsOptional()
  cost: Decimal;

  @IsDecimal()
  @IsOptional()
  fee: Decimal;

  @IsEnum(OrderCurrencyEnum)
  @IsOptional()
  currency: OrderCurrencyEnum;
}
