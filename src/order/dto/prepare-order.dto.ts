import {
  OrderCurrencyEnum,
  OrderSideEnum,
  OrderStatusEnum,
  OrderTypeEnum,
} from '@prisma/client';
import { CreateOrderDto } from 'src/order/dto/create-order.dto';

/**
 * Prepare an Order DTO using a ccxt order object
 *
 * @param userId
 * @param accessKey
 * @param ccxtOrder
 * @returns
 */
export const prepareOrderDto = (
  userId: number,
  accessKeyId: number,
  ccxtOrder,
): CreateOrderDto => {
  return {
    orderId: ccxtOrder.id,
    timestamp: ccxtOrder.timestamp,
    datetime: ccxtOrder.datetime,
    status: OrderStatusEnum[ccxtOrder.status.toUpperCase()],
    symbol: ccxtOrder.symbol,
    type: OrderTypeEnum[ccxtOrder.type.toUpperCase()],
    side: OrderSideEnum[ccxtOrder.side.toUpperCase()],
    price: ccxtOrder.price,
    filled: ccxtOrder.filled || ccxtOrder.amount,
    cost: ccxtOrder.cost,
    fee: ccxtOrder.fee.cost,
    currency: OrderCurrencyEnum[ccxtOrder.fee.currency.toUpperCase()],
    accessKeyId: accessKeyId,
    userId,
    rawData: ccxtOrder,
  };
};
