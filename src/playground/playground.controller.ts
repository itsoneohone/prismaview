import { Controller, Get } from '@nestjs/common';
import { PlaygroundService } from 'src/playground/playground.service';

@Controller('playground')
export class PlaygroundController {
  constructor(private playgroundService: PlaygroundService) {}

  @Get('/access-limited')
  isAccessLimitedToReporting() {
    return this.playgroundService.isAccessLimited();
  }

  @Get('/supports')
  exchangeSupports() {
    return this.playgroundService.exchangeSupports();
  }

  @Get('ccxt')
  ccxt() {
    // return this.orderService.fetchΒitstampOrders();
    return this.playgroundService.fetchKrakenOrders();
    // return this.orderService.paginate2();
  }

  // @Get('playground')
  // @UseGuards(AccessKeyOwnerGuard)
  // playground(@GetAccessKeyFromReq() accessKey: AccessKey) {
  //   // return this.orderService.fetchΒitstampOrders();
  //   return this.orderPlaygroundService.playground(accessKey);
  //   // return this.orderService.paginate2();
  // }
}
