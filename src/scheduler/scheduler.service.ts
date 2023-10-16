import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { Expense } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private logger = new Logger(SchedulerService.name);
  constructor(private prisma: PrismaService) {}

  getExpensesSum(expenses: Array<Expense>) {
    const sum = expenses.reduce((prev: number, next: Expense): number => {
      return prev + Number(next.amount);
    }, 0);
    return sum;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async computeBalances() {
    this.logger.debug('computeBalances() started.');
    const users = await this.prisma.user.findMany({
      include: {
        expenses: true,
      },
    });

    for (const user of users) {
      const sum = this.getExpensesSum(user.expenses);

      if (Number(user.initialBalance) - sum >= Number(user.currentBalance)) {
        this.logger.log(
          `The balance of the user ${user.id} has remained unchanged (${user.currentBalance})`,
        );
        continue;
      }

      const newBalance: number = Number(user.initialBalance) - sum;

      await this.prisma.user
        .update({
          where: {
            id: user.id,
          },
          data: {
            currentBalance: newBalance.toString(),
          },
        })
        .catch((error) => this.logger.error(error));
      this.logger.log(
        `The new balance of the user ${user.id} is (${newBalance})`,
      );
    }
    this.logger.debug('computeBalances() ended.');
  }
}
