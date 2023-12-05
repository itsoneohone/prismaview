import * as pactum from 'pactum';
import { faker } from '@faker-js/faker';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { RedisClientType } from 'redis';
import { HttpStatus } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import { AuthDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from 'src/expense/dto';
import { appMetadata } from 'src/app.module';
import { APP_PORT, setupPipes } from 'src/app-config/app-config';
import { CreateAccessKeyDtoStub } from 'src/access-key/stubs';
import { CreateOrderDtoStub } from 'src/order/stubs';
import { DECIMAL_ROUNDING, getRandomAmount } from 'src/common/amounts';
import { AccessKeyService } from 'src/access-key/access-key.service';
import { access } from 'fs';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessKeyService: AccessKeyService;

  beforeAll(async () => {
    const module = await Test.createTestingModule(appMetadata).compile();
    app = module.createNestApplication();

    prisma = app.get(PrismaService);
    accessKeyService = app.get(AccessKeyService);

    // Set up pipes
    setupPipes(app);

    // Setup decimal precision
    Prisma.Decimal.set({ rounding: 8 });

    await app.init();
    await app.listen(APP_PORT);
    await prisma.cleanDB();

    pactum.request.setBaseUrl(`http://localhost:${APP_PORT}`);
  });

  afterAll(async () => {
    // Manually close the redis connection so that it doesn't hang
    const cache = app.get(CACHE_MANAGER);
    const cacheClient: RedisClientType = cache.store.client;
    cacheClient.quit();

    app.close();
  });

  describe('App module', () => {
    it('should be defined', () => {
      expect(app).toBeDefined();
    });
  });

  let user: User;
  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'bsoug2@mailinator.com',
      password: 'qwerty1!',
    };

    describe('sign up', () => {
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('sign in', () => {
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('accessToken', 'access_token')
          .expectBodyContains('access_token');
      });
    });

    describe('user', () => {
      it('should get user', () => {
        return pactum
          .spec()
          .get('/user/me')
          .withBearerToken('$S{accessToken}')
          .expectStatus(HttpStatus.OK)
          .expectBodyContains(dto.email)
          .stores('userId', 'id');
      });
    });
  });

  describe('Expense', () => {
    const dtoMock = (): CreateExpenseDto => ({
      title: faker.lorem.text(),
      description: faker.lorem.paragraph(),
      amount: getRandomAmount(100),
      date: new Date(),
    });
    it('create expenses', async () => {
      const expenseDto1: CreateExpenseDto = dtoMock();
      const expenseDto2: CreateExpenseDto = dtoMock();
      await Promise.all([
        pactum
          .spec()
          .post('/expense')
          .withBearerToken('$S{accessToken}')
          .withBody(expenseDto1)
          .expectStatus(HttpStatus.CREATED)
          .stores('expenseId', 'id'),
        pactum
          .spec()
          .post('/expense')
          .withBearerToken('$S{accessToken}')
          .withBody(expenseDto2)
          .expectStatus(HttpStatus.CREATED),
      ]);
    });
    it('get all expenses', async () => {
      await pactum
        .spec()
        .get('/expense')
        .withBearerToken('$S{accessToken}')
        .expectJsonLike({
          count: 2,
          hasMore: false,
        })
        .expectStatus(HttpStatus.OK);
    });
    it('get expense by ID', async () => {
      await pactum
        .spec()
        .get('/expense/$S{expenseId}')
        .withBearerToken('$S{accessToken}')
        .expectBodyContains('$S{expenseId}')
        .expectStatus(HttpStatus.OK);
    });
    it('edit expense by ID', async () => {
      const amount = getRandomAmount(100, 2);
      const description = 'Manually updated description';
      const dto: UpdateExpenseDto = {
        description,
        amount,
      };
      await pactum
        .spec()
        .patch('/expense/$S{expenseId}')
        .withBearerToken('$S{accessToken}')
        .withBody(dto)
        .expectBodyContains(description)
        .expectBodyContains(amount)
        .expectStatus(HttpStatus.OK);
    });
    it('delete expense by ID', async () => {
      await pactum
        .spec()
        .delete('/expense/$S{expenseId}')
        .withBearerToken('$S{accessToken}')
        .expectStatus(HttpStatus.NO_CONTENT);
      await pactum
        .spec()
        .get('/expense/$S{expenseId}')
        .withBearerToken('$S{accessToken}')
        .expectStatus(HttpStatus.NOT_FOUND);
    });
  });

  describe('AccessKey', () => {
    // Real kraken credentials for test purposes
    const krakenKey =
      'KowBIWYBFu7wj4Q2txKyzohe6xSZ+IY4jFHAHiOUsSOzv1CIDQ0MOvBl';
    const krakenSecret =
      'EFBHt8XTPL6PdxH5Q1MkZ+LHtoZevONlzZZQkEvWnOpPjKhOsrgAmjINZ85Dlmj8e/35vCF7VWaS/uaAMurOzA==';
    const akDto1 = CreateAccessKeyDtoStub(krakenKey, krakenSecret);
    const akDto2 = CreateAccessKeyDtoStub(krakenKey, krakenSecret);

    beforeEach(() => {
      jest
        .spyOn(accessKeyService, 'validateApiCredentials')
        .mockImplementation(() => Promise.resolve());
    });
    afterAll(() => {
      jest.resetAllMocks();
    });

    it('create access key', async () => {
      await Promise.all([
        pactum
          .spec()
          .post('/access-key')
          .withBearerToken('$S{accessToken}')
          .withBody(akDto1)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonLike({
            name: akDto1.name,
            isDeleted: false,
            exchange: akDto1.exchange,
            userId: '$S{userId}',
          })
          .stores('accessKeyId1', 'id'),
        pactum
          .spec()
          .post('/access-key')
          .withBearerToken('$S{accessToken}')
          .withBody(akDto2)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonLike({
            name: akDto2.name,
            isDeleted: false,
            exchange: akDto2.exchange,
            userId: '$S{userId}',
          })
          .stores('accessKeyId2', 'id'),
      ]);
    });
    it('get all access keys', () => {
      return pactum
        .spec()
        .get('/access-key')
        .withBearerToken('$S{accessToken}')
        .expectStatus(HttpStatus.OK)
        .expectJsonLike({
          count: 2,
          hasMore: false,
        })
        .expectBodyContains('$S{accessKeyId1}')
        .expectBodyContains('$S{accessKeyId2}');
    });
    it('delete access keys by Id', async () => {
      await pactum
        .spec()
        .delete('/access-key/{id}')
        .withPathParams('id', '$S{accessKeyId2}')
        .withBearerToken('$S{accessToken}')
        .expectStatus(HttpStatus.NO_CONTENT);

      return pactum
        .spec()
        .get('/access-key')
        .withBearerToken('$S{accessToken}')
        .expectStatus(HttpStatus.OK)
        .expectJsonLike({
          count: 1,
          hasMore: false,
        })
        .expectBodyContains('$S{accessKeyId1}');
    });
  });

  describe('Order', () => {
    const orderDto1 = CreateOrderDtoStub();
    const orderDto2 = CreateOrderDtoStub();

    it('create orders', () => {
      return Promise.all([
        pactum
          .spec()
          .post('/order')
          .withBearerToken('$S{accessToken}')
          .withBody(orderDto1)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonLike({
            orderId: orderDto1.orderId,
            status: orderDto1.status,
            symbol: orderDto1.symbol,
            type: orderDto1.type,
            side: orderDto1.side,
            // All decimal amounts are serialized to strings
            // toString() is used to trim leading zeros
            price: orderDto1.price.toString(),
            filled: orderDto1.filled.toString(),
            cost: orderDto1.cost.toString(),
            fee: orderDto1.fee.toString(),
            currency: orderDto1.currency,
            userId: '$S{userId}',
          })
          .stores('orderId1', 'id'),
        pactum
          .spec()
          .post('/order')
          .withBearerToken('$S{accessToken}')
          .withBody(orderDto2)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonLike({
            orderId: orderDto2.orderId,
            status: orderDto2.status,
            symbol: orderDto2.symbol,
            type: orderDto2.type,
            side: orderDto2.side,
            // All decimal amounts are serialized to strings
            price: orderDto2.price.toString(),
            filled: orderDto2.filled.toString(),
            cost: orderDto2.cost.toString(),
            fee: orderDto2.fee.toString(),
            currency: orderDto2.currency,
            userId: '$S{userId}',
          })
          .stores('orderId2', 'id'),
      ]);
    });
    it('update order', () => {
      const newPrice = getRandomAmount(100);
      const newFilled = getRandomAmount(10);
      const expectedCost = newPrice
        .mul(newFilled)
        .toDecimalPlaces(DECIMAL_ROUNDING);

      return pactum
        .spec()
        .patch('/order/{id}')
        .withPathParams('id', '$S{orderId1}')
        .withBearerToken('$S{accessToken}')
        .withBody({
          price: newPrice,
          filled: newFilled,
        })
        .expectStatus(HttpStatus.OK)
        .expectJsonLike({
          orderId: orderDto1.orderId,
          status: orderDto1.status,
          symbol: orderDto1.symbol,
          type: orderDto1.type,
          side: orderDto1.side,
          // All decimal amounts are serialized to strings
          price: newPrice.toString(),
          filled: newFilled.toString(),
          cost: expectedCost.toString(),
          fee: orderDto1.fee.toString(),
          currency: orderDto1.currency,
          userId: '$S{userId}',
        });
    });
    it('get all orders', () => {
      return pactum
        .spec()
        .get('/order')
        .withBearerToken('$S{accessToken}')
        .expectStatus(HttpStatus.OK)
        .expectJsonLike({
          count: 2,
          hasMore: false,
        })
        .expectBodyContains('$S{orderId1}')
        .expectBodyContains('$S{orderId2}');
    });
    it('delete order by Id', async () => {
      await pactum
        .spec()
        .delete('/order/$S{orderId2}')
        .withBearerToken('$S{accessToken}')
        .expectStatus(HttpStatus.NO_CONTENT);

      return pactum
        .spec()
        .get('/order')
        .withBearerToken('$S{accessToken}')
        .expectStatus(HttpStatus.OK)
        .expectJsonLike({
          count: 1,
          hasMore: false,
        })
        .expectBodyContains('$S{orderId1}');
    });
  });
});
