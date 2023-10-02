import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UserService } from '../user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStub } from '../stubs';

jest.mock('../../prisma/prisma.service.ts');

describe('UserService', () => {
  const _user = UserStub();
  let service: UserService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        PrismaService,
        // {
        //   provide: PrismaService,
        //   useValue: {
        //     user: {
        //       findUnique: jest.fn().mockResolvedValue(_user),
        //     },
        //   },
        // },
      ],
      imports: [ConfigModule.forRoot()],
    }).compile();

    service = module.get(UserService);
    prismaService = module.get(PrismaService);
  });

  it('bootstrap', () => {
    expect(service).toBeDefined;
  });

  describe('getMeTest()', () => {
    describe('when called', () => {
      let user;
      beforeEach(async () => {
        user = await service.getMeTest(_user.id);
      });

      it('findUnique() should be called', () => {
        expect(prismaService.user.findUnique).toHaveBeenCalled();
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: _user.id },
        });
        expect(prismaService.user.findUnique).toHaveReturnedWith(
          Promise.resolve(_user),
        );
      });

      it('should return a user', () => {
        expect(user.id).toEqual(_user.id);
        expect(user.email).toBe(_user.email);
        expect(user.hash).toBe(undefined);
      });
    });
  });
});
