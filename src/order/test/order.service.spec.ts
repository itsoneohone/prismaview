import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { after, before } from 'node:test';
import { DECIMAL_ROUNDING, getRandomAmount } from 'src/common/amounts';
import { PaginateDto, PaginateResultDto } from 'src/common/dto';
import {
  SEARCH_LIMIT,
  preparePaginateResultDto,
} from 'src/common/search-utils';
import { CreateOrderDto, UpdateOrderDto } from 'src/order/dto';
import { OrderService } from 'src/order/order.service';
import {
  createOrderDtoStubStatic,
  orderStubStatic,
  updateOrderDtoStubStatic,
  updateOrderStubStatic,
} from 'src/order/stubs';
import { PrismaService } from 'src/prisma/prisma.service';
import { userStubStatic } from 'src/user/stubs';

jest.mock('../../prisma/prisma.service.ts');

describe('OrderService', () => {
  const user = userStubStatic;
  let service: OrderService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [OrderService, PrismaService],
      imports: [ConfigModule.forRoot(), HttpModule],
    }).compile();

    service = module.get(OrderService);
    prisma = module.get(PrismaService);
  });

  it('bootstrap', () => {
    expect(service).toBeDefined();
  });

  describe('Create new order', () => {
    // Use the static stubs used for auto mocking the prisma service
    const createOrderDtoStub: CreateOrderDto = createOrderDtoStubStatic;
    const orderStub = orderStubStatic;

    describe('_prepareCreateOrderDto', () => {
      it('should set the amount and currency fields', () => {
        const createOrderDto =
          service._prepareCreateOrderDto(createOrderDtoStub);

        expect(createOrderDto.filled).toEqual(orderStub.filled);
        expect(createOrderDto.price).toEqual(orderStub.price);
        expect(createOrderDto.cost).toEqual(orderStub.cost);
        expect(createOrderDto.symbol).toEqual(orderStub.symbol);
        expect(createOrderDto.base).toEqual(orderStub.base);
        expect(createOrderDto.quote).toEqual(orderStub.quote);
        expect(createOrderDto.datetime).toEqual(orderStub.datetime);
        expect(createOrderDto.timestamp).toEqual(orderStub.timestamp);
      });
    });

    describe('createOrder()', () => {
      let order;

      beforeAll(async () => {
        order = await service.createOrder(user.id, createOrderDtoStub);
      });

      it('should call prisma.order.create()', () => {
        // Set the amount and currency related fields
        const createOrderDto =
          service._prepareCreateOrderDto(createOrderDtoStub);

        expect(prisma.order.create).toHaveBeenCalled();
        expect(prisma.order.create).toHaveBeenCalledWith({
          data: {
            ...createOrderDto,
            userId: user.id,
          },
        });
        expect(prisma.order.create).toHaveReturnedWith(orderStub);
      });

      it('should create an order', () => {
        expect(order).toMatchObject(orderStub);
      });
    });
  });

  describe('Update an order using its ID', () => {
    describe('_prepareUpdateOrderDto()', () => {
      let updateOrderDto;
      let updateOrder;
      let updatedOrderData;
      let initialFilled;
      let initialPrice;
      let initialCost;
      let initialDatetime;
      let initialTimestamp;

      beforeAll(() => {
        // Use the static stubs used for auto mocking the prisma service
        updateOrderDto = updateOrderDtoStubStatic;
        updateOrder = updateOrderStubStatic;
        initialFilled = updateOrderDto.filled;
        initialPrice = updateOrderDto.price;
        initialCost = updateOrderDto.cost;
        initialDatetime = updateOrderDto.datetime;
        initialTimestamp = updateOrderDto.timestamp;
      });

      afterEach(() => {
        // Restore the initial amount values
        updateOrderDto.price = initialPrice;
        updateOrderDto.filled = initialFilled;
      });

      it('update the dto amount fields when the filled and price fields change', async () => {
        updateOrderDto.filled = getRandomAmount(100);
        updateOrderDto.price = getRandomAmount(100);
        updatedOrderData = await service._prepareUpdateOrderDto(
          updateOrderDto,
          updateOrder,
        );

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

      it('update the dto amount fields when only the filled value changes', async () => {
        delete updateOrderDto.filled;
        updateOrderDto.price = getRandomAmount(100);
        updatedOrderData = await service._prepareUpdateOrderDto(
          updateOrderDto,
          updateOrder,
        );

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

      it('update the dto amount fields when only the price value changes', async () => {
        delete updateOrderDto.price;
        updateOrderDto.filled = getRandomAmount(100);
        updatedOrderData = await service._prepareUpdateOrderDto(
          updateOrderDto,
          updateOrder,
        );

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

      it('update the dto currency fields when the symbol field changes', async () => {
        const initialSymbol = updateOrderDto.symbol;
        const newBase = 'ETH';
        const newQuote = 'EUR';
        const newSymbol = [newBase, newQuote].join('/');

        updateOrderDto.symbol = newSymbol;
        updatedOrderData = await service._prepareUpdateOrderDto(
          updateOrderDto,
          updateOrder,
        );

        expect(updatedOrderData.symbol).not.toEqual(initialSymbol);
        expect(updatedOrderData.symbol).toEqual(newSymbol);
        expect(updatedOrderData.base).toEqual(newBase);
        expect(updatedOrderData.quote).toEqual(newQuote);
        expect(updatedOrderData.currency).toEqual(newQuote);
      });

      it('update the timestamp when the datetime field change', async () => {
        const initialDatetime = updateOrderDto.datetime;
        const initialTimestamp = updateOrderDto.timestamp;
        const newDatetime = new Date();

        updateOrderDto.datetime = newDatetime;
        updatedOrderData = await service._prepareUpdateOrderDto(
          updateOrderDto,
          updateOrder,
        );

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

      it('do not update the dto amount fields when no new filled and price values are provided', async () => {
        delete updateOrderDto.filled;
        delete updateOrderDto.price;
        updatedOrderData = await service._prepareUpdateOrderDto(
          updateOrderDto,
          updateOrder,
        );

        expect(updatedOrderData.price).toBeUndefined;
        expect(updatedOrderData.filled).toBeUndefined;
        expect(updatedOrderData.cost).toBeUndefined;
      });

      it('do not update the timestamp fields when no new datetime value is provided', async () => {
        delete updateOrderDto.datetime;
        updatedOrderData = await service._prepareUpdateOrderDto(
          updateOrderDto,
          updateOrder,
        );

        expect(updatedOrderData.datetime).toBeUndefined;
        expect(updatedOrderData.timestamp).toBeUndefined;
      });
    });

    describe('updateOrderById()', () => {
      // Use the static stubs used for auto mocking the prisma service
      const createOrderDtoStub: CreateOrderDto = createOrderDtoStubStatic;
      const updateOrderDtoStub: UpdateOrderDto = updateOrderDtoStubStatic;
      const updatedOrderStub = updateOrderStubStatic;
      let order;
      let updatedOrder;
      let getOrderByIdSpy;
      let prepareUpdateOrderDtoSpy;
      beforeAll(async () => {
        getOrderByIdSpy = jest.spyOn(service, '_getOrderById');
        getOrderByIdSpy.mockImplementation(() => order);

        prepareUpdateOrderDtoSpy = jest.spyOn(
          service,
          '_prepareUpdateOrderDto',
        );
        prepareUpdateOrderDtoSpy.mockImplementation(() => updateOrderDtoStub);

        order = await service.createOrder(user.id, createOrderDtoStub);
        updatedOrder = await service.updateOrderById(
          user.id,
          order.id,
          updateOrderDtoStub,
        );
      });

      afterAll(() => {
        // Restore the original implementation
        getOrderByIdSpy.mockRestore();
        prepareUpdateOrderDtoSpy.mockRestore();
      });

      it('_getOrderById() and _prepareUpdateOrderDto() should be called', () => {
        expect(service._getOrderById).toHaveBeenCalled;
        expect(service._getOrderById).toHaveBeenCalledWith(user.id, order.id);
        expect(service._getOrderById).toHaveReturnedWith(order);
        expect(service._prepareUpdateOrderDto).toHaveBeenCalled;
        expect(service._prepareUpdateOrderDto).toHaveBeenCalledWith(
          updateOrderDtoStub,
          order,
        );
      });

      it('should update an order', () => {
        expect(updatedOrder).toMatchObject(updatedOrderStub);
      });
    });
  });

  describe('getOrders()', () => {
    let ordersRes: PaginateResultDto;
    let orders;
    let expectedOrdersRes: PaginateResultDto;

    describe('when called without a PaginateDto', () => {
      const paginateDto: PaginateDto = {
        limit: SEARCH_LIMIT,
        offset: 0,
      };

      beforeAll(async () => {
        ordersRes = await service.getOrders(user.id);
        orders = ordersRes.data;
        // Fn getApiKeys is expected to return the following result
        expectedOrdersRes = preparePaginateResultDto(
          orders,
          orders.length,
          paginateDto,
        );
      });

      it('should call prisma.order.findMany()', () => {
        const prismaFn = prisma.order.findMany;
        expect(prismaFn).toHaveBeenCalled();
        expect(prismaFn).toHaveBeenCalledWith({
          where: {
            userId: user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: SEARCH_LIMIT,
          skip: 0,
        });
        expect(prismaFn).toHaveReturnedWith(orders);
      });

      it('should call prisma.orders.count()', () => {
        const prismaFn = prisma.order.count;
        expect(prismaFn).toHaveBeenCalled();
        expect(prismaFn).toHaveBeenCalledWith({
          where: {
            userId: user.id,
          },
        });
        expect(prismaFn).toHaveReturnedWith(orders.length);
      });

      it('should return the orders of the user', () => {
        expect(ordersRes.data).toMatchObject(orders);
        expect(ordersRes.count).toEqual(orders.length);
        expect(ordersRes.hasMore).toEqual(false);
      });
    });

    describe('when called with a PaginateDto', () => {
      const paginateDto: PaginateDto = {
        limit: SEARCH_LIMIT,
        offset: 0,
      };

      beforeAll(async () => {
        ordersRes = await service.getOrders(user.id, paginateDto);
        orders = ordersRes.data;
        // Fn getApiKeys is expected to return the following result
        expectedOrdersRes = preparePaginateResultDto(
          orders,
          orders.length,
          paginateDto,
        );
      });

      it('should call prisma.orders.findMany()', () => {
        const prismaFn = prisma.order.findMany;
        expect(prismaFn).toHaveBeenCalled();
        expect(prismaFn).toHaveBeenCalledWith({
          where: {
            userId: user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: paginateDto.limit,
          skip: paginateDto.offset,
        });
        expect(prismaFn).toHaveReturnedWith(orders);
      });

      it('should call prisma.order.count()', () => {
        const prismaFn = prisma.order.count;
        expect(prismaFn).toHaveBeenCalled();
        expect(prismaFn).toHaveBeenCalledWith({
          where: {
            userId: user.id,
          },
        });
        expect(prismaFn).toHaveReturnedWith(orders.length);
      });

      it('should return the Api keys of the user', () => {
        expect(ordersRes.data).toMatchObject(orders);
        expect(ordersRes.count).toEqual(orders.length);
        expect(ordersRes.hasMore).toEqual(false);
      });
    });
  });
});
