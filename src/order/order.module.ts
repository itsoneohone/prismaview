import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from 'src/order/order.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
