import { Test } from '@nestjs/testing';
import { SchedulerService } from '../scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersWithExpensesStub } from '../../user/stubs';

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
    let sum;
    beforeAll(async () => {
      sum = service.getExpensesSum(UsersWithExpensesStub()[0].expenses);
    });

    describe('when called', () => {
      it('return the expenses sum', () => {
        expect(sum).toEqual(130);
      });
    });
  });
});
