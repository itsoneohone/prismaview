import {
  CreateOrderDbDto,
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderDbDto,
} from '@/order/dto';
import { calculateOrderAmounts, getTickerSymbols } from '@/order/common/utils';
import {
  Order,
  OrderStatusEnum,
  OrderTypeEnum,
  OrderSideEnum,
} from '@prisma/client';
/**
 * Converts a CreateOrderDto to CreateOrderDbDto by:
 * 1. Copying all properties from the input DTO
 * 2. Setting the user ID
 * 3. Converting timestamp to BigInt
 * 4. Calculating filled, price and cost values
 * 5. Extracting base, quote and currency from symbol
 *
 * @param userId - The ID of the user creating the order
 * @param dto - The input CreateOrderDto with order details
 * @returns A fully populated CreateOrderDbDto ready for database insertion
 */
export function toCreateOrderDbDto(
  userId: number,
  dto: CreateOrderDto,
): CreateOrderDbDto {
  const createOrderDbDto = new CreateOrderDbDto();
  Object.assign(createOrderDbDto, dto);

  createOrderDbDto.userId = userId;
  createOrderDbDto.timestamp = BigInt(new Date(dto.timestamp).getTime());
  ({
    filled: createOrderDbDto.filled,
    price: createOrderDbDto.price,
    cost: createOrderDbDto.cost,
  } = calculateOrderAmounts(dto.filled, dto.price));
  ({
    base: createOrderDbDto.base,
    quote: createOrderDbDto.quote,
    currency: createOrderDbDto.currency,
  } = getTickerSymbols(dto.symbol));

  return createOrderDbDto;
}

/**
 * Converts a UpdateOrderDto to UpdateOrderDbDto by:
 * 1. Copying all properties from the input DTO
 * 2. Updating the cost value if the filled or price values have changed
 * 3. Updating the base, quote and currency values if the symbol has changed
 * 4. Updating the timestamp if the datetime value has changed
 *
 * @param dto - The input UpdateOrderDto with order details
 * @param order - The existing order that is being updated
 * @returns A fully populated CreateOrderDbDto ready for database insertion
 */

export function toUpdateOrderDbDto(
  dto: UpdateOrderDto,
  order: Order,
): UpdateOrderDbDto {
  const updateOrderDbDto = new UpdateOrderDbDto();
  Object.assign(updateOrderDbDto, dto);

  if (dto.filled || dto.price) {
    const filled = dto.filled || order.filled;
    const price = dto.price || order.price;
    Object.assign(updateOrderDbDto, calculateOrderAmounts(filled, price));
  }

  // Update the base, quote and currency based on the new symbol
  if (dto.symbol) {
    Object.assign(updateOrderDbDto, getTickerSymbols(dto.symbol));
  }

  // @todo - convert amounts to user's base currency if needed
  // Get the unix timestamp based on the input date
  if (dto.datetime) {
    updateOrderDbDto.timestamp = BigInt(new Date(dto.datetime).getTime());
  }

  return updateOrderDbDto;
}

/**
 * Prepare an Order DTO using a ccxt order object
 *
 * @param userId
 * @param accessKey
 * @param ccxtOrder
 * @returns
 */
export const ccxtToCreateOrderDbDto = (
  userId: number,
  accessKeyId: number,
  ccxtOrder,
): CreateOrderDbDto => {
  const { base, quote, currency } = getTickerSymbols(ccxtOrder.symbol);

  return {
    orderId: ccxtOrder.id,
    timestamp: ccxtOrder.timestamp,
    datetime: ccxtOrder.datetime,
    status: OrderStatusEnum[ccxtOrder.status.toUpperCase()],
    symbol: ccxtOrder.symbol,
    base,
    quote,
    currency,
    type: OrderTypeEnum[ccxtOrder.type.toUpperCase()],
    side: OrderSideEnum[ccxtOrder.side.toUpperCase()],
    price: ccxtOrder.price,
    filled: ccxtOrder.filled || ccxtOrder.amount,
    cost: ccxtOrder.cost,
    fee: ccxtOrder.fee.cost,
    accessKeyId: accessKeyId,
    userId,
    rawData: ccxtOrder,
  };
};

export const OrderDtoMappers = {
  toCreateOrderDbDto,
  toUpdateOrderDbDto,
  ccxtToCreateOrderDbDto,
};
