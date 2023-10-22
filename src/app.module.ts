import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
// import * as redisStore from 'cache-manager-redis-store';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { AdminGuard, SessionGuard } from './auth/guards';
import { ExpenseModule } from './expense/expense.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app/app.controller';
import { OrderModule } from './order/order.module';
import { OrderService } from './order/order.service';
import { EventsModule } from './events/events.module';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Module({
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
    // CacheModule.register({
    //   isGlobal: true,
    //   ttl: 6000,
    // }),
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
    OrderModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: SessionGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: AdminGuard,
    // },
    OrderService,
  ],
})
export class AppModule {}
