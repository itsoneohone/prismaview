import { Controller, Get } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get('/supports')
  exchangeSupports() {
    return this.orderService.exchangeSupports();
  }

  @Get('ccxt')
  ccxt() {
    // return this.orderService.fetchΒitstampOrders();
    // return this.orderService.fetchKrakenOrders();
    return this.orderService.paginate2();
  }
}
