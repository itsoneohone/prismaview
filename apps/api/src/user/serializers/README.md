# User Serializer

This module provides a functional approach to serializing user data with different privacy levels.

## Overview

The user serializer system allows you to safely return user information with configurable privacy levels. It handles both public and private user data, including user settings.

## Usage

### Basic Serialization

```typescript
import {
  serializeUser,
  serializeUserForPublic,
  serializeUserForSelf,
} from '@user/serializers';
import { SerializationLevel } from '@user/types';

// Serialize with specific privacy level using enum
const publicUser = serializeUser(user, SerializationLevel.PUBLIC);
const privateUser = serializeUser(user, SerializationLevel.PRIVATE);

// Use convenience functions
const publicUser = serializeUserForPublic(user);
const selfUser = serializeUserForSelf(user);
```

### Privacy Levels

#### Public (`SerializationLevel.PUBLIC`)

- **Included**: `id`, `firstName`, `lastName`, `role`, `createdAt`, `updatedAt`
- **Excluded**: `email`, `userSettings`, `hash`

#### Private (`SerializationLevel.PRIVATE`)

- **Included**: All public fields plus `email`, `userSettings`
- **Excluded**: `hash` (password hash is never serialized)

### Serializing Multiple Users

```typescript
import { serializeUsers } from '@user/serializers';
import { SerializationLevel } from '@user/types';

const publicUsers = serializeUsers(users, SerializationLevel.PUBLIC);
const privateUsers = serializeUsers(users, SerializationLevel.PRIVATE);
```

### User Settings

User settings are automatically serialized when using the private serializer. Settings are returned as a dictionary where the key is the setting name and the value is the setting value:

```typescript
// Settings are included in private serialization
const userWithSettings = serializeUserForSelf(user);
// userWithSettings.userSettings will be:
// {
//   base_currency: 'USD',
//   THEME: 'dark',
//   LANGUAGE: 'en'
// }
```

## API Endpoints

The following endpoints use the serializer system:

- `GET /user/me` - Returns private user data (self view)
- `GET /user/:id` - Returns public user data
- `GET /user/admin/:id` - Returns private user data (admin view)
- `GET /user/all` - Returns public data for all users (admin only)

## Types

All types are defined in `@user/types`:

```typescript
enum SerializationLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

type SerializedUser = {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
  userSettings?: Record<string, string>;
};

type UserWithSettings = User & {
  userSettings: UserSetting[];
};
```

## Security

- The `hash` field (password hash) is never included in serialized output
- Public serialization excludes sensitive information like email
- User settings are only included in private serialization
- All serialization is done through the functional approach for consistency
- Type safety is enforced through the `SerializationLevel` enum
