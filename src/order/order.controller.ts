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
import { SyncMode } from 'src/lib/exchange/exchange.base';
import { CreateOrderDto, UpdateOrderDto } from 'src/order/dto';
import { OrderPlaygroundService } from 'src/order/order.playground.service';
import { OrderService } from 'src/order/order.service';

@Controller('order')
export class OrderController {
  constructor(
    private orderService: OrderService,
    private orderPlaygroundService: OrderPlaygroundService,
  ) {}

  // ------------------------
  // Playground routes
  // ------------------------

  @Get('/access-limited')
  isAccessLimitedToReporting() {
    return this.orderPlaygroundService.isAccessLimited();
  }

  @Get('/supports')
  exchangeSupports() {
    return this.orderPlaygroundService.exchangeSupports();
  }

  @Get('ccxt')
  ccxt() {
    // return this.orderService.fetchΒitstampOrders();
    return this.orderPlaygroundService.fetchKrakenOrders();
    // return this.orderService.paginate2();
  }

  @Get('playground')
  @UseGuards(AccessKeyOwnerGuard)
  playground(@GetAccessKeyFromReq() accessKey: AccessKey) {
    // return this.orderService.fetchΒitstampOrders();
    return this.orderPlaygroundService.playground(accessKey);
    // return this.orderService.paginate2();
  }

  // ------------------------
  // Public routes
  // ------------------------

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
    @Body('syncMode') syncMode: SyncMode,
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
  ) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    return this.orderService.syncOrders(
      userId,
      accessKey,
      syncMode,
      startDateObj,
      endDateObj,
    );
  }
}
