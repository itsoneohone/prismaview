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
