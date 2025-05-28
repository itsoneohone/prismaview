import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UserService } from '@user/user.service';
import { PrismaService } from '@prismaModule/prisma.service';
import {
  CreateUserSettingsDtoStub,
  createUserDtoStubStatic,
  userStubStatic,
} from '@user/stubs';

jest.mock('../../prisma/prisma.service.ts');

describe('UserService', () => {
  const _user = userStubStatic;
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
        //       findUnique: jest.fn().mockImplementation(() => {

        //       }),
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
    expect(service).toBeDefined();
  });

  describe('getMeTest()', () => {
    describe('when called', () => {
      let user;
      const hash = _user.hash;
      beforeEach(async () => {
        // The following fn deletes the hash from the user object, make sure you restore it in afterEach,
        // since the _user object is being used across tests
        user = await service.getMeTest(_user.id);
      });

      afterEach(async () => {
        _user.hash = hash;
      });

      it('findUnique() should be called', () => {
        expect(prismaService.user.findUnique).toHaveBeenCalled();
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: _user.id },
        });
        expect(prismaService.user.findUnique).toHaveReturnedWith(_user);
      });

      it('should return a user', () => {
        expect(user.id).toBe(_user.id);
        expect(user.email).toBe(_user.email);
        expect(user.hash).toBe(undefined);
      });
    });
  });

  describe('createUser()', () => {
    describe('when called', () => {
      let createUserDtoStub;
      let createUserSettingsDto;
      let user;
      beforeEach(async () => {
        createUserSettingsDto = CreateUserSettingsDtoStub();
        createUserDtoStub = createUserDtoStubStatic;
        user = await service.createUser(createUserDtoStub);
      });

      it('create() should be called', () => {
        expect(prismaService.user.create).toHaveBeenCalled();
        expect(prismaService.user.create).toHaveBeenCalledWith({
          data: {
            ...createUserDtoStub,
            userSettings: {
              create: [...createUserSettingsDto],
            },
          },
        });
        expect(prismaService.user.create).toHaveReturnedWith(_user);
      });
      it('should create a user with user settings', () => {
        expect(user.id).toBe(_user.id);
        expect(user.email).toBe(_user.email);
        expect(user.hash).toBe(createUserDtoStub.hash);
        expect(user.userSettings).toMatchObject(createUserSettingsDto);
      });
    });
  });
});
