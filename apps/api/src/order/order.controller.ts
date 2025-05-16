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
import { PaginateDto } from 'src/shared/dto';
import { SyncMode } from 'src/lib/exchange/exchange.base';
import { CreateOrderDto, UpdateOrderDto } from 'src/order/dto';
import { OrderService } from 'src/order/order.service';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

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
