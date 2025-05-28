import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessKey, User } from '@prisma/client';
import { Request } from 'express';
import { Observable, from, map } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AccessKeyOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest() as Request;
    const user = request.user as User;
    const accessKeyId = parseInt(request.body.accessKeyId);

    // Get the user's access key. It's ok to get the secret as it will only be used internally and not exposed to the client.
    const getAccessKey = () =>
      this.prisma.accessKey.findFirst({
        select: {
          id: true,
          name: true,
          key: true,
          secret: true,
          exchange: true,
        },
        where: {
          userId: user.id,
          id: accessKeyId,
        },
      });

    return from(Promise.resolve(getAccessKey())).pipe(
      map((targetAccessKey: AccessKey) => {
        if (!targetAccessKey) {
          throw new UnauthorizedException('Invalid access key');
        }

        (request as any).accessKey = targetAccessKey;

        return true;
      }),
    );
  }
}
