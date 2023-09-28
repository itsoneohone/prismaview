import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Expense } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { PaginateDto, PaginateResultDto } from 'src/common/dto';

@Injectable()
export class ExpenseService {
  constructor(private prisma: PrismaService) {}

  private async getExpense(
    userId: number,
    expenseId: number,
    withUser?: boolean,
  ): Promise<Expense> {
    const where = {
      id: expenseId,
    };

    const include: { user?: any } = {};
    if (withUser) {
      include.user = {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      };
    }

    const expense = await this.prisma.expense.findFirst({
      where: { ...where },
      include: { ...include },
    });

    if (!expense) {
      throw new NotFoundException('Resource does not exist');
    }

    if (expense.userId !== userId) {
      throw new ForbiddenException('Access to resource unauthorized');
    }

    return expense;
  }

  async getAllUserExpenses(
    userId: number,
    paginate: PaginateDto,
  ): Promise<PaginateResultDto> {
    const expenses = await this.prisma.expense.findMany({
      where: {
        userId,
      },
      take: paginate.limit,
      skip: paginate.offset,
    });
    const count = await this.prisma.expense.count({
      where: {
        userId,
      },
    });

    return {
      data: expenses,
      count,
      hasMore: count > paginate.limit + paginate.offset,
    };
  }

  getAllUserExpenseById(userId: number, expenseId: number): Promise<Expense> {
    return this.getExpense(userId, expenseId, true);
  }

  async createExpense(userId: number, dto: CreateExpenseDto): Promise<Expense> {
    const expense = await this.prisma.expense.create({
      data: {
        ...dto,
        userId,
      },
    });
    return expense;
  }

  async updateUserExpenseById(
    userId: number,
    expenseId: number,
    dto: UpdateExpenseDto,
  ) {
    const expense = await this.getExpense(userId, expenseId);
    const updatedExpense = await this.prisma.expense.update({
      data: {
        ...dto,
      },
      where: {
        id: expenseId,
      },
    });

    return updatedExpense;
  }

  async deleteUserExpenseById(
    userId: number,
    expenseId: number,
  ): Promise<Expense> {
    const expense = await this.getExpense(userId, expenseId);
    await this.prisma.expense.delete({
      where: {
        id: expense.id,
      },
    });

    return expense;
  }
}
