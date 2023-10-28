import { faker } from '@faker-js/faker';
import { Exchange } from '@prisma/client';
import { CreateAccessKeyDto } from 'src/access-key/dto';
import { userStubStatic } from 'src/user/stubs';

export const CreateAccessKeyDtoStub = (): CreateAccessKeyDto => {
  return {
    name: faker.hacker.abbreviation(),
    key: faker.string.uuid(),
    secret: faker.string.uuid(),
    exchange: Exchange.KRAKEN,
  };
};
export const createAccessKeyDtoStubStatic = CreateAccessKeyDtoStub();
export const createAccessKeyDtoStubStatic2 = CreateAccessKeyDtoStub();

export const AccessKeyStub = (userId?: number, dto?: CreateAccessKeyDto) => {
  return {
    name: dto?.name || faker.hacker.abbreviation(),
    key: dto?.key || faker.string.uuid(),
    secret: dto?.secret || faker.string.uuid(),
    exchange: dto?.exchange || Exchange.KRAKEN,
    userId: userId || 1,
    isDeleted: false,
  };
};
const _user = userStubStatic;
export const accessKeyStubStatic = AccessKeyStub(
  _user.id,
  createAccessKeyDtoStubStatic,
);
export const accessKeyStubStatic2 = AccessKeyStub(
  _user.id,
  createAccessKeyDtoStubStatic2,
);
export const accessKeyStubs = [accessKeyStubStatic, accessKeyStubStatic2];
