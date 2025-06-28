import { User, UserSetting } from '@prisma/client';

export enum SerializationLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export type UserWithSettings = User & {
  userSettings: UserSetting[];
};

export type SerializedUser = {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
  userSettings?: Record<string, string>;
};

export type SerializedUserSetting = {
  id: number;
  name: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};
