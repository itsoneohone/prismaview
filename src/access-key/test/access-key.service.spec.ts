import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AccessKeyService } from 'src/access-key/access-key.service';
import { CreateAccessKeyDto } from 'src/access-key/dto';
import {
  accessKeyStubStatic,
  createAccessKeyDtoStubStatic,
} from 'src/access-key/stubs';
import { PaginateDto, PaginateResultDto } from 'src/common/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { userStubStatic } from 'src/user/stubs';
import {
  SEARCH_LIMIT,
  preparePaginateResultDto,
} from 'src/common/search-utils';
import { access } from 'fs';

jest.mock('../../prisma/prisma.service.ts');

describe('AccessKeyService', () => {
  const user = userStubStatic;
  let service: AccessKeyService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService, AccessKeyService],
      imports: [ConfigModule.forRoot()],
    }).compile();

    service = module.get(AccessKeyService);
    prismaService = module.get(PrismaService);
  });

  it('bootstrap', () => {
    expect(service).toBeDefined;
  });

  describe('createApiKey()', () => {
    // Use the static stubs used for auto mocking the prisma service
    const accessKeyDto: CreateAccessKeyDto = createAccessKeyDtoStubStatic;
    const accessKeyStub = accessKeyStubStatic;
    let accessKey;

    beforeAll(async () => {
      accessKey = await service.createApiKey(user.id, accessKeyDto);
    });

    it('should call prismaService.accessKeys.create()', () => {
      expect(prismaService.accessKey.create).toHaveBeenCalled();
      expect(prismaService.accessKey.create).toHaveBeenCalledWith({
        data: {
          ...accessKeyDto,
          userId: user.id,
        },
      });
      expect(prismaService.accessKey.create).toHaveReturnedWith(accessKeyStub);
    });
    it('should create an API key', () => {
      expect(accessKey).toMatchObject(accessKeyStub);
    });
  });

  describe('getApiKeys()', () => {
    let accessKeysRes: PaginateResultDto;
    let accessKeys;
    let expectedAccessKeysRes: PaginateResultDto;

    describe('when called without a PaginateDto', () => {
      const paginateDto: PaginateDto = {
        limit: SEARCH_LIMIT,
        offset: 0,
      };

      beforeAll(async () => {
        accessKeysRes = await service.getApiKeys(user.id);
        accessKeys = accessKeysRes.data;
        // Fn getApiKeys is expected to return the following result
        expectedAccessKeysRes = preparePaginateResultDto(
          accessKeys,
          accessKeys.length,
          paginateDto,
        );
      });

      it('should call prismaService.accessKeys.findMany()', () => {
        const prismaFn = prismaService.accessKey.findMany;
        expect(prismaFn).toHaveBeenCalled();
        expect(prismaFn).toHaveBeenCalledWith({
          where: {
            userId: user.id,
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: SEARCH_LIMIT,
          skip: 0,
        });
        expect(prismaFn).toHaveReturnedWith(accessKeys);
      });

      it('should call prismaService.accessKeys.count()', () => {
        const prismaFn = prismaService.accessKey.count;
        expect(prismaFn).toHaveBeenCalled();
        expect(prismaFn).toHaveBeenCalledWith({
          where: {
            userId: user.id,
            isDeleted: false,
          },
        });
        expect(prismaFn).toHaveReturnedWith(accessKeys.length);
      });

      it('should return the Api keys of the user', () => {
        expect(accessKeysRes.data).toMatchObject(accessKeys);
        expect(accessKeysRes.count).toEqual(accessKeys.length);
        expect(accessKeysRes.hasMore).toEqual(false);
      });
    });

    describe('when called with a PaginateDto', () => {
      const paginateDto: PaginateDto = {
        limit: SEARCH_LIMIT,
        offset: 0,
      };

      beforeAll(async () => {
        accessKeysRes = await service.getApiKeys(user.id, paginateDto);
        accessKeys = accessKeysRes.data;
        // Fn getApiKeys is expected to return the following result
        expectedAccessKeysRes = preparePaginateResultDto(
          accessKeys,
          accessKeys.length,
          paginateDto,
        );
      });

      it('should call prismaService.accessKeys.findMany()', () => {
        const prismaFn = prismaService.accessKey.findMany;
        expect(prismaFn).toHaveBeenCalled();
        expect(prismaFn).toHaveBeenCalledWith({
          where: {
            userId: user.id,
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: paginateDto.limit,
          skip: paginateDto.offset,
        });
        expect(prismaFn).toHaveReturnedWith(accessKeys);
      });

      it('should call prismaService.accessKeys.count()', () => {
        const prismaFn = prismaService.accessKey.count;
        expect(prismaFn).toHaveBeenCalled();
        expect(prismaFn).toHaveBeenCalledWith({
          where: {
            userId: user.id,
            isDeleted: false,
          },
        });
        expect(prismaFn).toHaveReturnedWith(accessKeys.length);
      });

      it('should return the Api keys of the user', () => {
        expect(accessKeysRes.data).toMatchObject(accessKeys);
        expect(accessKeysRes.count).toEqual(accessKeys.length);
        expect(accessKeysRes.hasMore).toEqual(false);
      });
    });
  });

  describe('deleteApiKeyById()', () => {
    // A random Id is used. It doesn't matter because everything is mocked
    const expenseId = 1;
    // Same as the deletedAccessKey, but with `isDeleted = false`
    const accessKey = accessKeyStubStatic;
    let deletedAccessKey;
    let expectedAccessKeysRes: PaginateResultDto;

    beforeAll(async () => {
      deletedAccessKey = await service.deleteApiKeyById(user.id, expenseId);
    });

    it('should call prismaService.accessKeys.findFirst()', () => {
      const prismaFn = prismaService.accessKey.findFirst;
      expect(prismaFn).toHaveBeenCalled();
      expect(prismaFn).toHaveBeenCalledWith({
        where: {
          userId: user.id,
          id: expenseId,
          isDeleted: false,
        },
      });
      expect(prismaFn).toHaveReturnedWith(accessKey);
    });

    it('should call prismaService.accessKeys.update()', () => {
      const prismaFn = prismaService.accessKey.update;

      expect(prismaFn).toHaveBeenCalled();
      expect(prismaFn).toHaveBeenCalledWith({
        where: {
          userId: user.id,
          id: expenseId,
        },
        data: {
          isDeleted: true,
        },
      });
      expect(prismaFn).toHaveReturnedWith(deletedAccessKey);
    });

    it('should return the deleted Api key of the user', () => {
      expect(deletedAccessKey.isDeleted).toEqual(true);
    });
  });
});
