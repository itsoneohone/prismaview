import * as pactum from 'pactum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { RedisClientType } from 'redis';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import { AuthDto } from '@auth/dto';
import { PrismaService } from '@prismaModule/prisma.service';
import { appMetadata } from '@app/app.module';
import { setupPipes } from '@app/app.config';
import { CreateAccessKeyDtoStub } from '@access-key/stubs';
import { CreateOrderDtoStub, OrderStub } from '@order/stubs';
import { getRandomAmount } from '@shared/utils/amounts';
import { AccessKeyService } from '@access-key/access-key.service';
import {
  calculateOrderAmounts,
  getTickerSymbols,
} from 'src/order/common/utils';
import { ConfigService } from '@nestjs/config';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessKeyService: AccessKeyService;
  let config: ConfigService;

  beforeAll(async () => {
    const APP_PORT = process.env.APP_PORT;
    const module = await Test.createTestingModule(appMetadata).compile();
    app = module.createNestApplication();

    prisma = app.get(PrismaService);
    accessKeyService = app.get(AccessKeyService);
    config = app.get(ConfigService);

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

  describe('AccessKey', () => {
    let krakenKey;
    let krakenSecret;
    let akDto1;
    let akDto2;
    let validateApiCredentialsSpy;

    beforeAll(() => {
      krakenKey = config.get('KRAKEN_API_KEY');
      krakenSecret = config.get('KRAKEN_SECRET');
      akDto1 = CreateAccessKeyDtoStub(krakenKey, krakenSecret);
      akDto2 = CreateAccessKeyDtoStub(krakenKey, krakenSecret);
    });

    beforeEach(() => {
      validateApiCredentialsSpy = jest.spyOn(
        accessKeyService,
        'validateApiCredentials',
      );
      validateApiCredentialsSpy.mockImplementation(() => Promise.resolve());
    });
    afterAll(() => {
      validateApiCredentialsSpy.mockRestore();
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
    // Create teh order stubs to use against the response
    const order1 = OrderStub(1, orderDto1);
    const order2 = OrderStub(1, orderDto2);

    it('create orders', () => {
      return Promise.all([
        pactum
          .spec()
          .post('/order')
          .withBearerToken('$S{accessToken}')
          .withBody(orderDto1)
          .expectStatus(HttpStatus.CREATED)
          .expectJsonLike({
            orderId: order1.orderId,
            status: order1.status,
            symbol: order1.symbol,
            type: order1.type,
            side: order1.side,
            // All decimal amounts are serialized to strings
            // toString() is used to trim leading zeros
            price: order1.price.toString(),
            filled: order1.filled.toString(),
            cost: order1.cost.toString(),
            fee: order1.fee.toString(),
            currency: order1.currency,
            base: order1.base,
            quote: order1.quote,
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
            orderId: order2.orderId,
            status: order2.status,
            symbol: order2.symbol,
            type: order2.type,
            side: order2.side,
            // All decimal amounts are serialized to strings
            price: order2.price.toString(),
            filled: order2.filled.toString(),
            cost: order2.cost.toString(),
            fee: order2.fee.toString(),
            currency: order2.currency,
            base: order2.base,
            quote: order2.quote,
            userId: '$S{userId}',
          })
          .stores('orderId2', 'id'),
      ]);
    });
    it('update order', () => {
      const {
        filled: newFilled,
        price: newPrice,
        cost: expectedCost,
      } = calculateOrderAmounts(getRandomAmount(10), getRandomAmount(100));
      const newSymbol = 'ETH/EUR';
      const {
        base: newBase,
        quote: newQuote,
        currency: newCurrency,
      } = getTickerSymbols(newSymbol);
      return pactum
        .spec()
        .patch('/order/{id}')
        .withPathParams('id', '$S{orderId1}')
        .withBearerToken('$S{accessToken}')
        .withBody({
          price: newPrice,
          filled: newFilled,
          symbol: newSymbol,
        })
        .expectStatus(HttpStatus.OK)
        .expectJsonLike({
          orderId: order1.orderId,
          status: order1.status,
          symbol: newSymbol,
          type: order1.type,
          side: order1.side,
          // All decimal amounts are serialized to strings
          price: newPrice.toString(),
          filled: newFilled.toString(),
          cost: expectedCost.toString(),
          fee: order1.fee.toString(),
          currency: newCurrency,
          base: newBase,
          quote: newQuote,
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
