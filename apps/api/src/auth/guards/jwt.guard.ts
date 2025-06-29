import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Request } from 'express';
import { Observable, from, map } from 'rxjs';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Public route, allow access to all users
    const isPublicRoute = this.reflector.getAllAndOverride('PUBLIC_ROUTE', [
      context.getClass(),
      context.getHandler(),
    ]);

    if (isPublicRoute) {
      return true;
    }

    // The AuthGuard('jwt') will run the jwt strategy to extract the Bearer token, validate the user and add the user to the request.
    return from(Promise.resolve(super.canActivate(context))).pipe(
      /* eslint-disable @typescript-eslint/no-unused-vars */
      map((result: any) => {
        // Allow access only to admins
        const isAdminRoute = this.reflector.getAllAndOverride<string>(
          'ADMIN_ONLY',
          [context.getHandler(), context.getClass()],
        );

        // Allow access only to authenticated users
        const request = context.switchToHttp().getRequest() as Request;
        const user = request.user as User;

        // If this is an admin route and the user doesn't have an ADMIN role, do not grant access
        if (isAdminRoute && user.role !== 'ADMIN') {
          throw new UnauthorizedException('Reserved for admins.');
        }

        // Grant access to an authenticated user or admin
        return true;
      }),
    );
  }
}
