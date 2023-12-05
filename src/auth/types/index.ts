import { RoleEnum } from '@prisma/client';
import { Session } from 'express-session';

export type UserSessionData = {
  id: number;
  email: string;
  role: RoleEnum;
};

export type UserSession = Session & Record<'user', UserSessionData>;
