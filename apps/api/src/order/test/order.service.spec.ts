import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PaginateDto } from '@/shared/dto';
import { SEARCH_LIMIT } from '@/shared/utils/search';
import { CreateOrderDto, UpdateOrderDto, OrderDtoMappers } from '@/order/dto';
import { OrderService } from '@/order/order.service';
import {
  createOrderDtoStubStatic,
  orderStubs,
  orderStubStatic,
  updateOrderDtoStubStatic,
  updateOrderStubStatic,
  userId,
} from '@/order/stubs';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('OrderService', () => {
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

    describe('createOrder()', () => {
      it('call the prisma.order.create()', async () => {
        await service.createOrder(userId, createOrderDtoStub);
        expect(prisma.order.create).toHaveBeenCalled();
        expect(prisma.order.create).toHaveBeenCalledWith({
          data: OrderDtoMappers.toCreateOrderDbDto(userId, createOrderDtoStub),
        });
      });

      it('should create a new order', () => {
        expect(
          service.createOrder(userId, createOrderDtoStub),
        ).resolves.toEqual(orderStub);
      });
    });
  });

  describe('Update an order using its ID', () => {
    describe('updateOrderById()', () => {
      // Use the static stubs used for auto mocking the prisma service
      const createOrderDtoStub: CreateOrderDto = createOrderDtoStubStatic;
      const createdOrderStub = orderStubStatic;
      const updateOrderDtoStub: UpdateOrderDto = updateOrderDtoStubStatic;
      const updatedOrderStub = updateOrderStubStatic;
      let order;
      let updatedOrder;
      let getOrderByIdSpy;
      let toUpdateOrderDbDtoSpy;

      beforeEach(async () => {
        prisma.order.create.mockResolvedValue(createdOrderStub as any);
        prisma.order.update.mockResolvedValue(updatedOrderStub as any);

        getOrderByIdSpy = jest.spyOn(service, '_getOrderById');
        getOrderByIdSpy.mockResolvedValue(createdOrderStub);

        toUpdateOrderDbDtoSpy = jest.spyOn(
          OrderDtoMappers,
          'toUpdateOrderDbDto',
        );
        toUpdateOrderDbDtoSpy.mockImplementation(() => updateOrderDtoStub);

        order = await service.createOrder(userId, createOrderDtoStub);
      });

      afterEach(() => {
        getOrderByIdSpy.mockRestore();
        toUpdateOrderDbDtoSpy.mockRestore();
      });

      it('should call service._getOrderById()', async () => {
        updatedOrder = await service.updateOrderById(
          userId,
          order.id,
          updateOrderDtoStub,
        );

        expect(service._getOrderById).toHaveBeenCalled;
        expect(service._getOrderById).toHaveBeenCalledWith(userId, order.id);
      });

      it('should call toUpdateOrderDbDto()', async () => {
        updatedOrder = await service.updateOrderById(
          userId,
          order.id,
          updateOrderDtoStub,
        );

        expect(OrderDtoMappers.toUpdateOrderDbDto).toHaveBeenCalled();
        expect(OrderDtoMappers.toUpdateOrderDbDto).toHaveBeenCalledWith(
          updateOrderDtoStub,
          order,
        );
      });

      it('should call prisma.order.update()', async () => {
        updatedOrder = await service.updateOrderById(
          userId,
          order.id,
          updateOrderDtoStub,
        );

        expect(prisma.order.update).toHaveBeenCalled();
        expect(prisma.order.update).toHaveBeenCalledWith({
          where: { id: order.id, userId: userId },
          data: updateOrderDtoStub,
        });
      });

      it('should update an order', async () => {
        expect(
          service.updateOrderById(userId, order.id, updateOrderDtoStub),
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
      await service.getOrders(userId);

      const prismaFn = prisma.order.findMany;
      expect(prismaFn).toHaveBeenCalled();
      expect(prismaFn).toHaveBeenCalledWith({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: SEARCH_LIMIT,
        skip: 0,
      });
    });

    it('should call prisma.orders.count()', async () => {
      await service.getOrders(userId);

      const prismaFn = prisma.order.count;
      expect(prismaFn).toHaveBeenCalled();
      expect(prismaFn).toHaveBeenCalledWith({
        where: {
          userId: userId,
        },
      });
    });

    it('should return the first page of the orders of the user when no PaginateDto is provided', async () => {
      expect(service.getOrders(userId)).resolves.toStrictEqual({
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
      expect(service.getOrders(userId, paginateDto)).resolves.toStrictEqual({
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

      expect(service.getOrders(userId, paginateDto)).resolves.toStrictEqual({
        data: orderStubs.slice(0, 1),
        count: orderStubs.length,
        hasMore: true,
      });
    });
  });
});
