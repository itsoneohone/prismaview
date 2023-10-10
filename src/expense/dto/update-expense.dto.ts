import { Decimal } from '@prisma/client/runtime/library';
import {
  IsDecimal,
  IsDate,
  IsOptional,
  IsString,
  isDecimal,
} from 'class-validator';

export class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDecimal()
  @IsOptional()
  amount?: Decimal;

  @IsDate()
  @IsOptional()
  date?: Date;
}
