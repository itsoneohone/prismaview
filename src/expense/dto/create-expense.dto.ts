import { Decimal } from '@prisma/client/runtime/library';
import {
  IsDateString,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDecimal()
  @IsNotEmpty()
  amount: Decimal;

  @IsDateString()
  date: Date;
}
