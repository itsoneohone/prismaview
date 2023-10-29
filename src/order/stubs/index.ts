import { faker } from '@faker-js/faker';
import {
  OrderCurrency,
  OrderSide,
  OrderStatus,
  OrderType,
} from '@prisma/client';
import { CreateOrderDto } from 'src/order/dto';
import { getRandomAmount } from 'src/common/amounts';

export const CreateOrderDtoStub = (): CreateOrderDto => {
  const date = new Date();
  const price = getRandomAmount(100);
  // actual order amount filled
  const filled = getRandomAmount(10);
  // filled * price
  const cost = price.mul(filled).toDecimalPlaces(8);
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
