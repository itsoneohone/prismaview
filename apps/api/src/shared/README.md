# Shared Components

This directory contains shared components used across the PrismaView API application, including filters and interceptors.

## Filters

### GlobalExceptionFilter

**Location**: `filters/global-exception.filter.ts`

A global exception filter that catches all unhandled exceptions across the application and provides centralized error handling.

#### Features

- **Universal Exception Catching**: Uses `@Catch()` to catch all types of exceptions
- **Exception Transformation**: Supports an optional `ExceptionTransformer` function to convert specific exceptions (like Prisma errors) into standardized `HttpException` objects
- **Consistent Response Format**: Ensures all exceptions are properly formatted with appropriate HTTP status codes
- **Centralized Error Handling**: Provides a single point for managing exception responses across the API

#### Usage

```typescript
// In app.config.ts
import { GlobalExceptionFilter } from '@shared/filters/global-exception.filter';

// Basic usage
app.useGlobalFilters(new GlobalExceptionFilter());

// With custom transformer for Prisma errors
app.useGlobalFilters(
  new GlobalExceptionFilter((exception: any) => {
    if (exception.code === 'P2002') {
      const field = exception.meta?.target?.[0] || 'unknown';
      return new BadRequestException([
        {
          field,
          error: [`${field} already exists`],
        },
      ]);
    }
    return exception;
  }),
);
```

#### Response Format

The filter returns responses in the following format:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "field": "email",
      "error": ["email already exists"]
    }
  ]
}
```

#### Best Practices

1. **Use the GlobalExceptionFilter**: Always use the global exception filter to ensure consistent error responses
2. **Custom Transformers**: Implement custom transformers for domain-specific exceptions (like Prisma errors)
3. **Validation Errors**: Ensure validation errors follow the same format as other exceptions

#### Complete Exception Handling Setup Example

```typescript
// app.config.ts
export function setupPipes(app: NestExpressApplication) {
  // Validation pipe setup
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            field: error.property,
            error: Object.values(error.constraints),
          })),
        );
      },
    }),
  );

  // Global exception filter with Prisma error handling
  app.useGlobalFilters(
    new GlobalExceptionFilter((exception: any) => {
      if (exception.code === 'P2002') {
        const field = exception.meta?.target?.[0] || 'unknown';
        return new BadRequestException([
          {
            field,
            error: [`${field} already exists`],
          },
        ]);
      }
      return exception;
    }),
  );
}
```

## Interceptors

### PVCacheInterceptor

**Location**: `interceptors/pv-cache.interceptor.ts`

A cache interceptor that extends NestJS's `CacheInterceptor` to include user-specific caching by appending the user ID to cache keys.

#### Features

- **User-Specific Caching**: Automatically includes the user ID in cache keys to prevent cache collisions between users
- **Fallback Support**: Falls back to default caching behavior when no user ID is available
- **Inherits Base Functionality**: Extends all standard cache interceptor features

#### Usage

```typescript
// Apply globally
app.useGlobalInterceptors(new PVCacheInterceptor());

// Apply to specific controllers or routes
@UseInterceptors(PVCacheInterceptor)
export class UserController {
  // Controller methods
}
```

#### Cache Key Format

- **With User ID**: `user-123:/api/orders?limit=10`
- **Without User ID**: `/api/orders?limit=10`

### PVCacheKeyInterceptor

**Location**: `interceptors/pv-cache-key.interceptor.ts`

A factory function that creates cache interceptors with resource-specific caching. This allows for more granular cache key management.

#### Features

- **Resource-Specific Caching**: Creates cache keys that include both user ID and resource type
- **Factory Pattern**: Returns a configured interceptor class for specific resource types
- **Flexible Implementation**: Can be used to create different cache strategies for different resources

#### Usage

```typescript
// Create a cache interceptor for orders
const OrdersCacheInterceptor = PVCacheKeyInterceptor('orders');

// Apply to specific controllers
@UseInterceptors(OrdersCacheInterceptor)
export class OrderController {
  // Controller methods
}

// Create different interceptors for different resources
const UsersCacheInterceptor = PVCacheKeyInterceptor('users');
const AccessKeysCacheInterceptor = PVCacheKeyInterceptor('access-keys');
```

#### Cache Key Format

- **With User ID**: `user-123:orders:/api/orders?limit=10`
- **Without User ID**: `orders:/api/orders?limit=10`

#### Best Practices

1. **User-Specific Caching**: Always use user-specific cache interceptors to prevent data leakage between users
2. **Resource-Specific Keys**: Use `PVCacheKeyInterceptor` for different resource types to improve cache efficiency
3. **Cache Invalidation**: Implement proper cache invalidation strategies when data is updated
4. **Selective Caching**: Apply caching only to endpoints that benefit from it
5. **Cache Duration**: Set appropriate cache TTL values based on data volatility
6. **Memory Usage**: Monitor cache memory usage and adjust cache sizes accordingly

#### Controller with Caching Example

```typescript
// order.controller.ts
@Controller('orders')
@UseInterceptors(PVCacheKeyInterceptor('orders'))
export class OrderController {
  @Get()
  async getOrders(@Query() paginate: PaginateDto) {
    // This will be cached with key: user-123:orders:/orders?limit=10
    return this.orderService.getOrders(paginate);
  }
}
```
