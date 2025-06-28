import { faker } from '@faker-js/faker/locale/af_ZA';
import { RoleEnum, UserSetting } from '@prisma/client';
import { FiatCurrency } from '@shared/constants/currency';
import { UserSettingName } from '@user/common/constants';
import { CreateUserDto } from '@user/dto';

export const CreateUserSettingsDtoStub = () => {
  return [
    {
      name: UserSettingName.BASE_CURRENCY,
      value: FiatCurrency.USD,
    },
  ];
};

export const UserSettingStub = (
  userId: number,
  settingName?: string,
  settingValue?: string,
): UserSetting => {
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    userId,
    name: settingName || UserSettingName.BASE_CURRENCY,
    value: settingValue || FiatCurrency.USD,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };
};

export const UserSettingsStub = (userId: number): UserSetting[] => {
  return [
    UserSettingStub(userId, UserSettingName.BASE_CURRENCY, FiatCurrency.USD),
  ];
};

export const UserSettingsWithMultipleStub = (userId: number): UserSetting[] => {
  return [
    UserSettingStub(userId, UserSettingName.BASE_CURRENCY, FiatCurrency.USD),
    UserSettingStub(userId, 'THEME', 'dark'),
    UserSettingStub(userId, 'LANGUAGE', 'en'),
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

  return {
    id: userId || 1,
    createdAt: date,
    updatedAt: date,
    email: dto.email,
    hash: dto.hash,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: RoleEnum.USER,
    userSettings: [...CreateUserSettingsDtoStub()],
  };
};

export const UserWithSettingsStub = (
  userId?: number,
  createUserDto?: CreateUserDto,
) => {
  const user = UserStub(userId, createUserDto);
  const userIdForSettings = user.id;

  return {
    ...user,
    userSettings: UserSettingsStub(userIdForSettings),
  };
};

export const UserWithMultipleSettingsStub = (
  userId?: number,
  createUserDto?: CreateUserDto,
) => {
  const user = UserStub(userId, createUserDto);
  const userIdForSettings = user.id;

  return {
    ...user,
    userSettings: UserSettingsWithMultipleStub(userIdForSettings),
  };
};

export const createUserDtoStubStatic = CreateUserDtoStub();
const userId = 1;
export const userStubStatic = UserStub(userId, createUserDtoStubStatic);
