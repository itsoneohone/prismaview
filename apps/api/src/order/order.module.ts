import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from 'src/order/order.service';
import { HttpModule } from '@nestjs/axios';
import { AccessKeyModule } from 'src/access-key/access-key.module';

@Module({
  imports: [HttpModule, AccessKeyModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
