import { faker } from '@faker-js/faker/locale/af_ZA';
import { Expense, Prisma, Role } from '@prisma/client';

const date = new Date();
export const UserStub = (userId?: number) => {
  const initialBalance = Math.random() * 2000;
  return {
    id: userId || 1,
    createdAt: date,
    updatedAt: date,
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    initialBalance,
    currentBalance: initialBalance * 0.9,
    role: Role.USER,
  };
};
export const userStubStatic = UserStub();

export const UsersWithExpensesStub = () => {
  const _user = UserStub();
  return [
    {
      ..._user,
      expenses: [
        {
          id: 1,
          amount: new Prisma.Decimal(100),
        },
        {
          id: 2,
          amount: new Prisma.Decimal(10),
        },
        {
          id: 3,
          amount: new Prisma.Decimal(20),
        },
      ] as Expense[],
    },
  ];
};
export const usersWithExpensesStubStatic = UsersWithExpensesStub();
