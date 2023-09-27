import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUserId } from '../auth/decorators';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  me(@GetUserId() userId: number) {
    return this.userService.getMe(userId);
  }
}
