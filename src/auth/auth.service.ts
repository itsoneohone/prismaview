import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  signup(dto: AuthDto) {
    console.log({ dto });
    // Get email and password
    // Check if the user exists

    // Hash the password

    // Store the user in the DB
    return { msg: 'sign up fn' };
  }

  signin() {
    return { msg: 'sign in fn' };
  }
}
