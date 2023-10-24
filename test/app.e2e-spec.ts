import { faker } from '@faker-js/faker';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { RedisClientType } from 'redis';
import { HttpStatus } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from 'src/expense/dto';
import { appMetadata } from 'src/app.module';
import { setupPipes } from 'src/app-config/app-config';

describe('App e2e', () => {
  let app: INestApplication;
  let accessToken = '';

  beforeAll(async () => {
    const module = await Test.createTestingModule(appMetadata).compile();
    app = module.createNestApplication();

    const prisma: PrismaService = app.get(PrismaService);

    // Set up pipes
    setupPipes(app);

    await app.init();

    await prisma.cleanDB();
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
        return request(app.getHttpServer())
          .post('/auth/signup')
          .send(dto)
          .expect(201);
      });
    });

    describe('sign in', () => {
      it('should signin', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send(dto)
          .expect(200)
          .expect(({ body }) => {
            accessToken = body.access_token;
          });
      });
    });

    describe('user', () => {
      it('should get user', () => {
        return request(app.getHttpServer())
          .get('/user/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect(({ body }) => {
            user = body;
            expect(body.email).toEqual(dto.email);
          });
      });
    });
  });

  describe('Expense', () => {
    let expenseId: number;
    const dtoMock = (): CreateExpenseDto => ({
      title: faker.lorem.text(),
      description: faker.lorem.paragraph(),
      amount: new Prisma.Decimal(Math.random() * 100),
      date: new Date(),
    });
    it('create expenses', async () => {
      const expenseDto1: CreateExpenseDto = dtoMock();
      const expenseDto2: CreateExpenseDto = dtoMock();
      await request(app.getHttpServer())
        .post('/expense')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(expenseDto1)
        .expect(201);
      await request(app.getHttpServer())
        .post('/expense')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(expenseDto2)
        .expect(201);
    });
    it('get all expenses', async () => {
      await request(app.getHttpServer())
        .get('/expense')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          console.log({ body });
          expenseId = body.data[0].id;
          expect.objectContaining({
            data: expect.any(Array),
            count: 2,
            hasMore: false,
          });
        })
        .expect(200);
    });
    it('get expense by ID', async () => {
      await request(app.getHttpServer())
        .get(`/expense/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(expenseId).toEqual(body.id);
        })
        .expect(200);
      await request(app.getHttpServer())
        .get(`/expense/${0}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body.statusCode).toEqual(404);
          expect(body.error).toEqual('Not Found');
          expect(body.message).toEqual('Resource does not exist');
        })
        .expect(404);
    });
    it('edit expense by ID', async () => {
      const amount = new Prisma.Decimal(Math.round(Math.random() * 100));
      const description = 'Manually updated description';
      const dto: UpdateExpenseDto = {
        description,
        amount,
      };
      await request(app.getHttpServer())
        .patch(`/expense/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(dto)
        .expect(({ body }) => {
          expect(body.description).toEqual(description);
          expect(new Prisma.Decimal(body.amount)).toEqual(amount);
        })
        .expect(200);
    });
    it('delete expense by ID', async () => {
      await request(app.getHttpServer())
        .delete(`/expense/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);
      await request(app.getHttpServer())
        .get(`/expense/${expenseId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
