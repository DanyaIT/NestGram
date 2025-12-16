import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload, AuthenticatedRequest } from '../types/jwt';

export const User = createParamDecorator(
  (key: keyof JwtPayload, ctx: ExecutionContext) => {
    const { user } = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return user[key];
  },
);
