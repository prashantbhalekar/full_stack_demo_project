import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";
import { QueueService } from "./queue/queue.service";
import { PortalRole, UserStatus } from "@prisma/client";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  const pendingPassword = "ChangeMe123!";
  const pendingHash = bcrypt.hashSync(pendingPassword, 10);

  const prismaMock = {
    user: {
      findUnique: jest.fn(
        async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email === "pending@example.com") {
            return {
              id: "u-pending",
              email: "pending@example.com",
              passwordHash: pendingHash,
              portal: PortalRole.CUSTOMER,
              status: UserStatus.PENDING,
              organizationId: "o-pending",
            };
          }

          if (where.id === "u-active") {
            return {
              id: "u-active",
              email: "active@example.com",
              passwordHash: pendingHash,
              portal: PortalRole.CUSTOMER,
              status: UserStatus.ACTIVE,
              organizationId: "o-active",
            };
          }

          return null;
        },
      ),
    },
    refreshTokenSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    organizationApproval: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    organization: {
      update: jest.fn(),
      create: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const queueMock = {
    enqueueApprovalNotification: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.JWT_ACCESS_TTL = "15m";
    process.env.JWT_REFRESH_TTL = "7d";
    process.env.REDIS_URL = "redis://localhost:6380";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(QueueService)
      .useValue(queueMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health returns ok", async () => {
    await request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect({ status: "ok" });
  });

  it("GET /api/dashboard without token is unauthorized", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/dashboard")
      .expect(401);
    expect(res.body.message).toBe("Missing bearer token");
  });

  it("POST /api/auth/login blocks pending users", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "pending@example.com", password: pendingPassword })
      .expect(403);

    expect(res.body.code).toBe("PENDING_APPROVAL");
  });
});
