import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  // Note the IsHash() doesn't support the argon2 hash algorithm
  @IsString()
  hash: string;
}
