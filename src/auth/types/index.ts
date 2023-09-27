import { Session } from 'express-session';

export type UserSessionData = {
  id: number;
  email: string;
};

export type UserSession = Session & Record<'user', UserSessionData>;
