import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetAccessKeyFromReq = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    return request.accessKey;
  },
);
