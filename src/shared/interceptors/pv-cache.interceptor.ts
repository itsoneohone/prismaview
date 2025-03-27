import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PVCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();

    // Get the default cache key (URL + Query Params)
    const defaultCacheKey = super.trackBy(context);

    // Get the user ID from the request
    const userId = request.user?.id;

    // If user ID exists, append it to the cache key
    return userId ? `user-${userId}:${defaultCacheKey}` : defaultCacheKey;
  }
}
