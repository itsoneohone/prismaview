import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AccessKeysService } from 'src/access-keys/access-keys.service';
import { CreateAccessKeyDto } from 'src/access-keys/dto';
import {
  accessKeyStubStatic,
  createAccessKeyDtoStubStatic,
} from 'src/access-keys/stubs';
import { PrismaService } from 'src/prisma/prisma.service';
import { userStubStatic } from 'src/user/stubs';

jest.mock('../../prisma/prisma.service.ts');

describe('AccessKeysService', () => {
  let service: AccessKeysService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PrismaService, AccessKeysService],
      imports: [ConfigModule.forRoot()],
    }).compile();

    service = module.get(AccessKeysService);
    prismaService = module.get(PrismaService);
  });

  it('bootstrap', () => {
    expect(service).toBeDefined;
  });

  describe('createApiKey()', () => {
    let accessKeyDto: CreateAccessKeyDto = createAccessKeyDtoStubStatic;
    let accessKeyStub = accessKeyStubStatic;
    let user = userStubStatic;

    beforeAll(async () => {
      await service.createApiKey(user.id, accessKeyDto);
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
  });
});
