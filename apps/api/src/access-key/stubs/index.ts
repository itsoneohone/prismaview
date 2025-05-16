import { faker } from '@faker-js/faker';
import { ExchangeNameEnum } from '@prisma/client';
import { CreateAccessKeyDto } from 'src/access-key/dto';
import { userStubStatic } from 'src/user/stubs';

export const CreateAccessKeyDtoStub = (
  key?: string,
  secret?: string,
): CreateAccessKeyDto => {
  return {
    name: faker.hacker.abbreviation(),
    key: key || faker.string.alphanumeric({ length: 24 }),
    secret: secret || faker.string.alphanumeric({ length: 24 }),
    exchange: ExchangeNameEnum.KRAKEN,
  };
};
export const createAccessKeyDtoStubStatic = CreateAccessKeyDtoStub();
export const createAccessKeyDtoStubStatic2 = CreateAccessKeyDtoStub();

export const AccessKeyStub = (userId?: number, dto?: CreateAccessKeyDto) => {
  return {
    name: dto?.name || faker.hacker.abbreviation(),
    key: dto?.key || faker.string.alphanumeric({ length: 24 }),
    secret: dto?.secret || faker.string.alphanumeric({ length: 24 }),
    exchange: dto?.exchange || ExchangeNameEnum.KRAKEN,
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
