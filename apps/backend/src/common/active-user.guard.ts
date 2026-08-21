import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { RequestWithUser } from "./request-with-user";

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user.status === UserStatus.PENDING) {
      throw new ForbiddenException({ code: "PENDING_APPROVAL", message: "Your account is pending" });
    }
    if (request.user.status === UserStatus.REJECTED) {
      throw new ForbiddenException({ code: "REJECTED", message: "Your account is rejected" });
    }
    return true;
  }
}
