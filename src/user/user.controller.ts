import { Controller, Get, SetMetadata } from '@nestjs/common';
import { UserService } from './user.service';
import { AdminRoute, GetUserId } from '../auth/decorators';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @AdminRoute()
  @Get('all')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('me')
  me(@GetUserId() userId: number) {
    return this.userService.getMe(userId);
  }
}
