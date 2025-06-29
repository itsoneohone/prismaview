import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UserService } from '@user/user.service';
import { AdminRoute, GetUserFromJwt } from '@auth/decorators';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @AdminRoute()
  @Get('all')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('me')
  me(@GetUserFromJwt('id') userId: number) {
    return this.userService.getMe(userId);
  }

  @Get(':id')
  getPublicUser(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.getPublicUserById(userId);
  }

  @AdminRoute()
  @Get('admin/:id')
  getAdminUser(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.getUserById(userId);
  }
}
