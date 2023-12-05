import { accessKeyStubStatic, accessKeyStubs } from 'src/access-key/stubs';
import { userStubStatic, usersWithExpensesStubStatic } from '../../user/stubs';
import { orderStubStatic, orderStubs } from 'src/order/stubs';

export const PrismaService = jest.fn().mockReturnValue({
  user: {
    findUnique: jest.fn().mockImplementation(() => userStubStatic),
    findMany: jest.fn().mockImplementation(() => usersWithExpensesStubStatic),
    update: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
  },
  accessKey: {
    create: jest.fn().mockImplementation(() => accessKeyStubStatic),
    findMany: jest.fn().mockImplementation(() => accessKeyStubs),
    count: jest.fn().mockImplementation(() => accessKeyStubs.length),
    findFirst: jest.fn().mockImplementation(() => accessKeyStubStatic),
    update: jest.fn().mockImplementation(() => {
      accessKeyStubStatic.isDeleted = true;
      return accessKeyStubStatic;
    }),
  },
  order: {
    create: jest.fn().mockImplementation(() => orderStubStatic),
    _getOrderById: jest.fn().mockImplementation(() => orderStubStatic),
    findMany: jest.fn().mockImplementation(() => orderStubs),
    count: jest.fn().mockImplementation(() => orderStubs.length),
  },
});
