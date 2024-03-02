import { Body, Controller, Get } from '@nestjs/common';
import { PlaygroundService } from 'src/playground/playground.service';

@Controller('playground')
export class PlaygroundController {
  constructor(private playgroundService: PlaygroundService) {}

  @Get('/ccxt-info')
  ccxtInfo() {
    return this.playgroundService.ccxtInfo();
  }

  @Get('/access-limited')
  isAccessLimitedToReporting() {
    return this.playgroundService.isAccessLimited();
  }

  @Get('/supports')
  exchangeSupports(
    @Body('cryptoExchangeName') cryptoExchangeName?: string,
    @Body('lookFor') lookFor?: string,
  ) {
    return this.playgroundService.exchangeSupports(cryptoExchangeName, lookFor);
  }

  @Get('/my-kraken-ledger')
  myKrakenLedger() {
    return this.playgroundService.fetchKrakenLedger();
  }

  @Get('/my-kraken-orders')
  myKrakenOrders() {
    return this.playgroundService.fetchKrakenOrders();
  }

  @Get('/my-kraken-order')
  myKrakenOrder(@Body('orderId') orderId: string) {
    return this.playgroundService.fetchKrakenOrder(orderId);
  }

  @Get('/my-bitstamp-orders')
  myBitstampOrders() {
    return this.playgroundService.fetchΒitstampOrders();
  }

  @Get('load-markets')
  loadMarkets() {
    return this.playgroundService.loadMarkets();
  }

  @Get('fetch-ohlcv')
  fetchOhlcv() {
    return this.playgroundService.fetchOhlcv();
  }

  // @Get('playground')
  // @UseGuards(AccessKeyOwnerGuard)
  // playground(@GetAccessKeyFromReq() accessKey: AccessKey) {
  //   // return this.orderService.fetchΒitstampOrders();
  //   return this.orderPlaygroundService.playground(accessKey);
  //   // return this.orderService.paginate2();
  // }
}
