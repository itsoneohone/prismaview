import { DECIMAL_ROUNDING, getRandomAmount } from '@/shared/utils/amounts';
import { toCreateOrderDbDto, toUpdateOrderDbDto } from '@/order/dto';
import {
  createOrderDtoStubStatic,
  orderStubStatic,
  updateOrderDtoStubStatic,
  updateOrderStubStatic,
  userId,
} from '@/order/stubs';

describe('toCreateOrderDbDto', () => {
  it('should convert a CreateOrderDto to CreateOrderDbDto', () => {
    const orderStub = orderStubStatic;
    const createOrderDbDto = toCreateOrderDbDto(
      userId,
      createOrderDtoStubStatic,
    );

    expect(createOrderDbDto.filled).toEqual(orderStub.filled);
    expect(createOrderDbDto.price).toEqual(orderStub.price);
    expect(createOrderDbDto.cost).toEqual(orderStub.cost);
    expect(createOrderDbDto.symbol).toEqual(orderStub.symbol);
    expect(createOrderDbDto.base).toEqual(orderStub.base);
    expect(createOrderDbDto.quote).toEqual(orderStub.quote);
    expect(createOrderDbDto.datetime).toEqual(orderStub.datetime);
    expect(createOrderDbDto.timestamp).toEqual(orderStub.timestamp);
  });
});

describe('toUpdateOrderDbDto', () => {
  let updateOrderDto;
  let updateOrder;
  let updatedOrderData;
  let initialFilled;
  let initialPrice;
  let initialCost;

  beforeEach(() => {
    // Use the static stubs used for auto mocking the prisma service
    updateOrderDto = updateOrderDtoStubStatic;
    updateOrder = updateOrderStubStatic;
    initialFilled = updateOrderDto.filled;
    initialPrice = updateOrderDto.price;
    initialCost = updateOrderDto.cost;
  });

  afterEach(() => {
    // Restore the initial amount values
    updateOrderDto.price = initialPrice;
    updateOrderDto.filled = initialFilled;
  });

  it('update the dto "amount" fields when the "filled" and "price" fields change', async () => {
    updateOrderDto.filled = getRandomAmount(100);
    updateOrderDto.price = getRandomAmount(100);
    updatedOrderData = toUpdateOrderDbDto(updateOrderDto, updateOrder);

    expect(updatedOrderData.price).not.toEqual(initialPrice);
    expect(updatedOrderData.filled).not.toEqual(initialFilled);
    expect(updatedOrderData.cost).not.toEqual(initialCost);
    expect(updatedOrderData.price).toEqual(updateOrderDto.price);
    expect(updatedOrderData.filled).toEqual(updateOrderDto.filled);
    expect(updatedOrderData.cost).toEqual(
      updateOrderDto.price
        .mul(updateOrderDto.filled)
        .toDecimalPlaces(DECIMAL_ROUNDING),
    );
  });

  it('update the dto "amount" fields when only the "amount" value changes', async () => {
    delete updateOrderDto.filled;
    updateOrderDto.price = getRandomAmount(100);
    updatedOrderData = toUpdateOrderDbDto(updateOrderDto, updateOrder);

    expect(updatedOrderData.price).not.toEqual(initialPrice);
    expect(updatedOrderData.cost).not.toEqual(initialCost);
    // The filled field was not updated
    expect(updatedOrderData.filled).toEqual(initialFilled);
    expect(updatedOrderData.filled).toEqual(updateOrder.filled);
    expect(updatedOrderData.price).toEqual(updateOrderDto.price);
    expect(updatedOrderData.cost).toEqual(
      updateOrderDto.price
        .mul(updateOrder.filled)
        .toDecimalPlaces(DECIMAL_ROUNDING),
    );
  });

  it('update the dto "amount" fields when only the "filled" value changes', async () => {
    delete updateOrderDto.price;
    updateOrderDto.filled = getRandomAmount(100);
    updatedOrderData = toUpdateOrderDbDto(updateOrderDto, updateOrder);

    expect(updatedOrderData.filled).not.toEqual(initialFilled);
    expect(updatedOrderData.cost).not.toEqual(initialCost);
    // The price value was not updated
    expect(updatedOrderData.price).toEqual(initialPrice);
    expect(updatedOrderData.price).toEqual(updateOrder.price);
    expect(updatedOrderData.filled).toEqual(updateOrderDto.filled);
    expect(updatedOrderData.cost).toEqual(
      updateOrder.price
        .mul(updateOrderDto.filled)
        .toDecimalPlaces(DECIMAL_ROUNDING),
    );
  });

  it('update the dto "currency" fields when the "symbol" field changes', async () => {
    const initialSymbol = updateOrderDto.symbol;
    const newBase = 'ETH';
    const newQuote = 'EUR';
    const newSymbol = [newBase, newQuote].join('/');

    updateOrderDto.symbol = newSymbol;
    updatedOrderData = toUpdateOrderDbDto(updateOrderDto, updateOrder);

    expect(updatedOrderData.symbol).not.toEqual(initialSymbol);
    expect(updatedOrderData.symbol).toEqual(newSymbol);
    expect(updatedOrderData.base).toEqual(newBase);
    expect(updatedOrderData.quote).toEqual(newQuote);
    expect(updatedOrderData.currency).toEqual(newQuote);
  });

  it('update the "timestamp" when the datetime field change', async () => {
    const initialDatetime = updateOrderDto.datetime;
    const initialTimestamp = updateOrderDto.timestamp;
    const newDatetime = new Date();

    updateOrderDto.datetime = newDatetime;
    updatedOrderData = toUpdateOrderDbDto(updateOrderDto, updateOrder);

    expect(updatedOrderData.datetime).not.toEqual(initialDatetime);
    expect(updatedOrderData.timestamp).not.toEqual(initialTimestamp);
    expect(updatedOrderData.datetime.toISOString()).toEqual(
      newDatetime.toISOString(),
    );
    // The timestamp is stored as BigInt
    expect(updatedOrderData.timestamp.toString()).toEqual(
      newDatetime.getTime().toString(),
    );
  });

  it('do not update the dto "amount" fields when NO new "filled" and price values are provided', async () => {
    delete updateOrderDto.filled;
    delete updateOrderDto.price;
    updatedOrderData = toUpdateOrderDbDto(updateOrderDto, updateOrder);

    expect(updatedOrderData.price).toBeUndefined;
    expect(updatedOrderData.filled).toBeUndefined;
    expect(updatedOrderData.cost).toBeUndefined;
  });

  it('do not update the "timestamp" fields when NO new "datetime" value is provided', async () => {
    delete updateOrderDto.datetime;
    updatedOrderData = toUpdateOrderDbDto(updateOrderDto, updateOrder);

    expect(updatedOrderData.datetime).toBeUndefined;
    expect(updatedOrderData.timestamp).toBeUndefined;
  });
});
