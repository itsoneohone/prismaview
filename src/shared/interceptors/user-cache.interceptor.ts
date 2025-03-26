import { CacheInterceptor } from '@nestjs/cache-manager';
import { Injectable, ExecutionContext, Type, mixin } from '@nestjs/common';

/**
 * CacheInterceptor that uses the user's ID to create a unique cache key for each user for a given resource type
 *
 * @param resourceType - The type of resource to cache
 * @returns The UserCacheInterceptor
 */
export function UserCacheInterceptor(
  resourceType: string,
): Type<CacheInterceptor> {
  @Injectable()
  class MixinInterceptor extends CacheInterceptor {
    trackBy(context: ExecutionContext): string {
      const request = context.switchToHttp().getRequest();
      const userId = request.user?.id;

      return `user:${userId}:${resourceType}`;
    }
  }

  return mixin(MixinInterceptor);
}
