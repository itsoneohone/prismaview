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
import { GetUserId } from '../auth/decorators';
import { PaginateDto, PaginateResultDto } from '../common/dto';

@Controller('expense')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  private timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @UseInterceptors(CacheInterceptor)
  // @CacheTTL(20000)
  @CacheKey('all-expenses')
  @Get()
  async getAllUserExpenses(
    @GetUserId() userId: number,
    @Query() paginate: PaginateDto,
  ): Promise<PaginateResultDto> {
    await this.timeout(1000);
    return this.expenseService.getAllUserExpenses(userId, paginate);
  }

  @Get(':id')
  getAllUserExpenseById(
    @GetUserId() userId: number,
    @Param('id') expenseId: number,
  ) {
    return this.expenseService.getAllUserExpenseById(userId, expenseId);
  }

  @Post()
  createExpense(@GetUserId() userId: number, @Body() dto: CreateExpenseDto) {
    return this.expenseService.createExpense(userId, dto);
  }

  @Patch(':id')
  updateUserExpenseById(
    @GetUserId() userId: number,
    @Param('id') expenseId: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.updateUserExpenseById(userId, expenseId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteUserExpenseById(
    @GetUserId() userId: number,
    @Param('id') expenseId: number,
  ) {
    return this.expenseService.deleteUserExpenseById(userId, expenseId);
  }
}
