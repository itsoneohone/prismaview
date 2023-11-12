import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessKey } from '@prisma/client';
import { GetAccessKeyFromReq } from 'src/access-key/decorators';
import { AccessKeyOwnerGuard } from 'src/access-key/guards';
import { GetUserFromJwt } from 'src/auth/decorators';
import { PaginateDto } from 'src/common/dto';
import { CreateOrderDto, UpdateOrderDto } from 'src/order/dto';
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
    return this.orderService.fetchKrakenOrders();
    // return this.orderService.paginate2();
  }

  @Post()
  createOrder(
    @GetUserFromJwt('id') userId: number,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(userId, dto);
  }

  @Patch(':id')
  updateOrderById(
    @GetUserFromJwt('id') userId: number,
    @Param('id') id: number,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.orderService.updateOrderById(userId, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteOrderById(
    @GetUserFromJwt('id') userId: number,
    @Param('id') id: number,
  ) {
    return this.orderService.deleteOrderById(userId, id);
  }

  @Get()
  getOrders(
    @GetUserFromJwt('id') userId: number,
    @Query() paginate: PaginateDto,
  ) {
    return this.orderService.getOrders(userId, paginate);
  }

  @Post('sync')
  @UseGuards(AccessKeyOwnerGuard)
  syncOrders(
    @GetUserFromJwt('id') userId: number,
    @GetAccessKeyFromReq() accessKey: AccessKey,
    @Body('accessKeyId', ParseIntPipe) accessKeyId: number,
  ) {
    return this.orderService.syncOrders(userId, accessKey);
  }
}
