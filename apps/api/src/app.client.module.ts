import { Module, ModuleMetadata } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderModule } from './order/order.module';
import { HttpModule } from '@nestjs/axios';
import { PriceModule } from './price/price.module';
import { createKeyv } from '@keyv/redis';
// import { Keyv } from '@keyv/redis';
// import { CacheableMemory } from 'cacheable';
import { CommandsModule } from './commands/commands.module';

const appMetadata: ModuleMetadata = {
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    AuthModule,
    PrismaModule,
    UserModule,
    // CacheModule.register({
    //   isGlobal: true,
    //   ttl: 6000,
    // }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          ttl: config.get('CACHE_TTL') || 8000,
          stores: [
            // new Keyv({
            //   store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            // }),
            createKeyv(config.getOrThrow('REDIS_URL')),
          ],
        };
      },
    }),
    OrderModule,
    PriceModule,
    CommandsModule,
  ],
  controllers: [],
  providers: [
    // OrderService,
  ],
};

@Module(appMetadata)
export class AppClientModule {}
