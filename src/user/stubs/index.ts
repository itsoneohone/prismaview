import { Expense, Prisma } from '@prisma/client';

const date = new Date();
export const UserStub = () => ({
  id: 1,
  createdAt: date,
  updatedAt: date,
  email: 'bsoug@mailinator.com',
  firstName: null,
  lastName: null,
  initialBalance: 2000,
  currentBalance: 1721.24,
  role: 'USER',
});

export const UsersWithExpensesStub = () => [
  {
    id: 1,
    createdAt: date,
    updatedAt: date,
    email: 'bsoug@mailinator.com',
    firstName: null,
    lastName: null,
    initialBalance: 2000,
    currentBalance: 1900,
    role: 'USER',
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
