import { accessKeyStubStatic, accessKeyStubs } from 'src/access-key/stubs';
import { userStubStatic } from '../../user/stubs';
import {
  orderStubStatic,
  orderStubs,
  updateOrderStubStatic,
} from 'src/order/stubs';

export const PrismaService = jest.fn().mockReturnValue({
  user: {
    create: jest.fn().mockImplementation(() => userStubStatic),
    findUnique: jest.fn().mockImplementation(() => userStubStatic),
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
    findFirst: jest.fn().mockImplementation(() => orderStubStatic),
    findMany: jest.fn().mockImplementation(() => orderStubs),
    count: jest.fn().mockImplementation(() => orderStubs.length),
    update: jest.fn().mockImplementation(() => updateOrderStubStatic),
  },
});
