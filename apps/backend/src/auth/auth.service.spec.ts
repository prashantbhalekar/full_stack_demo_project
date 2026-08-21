import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { PortalRole, UserStatus } from "@prisma/client";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  function createService(overrides?: {
    findUnique?: jest.Mock;
    compare?: jest.Mock;
    issueTokens?: jest.Mock;
  }) {
    const prisma = {
      user: {
        findUnique: overrides?.findUnique ?? jest.fn(),
      },
      refreshTokenSession: {
        create: jest.fn().mockResolvedValue({ id: "session-1" }),
      },
      $transaction: jest.fn(),
    } as any;

    const jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce("refresh-token"),
      verifyAsync: jest.fn(),
    } as any;

    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const map: Record<string, string> = {
          JWT_ACCESS_TTL: "15m",
          JWT_REFRESH_TTL: "7d",
          JWT_REFRESH_SECRET: "refresh-secret",
        };
        return map[key] ?? "fallback";
      }),
    } as any;

    const auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new AuthService(
      prisma,
      jwtService,
      configService,
      auditService,
    );

    if (overrides?.issueTokens) {
      (service as any).issueTokens = overrides.issueTokens;
    }

    return { service, prisma, auditService };
  }

  it("blocks pending users on login", async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "user@example.com",
      passwordHash: "hash",
      portal: PortalRole.CUSTOMER,
      status: UserStatus.PENDING,
      organizationId: "o1",
    });

    const bcrypt = await import("bcryptjs");
    jest.spyOn(bcrypt.default, "compare").mockResolvedValue(true as never);

    await expect(
      service.login({ email: "user@example.com", password: "ChangeMe123!" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("blocks rejected users on login", async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u2",
      email: "rej@example.com",
      passwordHash: "hash",
      portal: PortalRole.VENDOR,
      status: UserStatus.REJECTED,
      organizationId: "o2",
    });

    const bcrypt = await import("bcryptjs");
    jest.spyOn(bcrypt.default, "compare").mockResolvedValue(true as never);

    await expect(
      service.login({ email: "rej@example.com", password: "ChangeMe123!" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns tokens for active users", async () => {
    const issueTokens = jest.fn().mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      sessionId: "s1",
    });

    const { service, prisma } = createService({ issueTokens });
    prisma.user.findUnique.mockResolvedValue({
      id: "u3",
      email: "active@example.com",
      passwordHash: "hash",
      portal: PortalRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      organizationId: "o3",
    });

    const bcrypt = await import("bcryptjs");
    jest.spyOn(bcrypt.default, "compare").mockResolvedValue(true as never);

    const result = await service.login({
      email: "active@example.com",
      password: "ChangeMe123!",
    });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.user.status).toBe(UserStatus.ACTIVE);
  });

  it("throws unauthorized for unknown user", async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: "missing@example.com", password: "ChangeMe123!" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
