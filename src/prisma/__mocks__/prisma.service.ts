import { accessKeyStubStatic, accessKeyStubs } from 'src/access-key/stubs';
import { userStubStatic, usersWithExpensesStubStatic } from '../../user/stubs';

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
    findFirst: jest.fn().mockImplementation(() => {
      console.log({ accessKeyStubStatic });
      return accessKeyStubStatic;
    }),
    update: jest.fn().mockImplementation(() => {
      accessKeyStubStatic.isDeleted = true;
      return accessKeyStubStatic;
    }),
  },
});
