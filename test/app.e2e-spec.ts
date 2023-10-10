import { faker } from '@faker-js/faker';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import * as session from 'express-session';
import RedisStore from 'connect-redis';
import { redisStore } from 'cache-manager-redis-yet';
import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { AuthModule } from 'src/auth/auth.module';
import { SessionGuard, AdminGuard } from 'src/auth/guards';
import { ExpenseModule } from 'src/expense/expense.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SchedulerModule } from 'src/scheduler/scheduler.module';
import { UserModule } from 'src/user/user.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthDto } from 'src/auth/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from 'src/expense/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let redisClient: RedisClientType;
  let cookie = '';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AuthModule,
        PrismaModule,
        UserModule,
        ExpenseModule,
        SchedulerModule,
        ScheduleModule.forRoot(),
        CacheModule.registerAsync<RedisClientOptions>({
          isGlobal: true,
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => {
            return {
              store: await redisStore({
                url: config.getOrThrow('REDIS_URL'),
                ttl: 8000,
              }),
            };
          },
        }),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: SessionGuard,
        },
        {
          provide: APP_GUARD,
          useClass: AdminGuard,
        },
      ],
    }).compile();
    app = module.createNestApplication();

    const configService = app.get(ConfigService);

    // redis connection logic
    redisClient = createClient({
      url: configService.get('REDIS_URL'),
    });

    const prisma: PrismaService = app.get(PrismaService);

    // Set up the session middleware
    app.use(
      session({
        secret: configService.get('SESSION_SECRET'),
        resave: false,
        saveUninitialized: false,
        store: new RedisStore({
          client: redisClient,
        }),
      }),
    );

    // Connect to redis
    await redisClient.connect().catch((error) => {
      throw error;
    });

    // Global param validator
    // - Transform param to the expected type as defined by TS
    // - Apply validation rules to our DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        // Delete any values from the body which does not have a decorator
        whitelist: true,
      }),
    );

    await app.init();

    await prisma.cleanDB();
  });

  afterAll(async () => {
    // Manually close the redis connection so that it doesn't hang
    const cache = app.get(CACHE_MANAGER);
    const cacheClient: RedisClientType = cache.store.client;
    cacheClient.quit();
    redisClient.disconnect();
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
        return (
          request(app.getHttpServer())
            .post('/auth/signup')
            .send(dto)
            .expect(201)
            // .expect((res) => {
            //   console.log({ cookie: res.headers });
            // })
            .expect('set-cookie', /connect.sid/)
        );
      });
    });

    describe('sign in', () => {
      it('should signin', () => {
        return request(app.getHttpServer())
          .post('/auth/signin')
          .send(dto)
          .expect(200)
          .expect('set-cookie', /connect.sid/)
          .expect(({ headers }) => {
            cookie = headers?.['set-cookie'];
          });
      });
    });

    describe('user', () => {
      it('should get user', () => {
        return request(app.getHttpServer())
          .get('/user/me')
          .set('Cookie', cookie)
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
        .set('Cookie', cookie)
        .send(expenseDto1)
        .expect(201);
      await request(app.getHttpServer())
        .post('/expense')
        .set('Cookie', cookie)
        .send(expenseDto2)
        .expect(201);
    });
    it('get all expenses', async () => {
      await request(app.getHttpServer())
        .get('/expense')
        .set('Cookie', cookie)
        .expect(({ body }) => {
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
        .set('Cookie', cookie)
        .expect(({ body }) => {
          expect(expenseId).toEqual(body.id);
        })
        .expect(200);
      await request(app.getHttpServer())
        .get(`/expense/${0}`)
        .set('Cookie', cookie)
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
        .set('Cookie', cookie)
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
        .set('Cookie', cookie)
        .expect(HttpStatus.NO_CONTENT);
      await request(app.getHttpServer())
        .get(`/expense/${expenseId}`)
        .set('Cookie', cookie)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
