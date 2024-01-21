import { Test } from '@nestjs/testing';
import { SchedulerService } from '../scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersWithExpensesStub } from '../../user/stubs';
import { Decimal } from 'src/common/amounts';

jest.mock('../../prisma/prisma.service.ts');

describe.only('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: PrismaService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [SchedulerService, PrismaService],
    }).compile();

    service = module.get(SchedulerService);
    prisma = module.get(PrismaService);
  });

  it('bootstrap', () => {
    expect(service).toBeDefined();
  });

  describe('computeBalances()', () => {
    let users;
    beforeAll(async () => {
      users = await service.computeBalances();
    });

    describe('when called', () => {
      it('should call prisma fns', () => {
        expect(prisma.user.findMany).toHaveBeenCalled();
        expect(prisma.user.update).toHaveBeenCalled();
      });
    });
  });

  describe('computeBalances()', () => {
    let expectedSum;
    let sum;
    beforeAll(async () => {
      const user = UsersWithExpensesStub()[0];
      const userExpenses = user.expenses;
      expectedSum = userExpenses.reduce((calculatedSum, expense) => {
        return calculatedSum.add(expense.amount);
      }, new Decimal(0));
      sum = new Decimal(service.getExpensesSum(userExpenses)).toDecimalPlaces(
        8,
      );
    });

    describe('when called', () => {
      it('return the expenses sum', () => {
        // NOTE: The expenses calculation functionaliy is legacy and will be removed.
        //       Testing with decimals a temp fix.
        expect(sum).toEqual(expectedSum);
      });
    });
  });
});
