import { Controller, Get, Render } from '@nestjs/common';
import { name as appName, version as appVersion } from 'package.json';
import { PublicRoute } from 'src/auth/decorators';

@PublicRoute()
@Controller()
export class AppController {
  @Render('index')
  @Get()
  orderList() {
    return {
      message: 'Welcome to the app!',
    };
  }

  @Get('/status')
  getStatus() {
    return {
      name: appName,
      version: appVersion,
    };
  }
}
