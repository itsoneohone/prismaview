import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { Expense } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private logger = new Logger(SchedulerService.name);
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    this.logger.debug('computeBalances() started.');
    const users = await this.prisma.user.findMany({
      include: {
        expenses: true,
      },
    });

    for (const user of users) {
      const sum = user.expenses.reduce(
        (prev: number, next: Expense): number => {
          return prev + Number(next.amount);
        },
        0,
      );

      if (Number(user.initialBalance) - sum >= Number(user.currentBalance)) {
        this.logger.log(
          `The balance of the user ${user.id} has remained unchanged (${user.currentBalance})`,
        );
        continue;
      }

      const newBalance: number = Number(user.initialBalance) - sum;
      console.log({
        initialBalance: Number(user.initialBalance),
        sum,
        newBalance,
      });
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
