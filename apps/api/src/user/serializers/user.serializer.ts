import { UserSetting } from '@prisma/client';
import {
  SerializationLevel,
  UserWithSettings,
  SerializedUser,
} from '@user/types';

/**
 * Serializes user settings into a dictionary format
 */
export const serializeUserSettings = (
  settings: UserSetting[],
): Record<string, string> => {
  return settings.reduce(
    (acc, setting) => {
      acc[setting.name] = setting.value;
      return acc;
    },
    {} as Record<string, string>,
  );
};

/**
 * Serializes a user with configurable privacy level
 */
export const serializeUser = (
  user: UserWithSettings,
  level: SerializationLevel = SerializationLevel.PUBLIC,
): SerializedUser => {
  const baseUser: SerializedUser = {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  if (level === SerializationLevel.PRIVATE) {
    // Private serializer includes all user information
    return {
      ...baseUser,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userSettings: serializeUserSettings(user.userSettings),
    };
  }

  // Public serializer includes only safe, public information
  return {
    ...baseUser,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    // Note: userSettings are not included in public serializer for privacy
  };
};

/**
 * Serializes multiple users with configurable privacy level
 */
export const serializeUsers = (
  users: UserWithSettings[],
  level: SerializationLevel = SerializationLevel.PUBLIC,
): SerializedUser[] => {
  return users.map((user) => serializeUser(user, level));
};

/**
 * Serializes user for admin view (includes all information)
 */
export const serializeUserForAdmin = (
  user: UserWithSettings,
): SerializedUser => {
  return serializeUser(user, SerializationLevel.PRIVATE);
};

/**
 * Serializes user for public view (limited information)
 */
export const serializeUserForPublic = (
  user: UserWithSettings,
): SerializedUser => {
  return serializeUser(user, SerializationLevel.PUBLIC);
};

/**
 * Serializes user for self view (private information)
 */
export const serializeUserForSelf = (
  user: UserWithSettings,
): SerializedUser => {
  return serializeUser(user, SerializationLevel.PRIVATE);
};
