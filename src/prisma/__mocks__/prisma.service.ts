import { accessKeyStubStatic } from 'src/access-keys/stubs';
import { userStubStatic, usersWithExpensesStubStatic } from '../../user/stubs';

export const PrismaService = jest.fn().mockReturnValue({
  user: {
    findUnique: jest.fn().mockImplementation(() => userStubStatic),
    // findMany: jest.fn().mockResolvedValue(UsersWithExpensesStubStatic()),
    findMany: jest.fn().mockImplementation(() => usersWithExpensesStubStatic),
    update: jest.fn().mockImplementation(() => undefined),
  },
  accessKey: {
    create: jest.fn().mockImplementation(() => accessKeyStubStatic),
  },
});
