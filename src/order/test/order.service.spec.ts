import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DECIMAL_ROUNDING, Decimal } from 'src/common/amounts';
import { PaginateDto, PaginateResultDto } from 'src/common/dto';
import {
  SEARCH_LIMIT,
  preparePaginateResultDto,
} from 'src/common/search-utils';
import { CreateOrderDto } from 'src/order/dto';
import { OrderService } from 'src/order/order.service';
import {
  createOrderDtoStubStatic,
  orderStubStatic,
  updateOrderDtoStubStatic,
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

  describe('_prepareOrderAmounts()', () => {
    let inputFilled;
    let inputPrice;
    beforeAll(() => {
      inputFilled = new Decimal(Math.random() * 100);
      inputPrice = new Decimal(Math.random() * 100);
    });

    it('should return all order amounts', () => {
      const orderAmounts = service._prepareOrderAmounts(
        inputFilled,
        inputPrice,
      );
      expect(Object.keys(orderAmounts)).toEqual(['filled', 'price', 'cost']);
    });

    it('should work when the filled amount and price are numbers', () => {
      const { filled, price, cost } = service._prepareOrderAmounts(
        inputFilled.toNumber(),
        inputPrice.toNumber(),
      );
      const expectedCost = filled.mul(price).toDecimalPlaces(DECIMAL_ROUNDING);

      expect(filled.toNumber()).toEqual(inputFilled.toNumber());
      expect(price.toNumber()).toEqual(inputPrice.toNumber());
      expect(cost.toNumber()).toEqual(expectedCost.toNumber());
    });

    it('should work when the filled amount and price are strings', () => {
      const { filled, price, cost } = service._prepareOrderAmounts(
        inputFilled.toString(),
        inputPrice.toString(),
      );
      const expectedCost = filled.mul(price).toDecimalPlaces(DECIMAL_ROUNDING);

      expect(filled.toNumber()).toEqual(inputFilled.toNumber());
      expect(price.toNumber()).toEqual(inputPrice.toNumber());
      expect(cost.toNumber()).toEqual(expectedCost.toNumber());
    });

    it('should work when the filled amount and price are Decimals', () => {
      const { filled, price, cost } = service._prepareOrderAmounts(
        inputFilled,
        inputPrice,
      );
      const expectedCost = filled.mul(price).toDecimalPlaces(DECIMAL_ROUNDING);

      expect(filled.toNumber()).toEqual(inputFilled.toNumber());
      expect(price.toNumber()).toEqual(inputPrice.toNumber());
      expect(cost.toNumber()).toEqual(expectedCost.toNumber());
    });
  });

  describe('createOrder()', () => {
    // Use the static stubs used for auto mocking the prisma service
    const createOrderDto: CreateOrderDto = createOrderDtoStubStatic;
    const orderStub = orderStubStatic;
    let order;

    beforeAll(async () => {
      order = await service.createOrder(user.id, createOrderDto);
    });

    it('should call prisma.order.create()', () => {
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

  describe('_updateOrderDto()', () => {
    // Use the static stubs used for auto mocking the prisma service
    const updateOrderDto = updateOrderDtoStubStatic;
    let updatedOrderData;

    it('update the dto amount fields when the filled, price and datetime fields change', async () => {
      updatedOrderData = await service._updateOrderDto(updateOrderDto);

      expect(updatedOrderData.price).toEqual(updateOrderDto.price);
      expect(updatedOrderData.filled).toEqual(updateOrderDto.filled);
      expect(updatedOrderData.cost).toEqual(
        updateOrderDto.price
          .mul(updateOrderDto.filled)
          .toDecimalPlaces(DECIMAL_ROUNDING),
      );
      expect(updatedOrderData.timestamp).toEqual(
        updateOrderDto.datetime.getTime(),
      );
    });

    it('not update the dto amount fields when no new filled and price values are provided', async () => {
      delete updatedOrderData.filled;
      delete updatedOrderData.price;
      delete updatedOrderData.cost;
      updatedOrderData = await service._updateOrderDto(updateOrderDto);

      expect(updatedOrderData.price).toBeUndefined;
      expect(updatedOrderData.filled).toBeUndefined;
      expect(updatedOrderData.cost).toBeUndefined;
    });

    it('not update the timestamp fields whe no new datetime value is provided', async () => {
      delete updatedOrderData.datetime;
      updatedOrderData = await service._updateOrderDto(updateOrderDto);

      expect(updatedOrderData.datetime).toBeUndefined;
      expect(updatedOrderData.timestamp).toBeUndefined;
    });
  });

  describe('updateOrderById()', () => {
    // Use the static stubs used for auto mocking the prisma service
    const createOrderDto: CreateOrderDto = createOrderDtoStubStatic;
    const orderStub = orderStubStatic;
    let order;

    beforeAll(async () => {
      order = await service.createOrder(user.id, createOrderDto);
    });

    it('should call prisma.order.create()', () => {
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
