import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DECIMAL_ROUNDING, getRandomAmount } from 'src/shared/utils/amounts';
import { PaginateDto } from 'src/shared/dto';
import { SEARCH_LIMIT } from 'src/shared/utils/search';
import { CreateOrderDto, UpdateOrderDto } from 'src/order/dto';
import { OrderService } from 'src/order/order.service';
import {
  createOrderDtoStubStatic,
  orderStubs,
  orderStubStatic,
  updateOrderDtoStubStatic,
  updateOrderStubStatic,
} from 'src/order/stubs';
import { PrismaService } from 'src/prisma/prisma.service';
import { userStubStatic } from 'src/user/stubs';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
// jest.mock('../../prisma/prisma.service.ts');

describe('OrderService', () => {
  const user = userStubStatic;
  let service: OrderService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrderService, PrismaService],
      imports: [ConfigModule.forRoot(), HttpModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

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

    beforeEach(() => {
      prisma.order.create.mockResolvedValue(orderStub as any);
    });

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
      it('call the prisma.order.create()', async () => {
        await service.createOrder(user.id, createOrderDtoStub);
        expect(prisma.order.create).toHaveBeenCalled();
        expect(prisma.order.create).toHaveBeenCalledWith({
          data: {
            ...createOrderDtoStub,
            userId: user.id,
          },
        });
      });

      it('should create a new order', () => {
        expect(
          service.createOrder(user.id, createOrderDtoStub),
        ).resolves.toEqual(orderStub);
      });
    });
  });

  describe.only('Update an order using its ID', () => {
    describe('_prepareUpdateOrderDto()', () => {
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

      it('update the dto "amount" fields when only the "amount" value changes', async () => {
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

      it('update the dto "amount" fields when only the "filled" value changes', async () => {
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

      it('update the dto "currency" fields when the "symbol" field changes', async () => {
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

      it('update the "timestamp" when the datetime field change', async () => {
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

      it('do not update the dto "amount" fields when NO new "filled" and price values are provided', async () => {
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

      it('do not update the "timestamp" fields when NO new "datetime" value is provided', async () => {
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
      const createdOrderStub = orderStubStatic;
      const updateOrderDtoStub: UpdateOrderDto = updateOrderDtoStubStatic;
      const updatedOrderStub = updateOrderStubStatic;
      let order;
      let updatedOrder;
      let getOrderByIdSpy;
      let prepareUpdateOrderDtoSpy;

      beforeEach(async () => {
        prisma.order.create.mockResolvedValue(createdOrderStub as any);
        prisma.order.update.mockResolvedValue(updatedOrderStub as any);

        getOrderByIdSpy = jest.spyOn(service, '_getOrderById');
        getOrderByIdSpy.mockResolvedValue(createdOrderStub);
        prepareUpdateOrderDtoSpy = jest.spyOn(
          service,
          '_prepareUpdateOrderDto',
        );
        prepareUpdateOrderDtoSpy.mockImplementation(() => updateOrderDtoStub);

        order = await service.createOrder(user.id, createOrderDtoStub);
      });

      afterEach(() => {
        getOrderByIdSpy.mockRestore();
        prepareUpdateOrderDtoSpy.mockRestore();
      });

      it('should call service._getOrderById()', async () => {
        updatedOrder = await service.updateOrderById(
          user.id,
          order.id,
          updateOrderDtoStub,
        );

        expect(service._getOrderById).toHaveBeenCalled;
        expect(service._getOrderById).toHaveBeenCalledWith(user.id, order.id);
      });

      it('should call service._prepareUpdateOrderDto()', async () => {
        updatedOrder = await service.updateOrderById(
          user.id,
          order.id,
          updateOrderDtoStub,
        );

        expect(service._prepareUpdateOrderDto).toHaveBeenCalled;
        expect(service._prepareUpdateOrderDto).toHaveBeenCalledWith(
          updateOrderDtoStub,
          order,
        );
      });

      it('should call prisma.order.update()', async () => {
        updatedOrder = await service.updateOrderById(
          user.id,
          order.id,
          updateOrderDtoStub,
        );

        expect(prisma.order.update).toHaveBeenCalled();
        expect(prisma.order.update).toHaveBeenCalledWith({
          where: { id: order.id, userId: user.id },
          data: updateOrderDtoStub,
        });
      });

      it('should update an order', async () => {
        expect(
          service.updateOrderById(user.id, order.id, updateOrderDtoStub),
        ).resolves.toEqual(updatedOrderStub);
      });
    });
  });

  describe('getOrders()', () => {
    beforeEach(async () => {
      prisma.order.findMany.mockResolvedValue(orderStubs as any);
      prisma.order.count.mockResolvedValue(orderStubs.length);
    });

    it('should call prisma.order.findMany()', async () => {
      await service.getOrders(user.id);

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
    });

    it('should call prisma.orders.count()', async () => {
      await service.getOrders(user.id);

      const prismaFn = prisma.order.count;
      expect(prismaFn).toHaveBeenCalled();
      expect(prismaFn).toHaveBeenCalledWith({
        where: {
          userId: user.id,
        },
      });
    });

    it('should return the first page of the orders of the user when no PaginateDto is provided', async () => {
      expect(service.getOrders(user.id)).resolves.toStrictEqual({
        data: orderStubs,
        count: orderStubs.length,
        hasMore: false,
      });
    });

    it('should return all orders of the user when their orders are less than the pagination limit', async () => {
      const paginateDto: PaginateDto = {
        limit: SEARCH_LIMIT,
        offset: 0,
      };
      expect(service.getOrders(user.id, paginateDto)).resolves.toStrictEqual({
        data: orderStubs,
        count: orderStubs.length,
        hasMore: false,
      });
    });

    it('should return the first orders of the user when their orders are more than the pagination limit', async () => {
      // Override the prisma.order.findMany() to return only the first order to test the pagination
      // with a single order per page
      prisma.order.findMany.mockResolvedValue(orderStubs.slice(0, 1) as any);
      const paginateDto: PaginateDto = {
        limit: 1,
        offset: 0,
      };

      expect(service.getOrders(user.id, paginateDto)).resolves.toStrictEqual({
        data: orderStubs.slice(0, 1),
        count: orderStubs.length,
        hasMore: true,
      });
    });
  });
});
