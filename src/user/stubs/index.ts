import { faker } from '@faker-js/faker/locale/af_ZA';
import { Expense, RoleEnum } from '@prisma/client';
import { Decimal, getRandomAmount } from 'src/common/amounts';

const date = new Date();
export const UserStub = (userId?: number) => {
  const initialBalance = getRandomAmount(2000);
  return {
    id: userId || 1,
    createdAt: date,
    updatedAt: date,
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    initialBalance,
    currentBalance: initialBalance.mul(0.9),
    role: RoleEnum.USER,
  };
};
export const userStubStatic = UserStub();

const _prepareExpenses = () => [
  {
    id: 1,
    amount: getRandomAmount(10),
  },
  {
    id: 2,
    amount: getRandomAmount(5),
  },
  {
    id: 3,
    amount: getRandomAmount(3),
  },
];
export const UsersWithExpensesStub = () => {
  const _user = UserStub();
  const expenses = _prepareExpenses();
  const expectedSum = expenses.reduce((calculatedSum, expense) => {
    return calculatedSum.add(expense.amount);
  }, new Decimal(0));

  return [
    {
      ..._user,
      // Set the current balance so that the check of whether the balance has changed is always true
      currentBalance: _user.initialBalance.sub(expectedSum).add(10),
      expenses: expenses as Expense[],
    },
  ];
};
export const usersWithExpensesStubStatic = UsersWithExpensesStub();
