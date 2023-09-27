import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { ExpenseService } from './expense.service';
import { GetUserId } from 'src/auth/decorators';

@Controller('expense')
export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  @Get()
  getAllUserExpenses(@GetUserId() userId: number) {
    return this.expenseService.getAllUserExpenses(userId);
  }

  @Get(':id')
  getAllUserExpenseById(
    @GetUserId() userId: number,
    @Param('id', ParseIntPipe) expenseId: number,
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
    @Param('id', ParseIntPipe) expenseId: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.updateUserExpenseById(userId, expenseId, dto);
  }

  @Delete(':id')
  deleteUserExpenseById(
    @GetUserId() userId: number,
    @Param('id', ParseIntPipe) expenseId: number,
  ) {
    return this.expenseService.deleteUserExpenseById(userId, expenseId);
  }
}
