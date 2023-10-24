import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { ExpenseService } from './expense.service';
import { GetUserFromJwt } from '../auth/decorators';
import { PaginateDto, PaginateResultDto } from '../common/dto';
import { sleep } from 'src/common/utils';

@Controller('expense')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @UseInterceptors(CacheInterceptor)
  // @CacheTTL(20000)
  @CacheKey('all-expenses')
  @Get()
  async getAllUserExpenses(
    @GetUserFromJwt('id') userId: number,
    @Query() paginate: PaginateDto,
  ): Promise<PaginateResultDto> {
    await sleep(1000);
    return this.expenseService.getAllUserExpenses(userId, paginate);
  }

  @Get(':id')
  getAllUserExpenseById(
    @GetUserFromJwt('id') userId: number,
    @Param('id') expenseId: number,
  ) {
    return this.expenseService.getAllUserExpenseById(userId, expenseId);
  }

  @Post()
  createExpense(
    @GetUserFromJwt('id') userId: number,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenseService.createExpense(userId, dto);
  }

  @Patch(':id')
  updateUserExpenseById(
    @GetUserFromJwt('id') userId: number,
    @Param('id') expenseId: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.updateUserExpenseById(userId, expenseId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteUserExpenseById(
    @GetUserFromJwt('id') userId: number,
    @Param('id') expenseId: number,
  ) {
    return this.expenseService.deleteUserExpenseById(userId, expenseId);
  }
}
