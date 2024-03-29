import { faker } from '@faker-js/faker/locale/af_ZA';
import { RoleEnum } from '@prisma/client';
import { getRandomAmount } from 'src/common/amounts';
import { FiatCurrency } from 'src/lib/common/constants';
import { UserSettingName } from 'src/user/common/constants';
import { CreateUserDto } from 'src/user/dto';

export const CreateUserSettingsDtoStub = () => {
  return [
    {
      name: UserSettingName.BASE_CURRENCY,
      value: FiatCurrency.USD,
    },
  ];
};

const date = new Date();
export const CreateUserDtoStub = (): CreateUserDto => {
  const hash = faker.string.sample({ min: 60, max: 80 });

  return {
    email: faker.internet.email(),
    hash,
  };
};

export const UserStub = (userId?: number, createUserDto?: CreateUserDto) => {
  const dto: CreateUserDto = createUserDto || CreateUserDtoStub();
  const initialBalance = getRandomAmount(2000);

  return {
    id: userId || 1,
    createdAt: date,
    updatedAt: date,
    email: dto.email,
    hash: dto.hash,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    initialBalance,
    currentBalance: initialBalance.mul(0.9),
    role: RoleEnum.USER,
    userSettings: [...CreateUserSettingsDtoStub()],
  };
};

export const createUserDtoStubStatic = CreateUserDtoStub();
const userId = 1;
export const userStubStatic = UserStub(userId, createUserDtoStubStatic);
