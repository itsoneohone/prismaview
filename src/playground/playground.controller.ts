import { Body, Controller, Get } from '@nestjs/common';
import { ExchangeNameEnum } from '@prisma/client';
import { PlaygroundService } from 'src/playground/playground.service';

@Controller('playground')
export class PlaygroundController {
  constructor(private playgroundService: PlaygroundService) {}

  @Get('/ccxt-info')
  ccxtInfo() {
    return this.playgroundService.ccxtInfo();
  }

  @Get('/validate-credentials')
  validateCredentials(@Body('exchangeName') exchangeName: ExchangeNameEnum) {
    return this.playgroundService.validateCredentials(exchangeName);
  }

  @Get('/supports')
  exchangeSupports(
    @Body('cryptoExchangeName') cryptoExchangeName?: string,
    @Body('lookFor') lookFor?: string,
  ) {
    return this.playgroundService.exchangeSupports(cryptoExchangeName, lookFor);
  }

  @Get('/my-kraken-ledger')
  myKrakenLedger(@Body('exchangeName') exchangeName: ExchangeNameEnum) {
    return this.playgroundService.fetchKrakenLedger(exchangeName);
  }

  @Get('/my-kraken-orders')
  myKrakenOrders() {
    return this.playgroundService.fetchKrakenOrders();
  }

  @Get('/my-kraken-order')
  myKrakenOrder(@Body('orderId') orderId: string) {
    return this.playgroundService.fetchKrakenOrder(orderId);
  }

  @Get('/my-orders')
  myOrders(@Body('exchangeName') exchangeName: ExchangeNameEnum) {
    return this.playgroundService.fetchOrders(exchangeName);
  }

  @Get('load-markets')
  loadMarkets(@Body('exchangeName') exchangeName: ExchangeNameEnum) {
    return this.playgroundService.loadMarkets(exchangeName);
  }

  @Get('fetch-ticker')
  fetchTicker(
    @Body('exchangeName') exchangeName: ExchangeNameEnum,
    @Body('market') market: string,
  ) {
    return this.playgroundService.fetchTicker(exchangeName, market);
  }

  @Get('fetch-ohlcv')
  fetchOhlcv(
    @Body('exchangeName') exchangeName: ExchangeNameEnum,
    @Body('market') market: string,
    @Body('since') since: string,
    @Body('limit') limit?: number,
  ) {
    return this.playgroundService.fetchOhlcv(
      exchangeName,
      market,
      since,
      limit,
    );
  }

  // @Get('playground')
  // @UseGuards(AccessKeyOwnerGuard)
  // playground(@GetAccessKeyFromReq() accessKey: AccessKey) {
  //   // return this.orderService.fetchΒitstampOrders();
  //   return this.orderPlaygroundService.playground(accessKey);
  //   // return this.orderService.paginate2();
  // }
}
