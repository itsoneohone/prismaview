import { faker } from '@faker-js/faker';
import {
  OrderCreatedByEnum,
  OrderSideEnum,
  OrderStatusEnum,
  OrderTypeEnum,
} from '@prisma/client';
import { CreateOrderDto, UpdateOrderDto } from 'src/order/dto';
import { DECIMAL_ROUNDING, getRandomAmount } from 'src/common/amounts';
import { userStubStatic } from 'src/user/stubs';
import {
  getSymbolCurrencies,
  calculateOrderAmounts,
} from 'src/order/common/utils';

export const CreateOrderDtoStub = (): CreateOrderDto => {
  const date = new Date();
  const price = getRandomAmount(100);
  // actual order amount filled
  const filled = getRandomAmount(10);
  // filled * price
  const cost = price.mul(filled).toDecimalPlaces(DECIMAL_ROUNDING);
  const fee = getRandomAmount(1);

  const symbol = 'BTC/USD';

  return {
    orderId: faker.string.uuid(),
    timestamp: BigInt(date.getTime()),
    datetime: date,
    status: OrderStatusEnum.CLOSED,
    symbol,
    type: OrderTypeEnum.MARKET,
    side: OrderSideEnum.BUY,
    price,
    filled,
    cost,
    fee,
    accessKeyId: null,
    userId: null,
    rawData: null,
    // The following 3 fields should be calculated based on the symbol, when an order is created
    base: null,
    quote: null,
    currency: null,
  };
};
export const createOrderDtoStubStatic = CreateOrderDtoStub();
export const createOrderDtoStubStatic2 = CreateOrderDtoStub();

const date = new Date();
export const OrderStub = (
  userId: number,
  dto: CreateOrderDto | UpdateOrderDto,
) => {
  const { filled, price, cost } = calculateOrderAmounts(dto.filled, dto.price);
  const { base, quote, currency } = getSymbolCurrencies(dto.symbol);
  return {
    ...dto,
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
const _user = userStubStatic;
export const orderStubStatic = OrderStub(_user.id, createOrderDtoStubStatic);
export const orderStubStatic2 = OrderStub(_user.id, createOrderDtoStubStatic2);

export const updateOrderDtoStubStatic: UpdateOrderDto = {
  ...createOrderDtoStubStatic,
  filled: getRandomAmount(100),
  price: getRandomAmount(100),
  datetime: new Date(date.setMonth(date.getMonth() - 1)),
};
export const updateOrderStubStatic = OrderStub(
  _user.id,
  updateOrderDtoStubStatic,
);

export const orderStubs = [orderStubStatic, orderStubStatic2];
