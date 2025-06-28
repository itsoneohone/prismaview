import { OmitType } from '@nestjs/mapped-types';
import {
  OrderCreatedByEnum,
  OrderSideEnum,
  OrderStatusEnum,
  OrderTypeEnum,
} from '@prisma/client';
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

/**
 * DTO for transferring order data from client to server.
 *
 * Enforces strict validation on incoming fields. Used as the initial data structure
 * before conversion to CreateOrderDbDto for database storage, as client-side data
 * doesn't support bigint and lacks calculated fields needed for persistence.
 */
export class CreateOrderDto {
  @IsString()
  @IsOptional()
  orderId: string;

  @IsOptional()
  timestamp: string | number;

  @IsDateString()
  @IsNotEmpty()
  datetime: Date;

  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  status: OrderStatusEnum;

  @IsString()
  @IsNotEmpty()
  symbol: string;

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

  @IsDecimal()
  @IsNotEmpty()
  fee: Decimal;
}

/**
 * Database-specific DTO that extends CreateOrderDto.
 *
 * Overrides timestamp as bigint and adds additional fields needed for database storage
 * such as orderId, base, quote, and other calculated values from the symbol.
 */
export class CreateOrderDbDto extends OmitType(CreateOrderDto, ['timestamp']) {
  declare timestamp: bigint;

  // Calculated using the symbol
  @IsString()
  @IsOptional()
  base: string;

  // Calculated using the symbol
  @IsString()
  @IsOptional()
  quote: string;

  // All amounts are designated in this currency, which is the same as the quote currency.
  // This is a calculated field
  @IsString()
  @IsOptional()
  currency: string;

  // filled * price
  @IsDecimal()
  @IsOptional()
  cost: Decimal;

  @IsNumber()
  @IsOptional()
  accessKeyId: number;

  @IsNumber()
  @IsOptional()
  userId: number;

  @IsOptional()
  rawData: string;

  @IsEnum(OrderCreatedByEnum)
  @IsOptional()
  createdBy: OrderCreatedByEnum = OrderCreatedByEnum.USER;
}
