import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail()
  @MinLength(10, {
    message: 'Email too short',
  })
  email: string;

  @IsString()
  @MinLength(7, {
    message: 'Password too short',
  })
  password: string;
}
