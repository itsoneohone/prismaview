import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { catchError, from, map, mergeMap, of, zip } from 'rxjs';
import { CreateOrderDto, UpdateOrderDto } from 'src/order/dto';
import { PaginateDto, PaginateResultDto } from 'src/common/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccessKey, Order, Prisma } from '@prisma/client';
import {
  SEARCH_LIMIT,
  preparePaginateResultDto,
} from 'src/common/search-utils';
import { DECIMAL_ROUNDING, Decimal } from 'src/common/amounts';
import { prepareOrderDto } from 'src/order/dto/prepare-order.dto';
import { SyncMode } from 'src/lib/exchange/exchange.base';
import { getCryptoExchange } from 'src/lib/exchange/common/utils';

@Injectable()
export class OrderService {
  private logger = new Logger(OrderService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * Get the order of the user using its Id or throw an error
   *
   * @param userId
   * @param id
   * @returns
   */
  async _getOrderById(userId: number, id: number): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where: { userId, id },
    });

    if (!order) {
      throw new NotFoundException('Resource does not exist');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Access to resource unauthorized');
    }

    return order;
  }

  _prepareOrderAmounts(
    amount: Prisma.Decimal | number | string,
    price: Prisma.Decimal | number | string,
  ) {
    const amountDecimal = new Decimal(amount);
    const priceDecimal = new Decimal(price);

    return {
      filled: amountDecimal,
      price: priceDecimal,
      cost: amountDecimal.mul(priceDecimal).toDecimalPlaces(DECIMAL_ROUNDING),
    };
  }

  /**
   * Check if there is an updated filled amount and price set, and calculate the cost
   *
   * @param dto UpdateOrderDto
   * @returns dto
   */
  _updateOrderDto(dto: UpdateOrderDto) {
    // Convert all amounts to decimal and calculate cost
    if (dto.filled && dto.price) {
      dto = {
        ...dto,
        ...this._prepareOrderAmounts(dto.filled, dto.price),
      };
    }
    // Get the unix timestamp based on the input date
    if (dto.datetime) {
      dto.timestamp = BigInt(new Date(dto.datetime).getTime());
    }

    return dto;
  }

  /**
   * Create a new order for a user.
   *
   * Used for a manual creation of an order by the user.
   *
   * @param userId
   * @param dto
   * @returns
   */
  createOrder(userId: number, dto: CreateOrderDto): Promise<Order> {
    // Convert all amounts to decimal and calculate cost
    dto = {
      ...dto,
      ...this._prepareOrderAmounts(dto.filled, dto.price),
    };
    // Get the unix timestamp based on the input date
    dto.timestamp = BigInt(new Date(dto.datetime).getTime());

    return this.prisma.order.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  /**
   * Update an existing user order.
   *
   * @param userId
   * @param id
   * @param dto
   * @returns
   */
  async updateOrderById(
    userId: number,
    id: number,
    dto: UpdateOrderDto,
  ): Promise<Order> {
    await this._getOrderById(userId, id);
    const updatedDto = this._updateOrderDto(dto);

    return this.prisma.order.update({
      where: {
        id,
        userId,
      },
      data: {
        ...updatedDto,
      },
    });
  }

  /**
   * Delete a user order.
   *
   * @param userId
   * @param id
   * @returns
   */
  async deleteOrderById(userId: number, id: number) {
    const order = await this._getOrderById(userId, id);

    return await this.prisma.order.delete({
      where: {
        id: order.id,
        userId: order.userId,
      },
    });
  }

  /**
   * Get the orders of a user.
   *
   * Returns paginated results.
   *
   * @param userId
   * @param paginate
   * @returns
   */
  async getOrders(
    userId: number,
    paginate?: PaginateDto,
  ): Promise<PaginateResultDto> {
    if (!paginate) {
      paginate = {
        limit: SEARCH_LIMIT,
        offset: 0,
      };
    }

    const [orders, count] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: paginate.limit,
        skip: paginate.offset,
      }),

      this.prisma.order.count({
        where: {
          userId,
        },
      }),
    ]);

    return preparePaginateResultDto(orders, count, paginate);
  }

  /**
   * Determine a START and END date depending on the selected syncrhonization mode.
   *
   * @param userId
   * @param accessKey Needed in order to define the date range based on the orders already fetched using a given accessKey
   * @param syncMode One of SyncMode(ALL | RECENT | RANGE)
   * @param startDate Required only in case of SyncMode.RANGE
   * @param endDate Required only in case of SyncMode.RANGE
   * @returns
   */
  private async _getSyncDateRange(
    userId: number,
    accessKey: AccessKey,
    syncMode: SyncMode,
    startDate?: Date,
    endDate?: Date,
  ) {
    let startDateObj: Date;
    let endDateObj: Date;

    // Determine startDate and endDate based on the sync mode
    if (syncMode === SyncMode.ALL) {
      // Ensure a previous sync all operation has completed.
      // - Find the oldest order and start syncing any orders before this one.
      // - If there are no orders, it means that this is the first sync, so we fetch all
      const firstOrder = await this.prisma.order.findFirst({
        // select: { id: true, orderId: true, datetime: true, timestamp: true },
        where: { userId, accessKeyId: accessKey.id },
        orderBy: {
          datetime: 'asc',
        },
      });

      startDateObj = new Date(1970, 1, 1);
      endDateObj = firstOrder ? new Date(firstOrder.datetime) : new Date();
    } else if (syncMode === SyncMode.RECENT) {
      // Find the most recent and start syncing any order after this one.
      // - If there are no orders, it means that this is the first sync, so we fetch all
      const lastOrder = await this.prisma.order.findFirst({
        // select: { id: true, orderId: true, datetime: true, timestamp: true },
        where: { userId, accessKeyId: accessKey.id },
        orderBy: {
          datetime: 'desc',
        },
      });

      startDateObj = lastOrder
        ? new Date(lastOrder.datetime)
        : new Date(1970, 1, 1);
      endDateObj = new Date();
    } else if (syncMode === SyncMode.RANGE) {
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);

      // Always expect a user defined start and end date in the case of a RANGE syncMode
      const validationErrors = [];
      if (isNaN(startDateObj.valueOf())) {
        validationErrors.push({
          field: 'startDate',
          error: 'Select the `Start date` of the synchronization window',
        });
      }
      if (isNaN(endDateObj.valueOf())) {
        validationErrors.push({
          field: 'endDate',
          error: 'Select the `End date` of the synchronization window',
        });
      }
      if (startDateObj.getTime() > endDateObj.getTime()) {
        validationErrors.push({
          field: 'startDate',
          error: 'Select a `Start date` smaller than the `End date`',
        });
      }

      if (validationErrors.length) {
        throw new BadRequestException(validationErrors);
      }
    } else {
      // Invalid sync option, throw a validation error
      throw new BadRequestException({
        field: 'syncMode',
        error: '`Sync mode` has to be one of (`ALL`, `RECENT` or `RANGE`)',
      });
    }

    return {
      startDateObj,
      endDateObj,
    };
  }
  /**
   * Sync orders with an exchange
   *
   * @param userId
   * @param accessKey Needed in order to define the date range based on the orders already fetched using a given accessKey
   * @param syncMode One of SyncMode(ALL | RECENT | RANGE)
   * @param startDate Required only in case of SyncMode.RANGE
   * @param endDate Required only in case of SyncMode.RANGE
   * @returns
   */
  async syncOrders(
    userId: number,
    accessKey: AccessKey,
    syncMode: SyncMode,
    startDate?: Date,
    endDate?: Date,
  ) {
    const exchange = getCryptoExchange(accessKey);
    const { startDateObj, endDateObj } = await this._getSyncDateRange(
      userId,
      accessKey,
      syncMode,
      startDate,
      endDate,
    );

    return exchange.syncOrders(startDateObj, endDateObj).pipe(
      // Merge allOrders with the output of the Observable that checks the existing orders
      mergeMap((allOrders) => {
        const allOrdersDict = {};
        const allOrderIds = [];
        allOrders.forEach((o) => {
          allOrderIds.push(o.id);
          allOrdersDict[o.id] = o;
        });

        return zip(
          of(allOrdersDict),
          from(
            Promise.resolve(
              // Find the existing orders
              this.prisma.order.findMany({
                select: { id: true, orderId: true },
                where: {
                  orderId: {
                    in: allOrderIds,
                  },
                },
              }),
            ),
          ),
        ).pipe(
          catchError((error: any) => {
            this.logger.error(error);
            throw new Error(`An ${error.name} error occurred (${error})`);
          }),
        );
      }),
      mergeMap(([allOrdersDict, allOrderIds]) => {
        // Delete from the fetched orders those that are already saved in the DB
        const skippedOrders = [];
        allOrderIds.forEach((order) => {
          skippedOrders.push(order.orderId);
          delete allOrdersDict[order.orderId];
        });

        // Prepare the order DTOs;
        const dtos: CreateOrderDto[] = Object.values(allOrdersDict).map(
          (curr: any) => {
            return prepareOrderDto(userId, accessKey.id, curr);
          },
        );

        const response = {
          saved: {
            orders: Object.keys(allOrdersDict),
            count: Object.keys(allOrdersDict).length,
          },
          skipped: {
            orders: skippedOrders,
            count: skippedOrders.length,
          },
        };

        return zip(
          of(response),
          from(
            Promise.resolve(
              this.prisma.order.createMany({
                data: dtos,
                skipDuplicates: true,
              }),
            ),
          ),
        ).pipe(
          catchError((error: any) => {
            this.logger.error(error);
            throw new Error(`An ${error.name} error occurred (${error})`);
          }),
        );
      }),
      map(([response, createdOrders]) => {
        response.saved.count = createdOrders.count;
        return response;
      }),
    );
  }
}
