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

export const ccxtOrderStatic = {
  id: 'OP3C2A-PFHLH-Q5IAGH',
  fee: {
    cost: '0.16000',
    currency: 'EUR',
  },
  cost: 99.999450372,
  fees: [
    {
      cost: 0.16,
      currency: 'EUR',
    },
  ],
  info: {
    id: 'OP3C2A-PFHLH-Q5IAGH',
    fee: '0.16000',
    vol: '0.00210468',
    cost: '99.99966',
    misc: '',
    descr: {
      pair: 'XBTEUR',
      type: 'buy',
      close: '',
      order: 'buy 0.00210468 XBTEUR @ limit 47513.0',
      price: '47513.0',
      aclass: 'forex',
      price2: '0',
      leverage: 'none',
      ordertype: 'limit',
    },
    price: '47512.9',
    refid: null,
    oflags: 'fciq',
    opentm: '1708370795.703035',
    reason: null,
    status: 'closed',
    trades: ['TOZUQI-7Z4VG-7Y2WYL'],
    closetm: '1708443071.950905',
    starttm: '0',
    userref: '0',
    expiretm: '0',
    vol_exec: '0.00210468',
    stopprice: '0.00000',
    limitprice: '0.00000',
  },
  side: 'buy',
  type: 'limit',
  price: 47513,
  amount: 0.00210468,
  filled: 0.00210468,
  status: 'closed',
  symbol: 'BTC/EUR',
  trades: [
    {
      id: 'TOZUQI-7Z4VG-7Y2WYL',
      fee: {},
      fees: [],
      info: {},
      symbol: 'BTC/EUR',
      orderId: 'OP3C2A-PFHLH-Q5IAGH',
    },
  ],
  average: 47512.9,
  datetime: '2024-02-19T19:26:35.703Z',
  postOnly: false,
  remaining: 0,
  timestamp: 1708370795703,
  clientOrderId: '0',
};
