import { DECIMAL_ROUNDING, getRandomAmount } from '@shared/utils/amounts';
import {
  ccxtToCreateOrderDbDto,
  toCreateOrderDbDto,
  toUpdateOrderDbDto,
} from '@order/dto';
import {
  createOrderDtoStubStatic,
  ccxtOrderStatic,
  orderStubStatic,
  updateOrderDtoStubStatic,
  updateOrderStubStatic,
  userId,
} from '@order/stubs';
import {
  OrderCreatedByEnum,
  OrderSideEnum,
  OrderStatusEnum,
  OrderTypeEnum,
} from '@prisma/client';

describe('toCreateOrderDbDto', () => {
  it('should convert a CreateOrderDto to CreateOrderDbDto', () => {
    const createOrderDtoFields = [
      'base',
      'quote',
      'currency',
      'cost',
      'accessKeyId',
      'userId',
      'rawData',
      'createdBy',
      'orderId',
      'timestamp',
      'datetime',
      'status',
      'symbol',
      'type',
      'side',
      'price',
      'filled',
      'fee',
    ];
    const orderStub = orderStubStatic;
    const createOrderDbDto = toCreateOrderDbDto(
      userId,
      createOrderDtoStubStatic,
    );

    expect(Object.keys(createOrderDbDto)).toEqual(
      expect.arrayContaining(createOrderDtoFields),
    );
    expect(createOrderDbDto.filled).toEqual(orderStub.filled);
    expect(createOrderDbDto.price).toEqual(orderStub.price);
    expect(createOrderDbDto.cost).toEqual(orderStub.cost);
    expect(createOrderDbDto.symbol).toEqual(orderStub.symbol);
    expect(createOrderDbDto.base).toEqual(orderStub.base);
    expect(createOrderDbDto.quote).toEqual(orderStub.quote);
    expect(createOrderDbDto.datetime).toEqual(orderStub.datetime);
    expect(createOrderDbDto.timestamp).toEqual(orderStub.timestamp);
    expect(createOrderDbDto.createdBy).toEqual(OrderCreatedByEnum.USER);
    expect(Object.values(OrderStatusEnum)).toContain(createOrderDbDto.status);
    expect(createOrderDbDto.status).toEqual(OrderStatusEnum.CLOSED);
    expect(Object.values(OrderTypeEnum)).toContain(OrderTypeEnum.MARKET);
    expect(createOrderDbDto.type).toEqual(OrderTypeEnum.MARKET);
    expect(Object.values(OrderSideEnum)).toContain(OrderSideEnum.BUY);
    expect(createOrderDbDto.side).toEqual(OrderSideEnum.BUY);
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

    expect(updatedOrderData.price).toBeUndefined();
    expect(updatedOrderData.filled).toBeUndefined();
    expect(updatedOrderData.cost).toBeUndefined();
  });

  it('do not update the "timestamp" fields when NO new "datetime" value is provided', async () => {
    delete updateOrderDto.datetime;
    delete updateOrderDto.timestamp;
    updatedOrderData = toUpdateOrderDbDto(updateOrderDto, updateOrder);

    expect(updatedOrderData.datetime).toBeUndefined();
    expect(updatedOrderData.timestamp).toBeUndefined();
  });
});

describe('ccxtToCreateOrderDbDto', () => {
  it('should prepare an Order dto using a ccxt order', () => {
    const ccxtOrderFields = [
      'orderId',
      'timestamp',
      'datetime',
      'status',
      'symbol',
      'base',
      'quote',
      'currency',
      'type',
      'side',
      'price',
      'filled',
      'cost',
      'fee',
      'accessKeyId',
      'userId',
      'createdBy',
      'rawData',
    ];
    const accessKeyId = 1;
    const ccxtOrder = ccxtOrderStatic;
    const createOrderDbDto = ccxtToCreateOrderDbDto(
      userId,
      accessKeyId,
      ccxtOrder,
    );
    const [base, quote] = ccxtOrder.symbol.split('/');
    const currency = quote;

    expect(Object.keys(createOrderDbDto)).toEqual(
      expect.arrayContaining(ccxtOrderFields),
    );
    expect(createOrderDbDto.accessKeyId).toEqual(accessKeyId);
    expect(createOrderDbDto.userId).toEqual(userId);
    expect(createOrderDbDto.orderId).toEqual(ccxtOrder.id);
    expect(Object.values(OrderStatusEnum)).toContain(createOrderDbDto.status);
    expect(createOrderDbDto.status).toEqual(OrderStatusEnum.CLOSED);
    expect(Object.values(OrderTypeEnum)).toContain(createOrderDbDto.type);
    expect(createOrderDbDto.type).toEqual(OrderTypeEnum.LIMIT);
    expect(Object.values(OrderSideEnum)).toContain(createOrderDbDto.side);
    expect(createOrderDbDto.side).toEqual(OrderSideEnum.BUY);
    expect(createOrderDbDto.filled).toEqual(ccxtOrder.filled);
    expect(createOrderDbDto.price).toEqual(ccxtOrder.price);
    expect(createOrderDbDto.cost).toEqual(ccxtOrder.cost);
    expect(createOrderDbDto.fee).toEqual(ccxtOrder.fee.cost);
    expect(createOrderDbDto.symbol).toEqual(ccxtOrder.symbol);
    expect(createOrderDbDto.base).toEqual(base);
    expect(createOrderDbDto.quote).toEqual(quote);
    expect(createOrderDbDto.currency).toEqual(currency);
    expect(createOrderDbDto.datetime).toEqual(ccxtOrder.datetime);
    expect(createOrderDbDto.timestamp).toEqual(ccxtOrder.timestamp);
    expect(createOrderDbDto.createdBy).toEqual(OrderCreatedByEnum.SCRIPT);
    expect(createOrderDbDto.rawData).toEqual(ccxtOrder);
  });
});
