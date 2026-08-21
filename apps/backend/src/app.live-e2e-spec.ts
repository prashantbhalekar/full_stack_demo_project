import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { AppModule } from "./app.module";

describe("Live approval flow (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL ||=
      "postgresql://postgres:postgres@localhost:5433/full_stack_demo";
    process.env.REDIS_URL ||= "redis://localhost:6380";
    process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
    process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
    process.env.JWT_ACCESS_TTL ||= "15m";
    process.env.JWT_REFRESH_TTL ||= "7d";
    process.env.ADMIN_EMAIL ||= "admin@example.com";
    process.env.ADMIN_PASSWORD ||= "ChangeMe123!";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("registers customer, blocks pending login, admin approves, then allows dashboard", async () => {
    const email = `live-customer-${Date.now()}@example.com`;
    const password = "ChangeMe123!";

    const registerRes = await request(app.getHttpServer())
      .post("/api/auth/register/customer")
      .send({
        email,
        password,
        legalName: "Live Customer Legal",
        displayName: "Live Customer Display",
      })
      .expect(201);

    expect(registerRes.body.status).toBe("PENDING");

    const pendingLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password })
      .expect(403);

    expect(pendingLogin.body.code).toBe("PENDING_APPROVAL");

    const adminLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: process.env.ADMIN_EMAIL ?? "admin@example.com",
        password: process.env.ADMIN_PASSWORD ?? "ChangeMe123!",
      })
      .expect(201);

    const adminAccessToken = adminLogin.body.accessToken as string;
    expect(adminAccessToken).toBeTruthy();

    const approvalsRes = await request(app.getHttpServer())
      .get("/api/admin/approvals?status=pending")
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(200);

    const approval = approvalsRes.body.find(
      (item: { organization: { createdByUser: { email: string } } }) =>
        item.organization.createdByUser.email === email,
    );
    expect(approval).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/api/admin/approvals/${approval.id}/approve`)
      .set("Authorization", `Bearer ${adminAccessToken}`)
      .expect(201);

    const activeLogin = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email, password })
      .expect(201);

    const accessToken = activeLogin.body.accessToken as string;

    const dashboardRes = await request(app.getHttpServer())
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(dashboardRes.body.dashboardPath).toBe("/dashboard/customer");
  });
});
