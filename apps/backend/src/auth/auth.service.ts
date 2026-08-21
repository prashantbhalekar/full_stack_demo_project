import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApprovalStatus,
  OrganizationStatus,
  OrganizationType,
  PortalRole,
  Prisma,
  UserStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import crypto from "node:crypto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { AuditService } from "../audit/audit.service";

function parseTtlMs(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid TTL format: ${ttl}`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * unitMs[unit];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private async issueTokens(userId: string, portal: PortalRole) {
    const refreshTtl = this.configService.getOrThrow<string>("JWT_REFRESH_TTL");
    const accessTtl = this.configService.getOrThrow<string>("JWT_ACCESS_TTL");
    const refreshSecret =
      this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    const accessTtlSeconds = Math.floor(parseTtlMs(accessTtl) / 1000);
    const refreshTtlSeconds = Math.floor(parseTtlMs(refreshTtl) / 1000);

    const accessToken = await this.jwtService.signAsync(
      { sub: userId, portal },
      { expiresIn: accessTtlSeconds },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      { secret: refreshSecret, expiresIn: refreshTtlSeconds },
    );

    const expiresAt = new Date(Date.now() + parseTtlMs(refreshTtl));

    const session = await this.prisma.refreshTokenSession.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken, sessionId: session.id };
  }

  async registerCustomer(dto: RegisterDto) {
    return this.register(dto, PortalRole.CUSTOMER, OrganizationType.CUSTOMER);
  }

  async registerVendor(dto: RegisterDto) {
    return this.register(dto, PortalRole.VENDOR, OrganizationType.VENDOR);
  }

  private async register(
    dto: RegisterDto,
    portal: PortalRole,
    type: OrganizationType,
  ) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            portal,
            status: UserStatus.PENDING,
          },
        });

        const organization = await tx.organization.create({
          data: {
            type,
            legalName: dto.legalName,
            displayName: dto.displayName,
            status: OrganizationStatus.PENDING,
            createdByUserId: user.id,
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: { organizationId: organization.id },
        });

        const approval = await tx.organizationApproval.create({
          data: {
            organizationId: organization.id,
            status: ApprovalStatus.PENDING,
          },
        });

        return {
          userId: user.id,
          organizationId: organization.id,
          approvalId: approval.id,
        };
      },
    );

    await this.auditService.log({
      actorUserId: result.userId,
      action: "REGISTER",
      entityType: "OrganizationApproval",
      entityId: result.approvalId,
      metadata: { portal, type },
    });

    return {
      status: "PENDING",
      message: "Registration submitted for approval",
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      await this.auditService.log({
        actorUserId: user.id,
        action: "LOGIN_FAILURE",
        entityType: "User",
        entityId: user.id,
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException({
        code: "PENDING_APPROVAL",
        message: "Account is pending approval",
      });
    }
    if (user.status === UserStatus.REJECTED) {
      throw new ForbiddenException({
        code: "REJECTED",
        message: "Account was rejected",
      });
    }

    const tokens = await this.issueTokens(user.id, user.portal);

    await this.auditService.log({
      actorUserId: user.id,
      action: "LOGIN_SUCCESS",
      entityType: "User",
      entityId: user.id,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        portal: user.portal,
        status: user.status,
        organizationId: user.organizationId,
      },
    };
  }

  async refresh(dto: RefreshDto) {
    const refreshSecret =
      this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    let payload: { sub: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string }>(
        dto.refreshToken,
        {
          secret: refreshSecret,
        },
      );
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokenHash = this.hashToken(dto.refreshToken);
    const session = await this.prisma.refreshTokenSession.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException("Refresh session not found or expired");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException("User not active");
    }

    await this.prisma.refreshTokenSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.portal);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(dto: RefreshDto) {
    const refreshSecret =
      this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        dto.refreshToken,
        {
          secret: refreshSecret,
        },
      );
      const tokenHash = this.hashToken(dto.refreshToken);
      await this.prisma.refreshTokenSession.updateMany({
        where: {
          userId: payload.sub,
          tokenHash,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
      return { success: true };
    } catch {
      return { success: true };
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return {
      id: user.id,
      email: user.email,
      portal: user.portal,
      status: user.status,
      organizationId: user.organizationId,
    };
  }
}
