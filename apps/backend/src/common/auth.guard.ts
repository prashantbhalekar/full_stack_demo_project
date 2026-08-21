import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { RequestWithUser } from "./request-with-user";
import { verify } from "jsonwebtoken";

type AccessPayload = {
  sub: string;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authHeader.slice(7);
    let payload: AccessPayload;
    try {
      payload = verify(
        token,
        this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      ) as AccessPayload;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    request.user = user;
    return true;
  }
}
