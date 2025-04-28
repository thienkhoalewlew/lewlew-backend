import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { IUserResponse } from 'src/users/interfaces/user-response.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IUserResponse => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    const userObj = JSON.parse(JSON.stringify(request.user));
    const { password: _, ...userWithoutPassword } = userObj;
    return userWithoutPassword as IUserResponse;
  },
);
