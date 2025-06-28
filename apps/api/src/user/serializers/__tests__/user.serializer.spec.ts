import {
  serializeUser,
  serializeUserForPublic,
  serializeUserForSelf,
} from '@user/serializers';
import { UserWithSettings, SerializationLevel } from '@user/types';
import {
  UserWithSettingsStub,
  UserWithMultipleSettingsStub,
} from '@user/stubs';
import { FiatCurrency } from '@/shared/constants';

describe('UserSerializer', () => {
  const userId = 1;
  const mockUser: UserWithSettings = UserWithSettingsStub(1);
  const mockUserWithMultipleSettings: UserWithSettings =
    UserWithMultipleSettingsStub(userId);

  describe('serializeUser', () => {
    it('should serialize user for public view', () => {
      const result = serializeUser(mockUser, SerializationLevel.PUBLIC);

      expect(result).toEqual({
        id: 1,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });

      // Should not include sensitive information
      expect(result.email).toBeUndefined();
      expect(result.userSettings).toBeUndefined();
    });

    it('should serialize user for private view', () => {
      const result = serializeUser(mockUser, SerializationLevel.PRIVATE);

      expect(result).toEqual({
        id: 1,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        userSettings: {
          base_currency: FiatCurrency.USD,
        },
      });

      // Should include all information
      expect(result.email).toBe(mockUser.email);
      expect(result.userSettings).toEqual({ base_currency: FiatCurrency.USD });
    });

    it('should serialize user with multiple settings as dictionary', () => {
      const result = serializeUser(
        mockUserWithMultipleSettings,
        SerializationLevel.PRIVATE,
      );

      expect(result.userSettings).toEqual({
        base_currency: FiatCurrency.USD,
        THEME: 'dark',
        LANGUAGE: 'en',
      });
    });

    it('should default to public serialization when no level is specified', () => {
      const result = serializeUser(mockUser);

      expect(result.email).toBeUndefined();
      expect(result.userSettings).toBeUndefined();
    });
  });

  describe('serializeUserForPublic', () => {
    it('should serialize user for public view', () => {
      const result = serializeUserForPublic(mockUser);

      expect(result.email).toBeUndefined();
      expect(result.userSettings).toBeUndefined();
    });
  });

  describe('serializeUserForSelf', () => {
    it('should serialize user for self view', () => {
      const result = serializeUserForSelf(mockUser);

      expect(result.email).toBe(mockUser.email);
      expect(result.userSettings).toEqual({ base_currency: FiatCurrency.USD });
    });

    it('should serialize user with multiple settings for self view', () => {
      const result = serializeUserForSelf(mockUserWithMultipleSettings);

      expect(result.userSettings).toEqual({
        base_currency: FiatCurrency.USD,
        THEME: 'dark',
        LANGUAGE: 'en',
      });
    });
  });
});
