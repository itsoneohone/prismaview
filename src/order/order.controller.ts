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
    // return this.orderService.fetchOrders();
    return this.orderService.paginate();
  }
}
