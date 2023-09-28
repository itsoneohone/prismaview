import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { ExpenseService } from './expense.service';
import { GetUserId } from '../auth/decorators';
import { PaginateDto, PaginateResultDto } from '../common/dto';

@Controller('expense')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Get()
  getAllUserExpenses(
    @GetUserId() userId: number,
    @Query() paginate: PaginateDto,
  ): Promise<PaginateResultDto> {
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

  @Delete(':id')
  deleteUserExpenseById(
    @GetUserId() userId: number,
    @Param('id') expenseId: number,
  ) {
    return this.expenseService.deleteUserExpenseById(userId, expenseId);
  }
}
