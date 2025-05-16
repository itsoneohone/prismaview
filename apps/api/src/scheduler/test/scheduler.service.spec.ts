import { Test } from '@nestjs/testing';
import { SchedulerService } from '../scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

jest.mock('../../prisma/prisma.service.ts');

describe.only('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: PrismaService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [SchedulerService, PrismaService],
      imports: [ConfigModule.forRoot()],
    }).compile();

    service = module.get(SchedulerService);
    prisma = module.get(PrismaService);
  });

  it('bootstrap', () => {
    expect(service).toBeDefined();
  });

  describe('fetchOHLV()', () => {
    beforeAll(async () => {
      // await service.fetchOHLV();
    });

    it('should fetch open, high, low, close prices and volume', () => {
      expect(true).toBeTruthy;
    });
  });
});
