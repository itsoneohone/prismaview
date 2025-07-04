import { Module, ModuleMetadata } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from '@auth/auth.module';
import { PrismaModule } from '@prismaModule/prisma.module';
import { UserModule } from '@user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SchedulerModule } from '@scheduler/scheduler.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from '@app//app.controller';
import { OrderModule } from '@order/order.module';
import { OrderService } from '@order/order.service';
import { EventsModule } from '@events/events.module';
import { JwtGuard } from '@auth/guards/jwt.guard';
import { HttpModule } from '@nestjs/axios';
import { AccessKeyModule } from '@access-key/access-key.module';
import { PlaygroundModule } from '@playground/playground.module';
import { PriceModule } from '@price/price.module';
import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

export const appMetadata: ModuleMetadata = {
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    AuthModule,
    PrismaModule,
    UserModule,
    SchedulerModule,
    ScheduleModule.forRoot(),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const ttl = config.get('CACHE_TTL') || 30000;
        return {
          ttl,
          stores: [
            createKeyv(config.getOrThrow('REDIS_URL')),
            new Keyv({
              store: new CacheableMemory({ ttl, lruSize: 5000 }),
            }),
          ],
        };
      },
    }),
    PlaygroundModule,
    OrderModule,
    EventsModule,
    AccessKeyModule,
    PriceModule,
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
};

@Module(appMetadata)
export class AppModule {}
