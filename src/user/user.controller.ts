import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { AdminRoute, PublicRoute } from '../auth/decorators';
import { GetUserFromJwt } from 'src/auth/decorators';

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
}
