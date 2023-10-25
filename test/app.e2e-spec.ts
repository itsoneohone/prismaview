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

describe('App e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule(appMetadata).compile();
    app = module.createNestApplication();

    const prisma: PrismaService = app.get(PrismaService);

    // Set up pipes
    setupPipes(app);

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
          .expectBodyContains(dto.email);
      });
    });
  });

  describe('Expense', () => {
    const dtoMock = (): CreateExpenseDto => ({
      title: faker.lorem.text(),
      description: faker.lorem.paragraph(),
      amount: new Prisma.Decimal(Math.random() * 100),
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
      const amount = new Prisma.Decimal(Math.round(Math.random() * 100));
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
});
