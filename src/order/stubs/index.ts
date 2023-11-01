import { faker } from '@faker-js/faker';
import {
  OrderCreatedBy,
  OrderCurrency,
  OrderSide,
  OrderStatus,
  OrderType,
} from '@prisma/client';
import { CreateOrderDto, UpdateOrderDto } from 'src/order/dto';
import { DECIMAL_ROUNDING, getRandomAmount } from 'src/common/amounts';
import { userStubStatic } from 'src/user/stubs';

export const CreateOrderDtoStub = (): CreateOrderDto => {
  const date = new Date();
  const price = getRandomAmount(100);
  // actual order amount filled
  const filled = getRandomAmount(10);
  // filled * price
  const cost = price.mul(filled).toDecimalPlaces(DECIMAL_ROUNDING);
  const fee = getRandomAmount(1);

  return {
    orderId: faker.string.uuid(),
    timestamp: date.getTime(),
    datetime: date,
    status: OrderStatus.CLOSED,
    symbol: 'BTC/EUR',
    type: OrderType.MARKET,
    side: OrderSide.BUY,
    price,
    filled,
    cost,
    fee,
    currency: OrderCurrency.EUR,
  };
};
export const createOrderDtoStubStatic = CreateOrderDtoStub();
export const createOrderDtoStubStatic2 = CreateOrderDtoStub();

const date = new Date();
export const OrderStub = (
  userId: number,
  dto: CreateOrderDto | UpdateOrderDto,
) => {
  return {
    ...dto,
    userId,
    createdBy: OrderCreatedBy.USER,
    createdAt: date,
    updatedAt: date,
  };
};
const _user = userStubStatic;
export const orderStubStatic = OrderStub(_user.id, createOrderDtoStubStatic);
export const orderStubStatic2 = OrderStub(_user.id, createOrderDtoStubStatic2);

export const updateOrderDtoStubStatic: UpdateOrderDto = {
  ...createOrderDtoStubStatic,
  filled: getRandomAmount(100),
  price: getRandomAmount(100),
  datetime: new Date(date.setMonth(date.getMonth() - 1)),
};

export const updateOrderStubStatic = OrderStub(_user.id, {
  ...updateOrderDtoStubStatic,
  cost: updateOrderDtoStubStatic.filled
    .mul(updateOrderDtoStubStatic.price)
    .toDecimalPlaces(DECIMAL_ROUNDING),
  timestamp: updateOrderDtoStubStatic.datetime.getTime(),
});

export const orderStubs = [orderStubStatic, orderStubStatic2];
