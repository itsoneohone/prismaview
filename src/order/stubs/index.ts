import { faker } from '@faker-js/faker';
import {
  OrderCreatedByEnum,
  OrderSideEnum,
  OrderStatusEnum,
  OrderTypeEnum,
} from '@prisma/client';
import { CreateOrderDto, UpdateOrderDto } from '@/order/dto';
import { DECIMAL_ROUNDING, getRandomAmount } from '@/shared/utils/amounts';

export const CreateOrderDtoStub = (): CreateOrderDto => {
  const date = new Date();
  return {
    orderId: faker.string.uuid(),
    timestamp: date.getTime(),
    datetime: date,
    status: OrderStatusEnum.CLOSED,
    symbol: 'BTC/USD',
    type: OrderTypeEnum.MARKET,
    side: OrderSideEnum.BUY,
    price: getRandomAmount(100),
    filled: getRandomAmount(10),
    fee: getRandomAmount(1),
  };
};
export const createOrderDtoStubStatic = CreateOrderDtoStub();
export const createOrderDtoStubStatic2 = CreateOrderDtoStub();

const date = new Date();
export const OrderStub = (
  userId: number,
  dto?: CreateOrderDto | UpdateOrderDto,
) => {
  // Calculate the cost based on the price and the filled amount
  const price = dto.price || getRandomAmount(100);
  const filled = dto.filled || getRandomAmount(10);
  const cost = price.mul(filled).toDecimalPlaces(DECIMAL_ROUNDING);
  // Set the base, quote and currency based on the symbol
  const base = dto.symbol.split('/')[0];
  const quote = dto.symbol.split('/')[1];
  const currency = dto.symbol.split('/')[1];

  return {
    ...(dto || CreateOrderDtoStub()),
    userId,
    base,
    quote,
    currency,
    filled,
    price,
    cost,
    timestamp: BigInt(dto.datetime.getTime()),
    createdBy: OrderCreatedByEnum.USER,
    createdAt: date,
    updatedAt: date,
  };
};
export const userId = 123;
export const orderStubStatic = OrderStub(userId, createOrderDtoStubStatic);
export const orderStubStatic2 = OrderStub(userId, createOrderDtoStubStatic2);

export const updateOrderDtoStubStatic: UpdateOrderDto = {
  ...createOrderDtoStubStatic,
  orderId: faker.string.uuid(),
  filled: getRandomAmount(100),
  price: getRandomAmount(100),
  datetime: new Date(date.setMonth(date.getMonth() - 1)),
};
export const updateOrderStubStatic = OrderStub(
  userId,
  updateOrderDtoStubStatic,
);

export const orderStubs = [orderStubStatic, orderStubStatic2];
