import { CacheInterceptor } from '@nestjs/cache-manager';
import { Injectable, ExecutionContext, Type, mixin } from '@nestjs/common';

/**
 * CacheInterceptor that uses the user's ID to create a unique cache key for each user for a
 * given resource type
 *
 * @param resourceType - The type of resource to cache
 * @returns The user and resource type cache key
 */
export function PVCacheKeyInterceptor(
  resourceType: string,
): Type<CacheInterceptor> {
  @Injectable()
  class MixinInterceptor extends CacheInterceptor {
    trackBy(context: ExecutionContext): string {
      const request = context.switchToHttp().getRequest();
      // Get the default cache key (URL + Query Params)
      const defaultCacheKey = super.trackBy(context);

      // Get the user ID from the request
      const userId = request.user?.id;

      return userId
        ? `user-${userId}:${resourceType}:${defaultCacheKey}`
        : `${resourceType}:${defaultCacheKey}`;
    }
  }

  return mixin(MixinInterceptor);
}
