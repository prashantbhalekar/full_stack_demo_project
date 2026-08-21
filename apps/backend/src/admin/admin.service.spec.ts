import {
  ApprovalStatus,
  OrganizationStatus,
  PortalRole,
  UserStatus,
} from "@prisma/client";
import { AdminService } from "./admin.service";

describe("AdminService", () => {
  function createService() {
    const tx = {
      organizationApproval: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      organization: {
        update: jest.fn(),
      },
      user: {
        updateMany: jest.fn(),
      },
    } as any;

    const prisma = {
      organizationApproval: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (innerTx: any) => Promise<any>) =>
        cb(tx),
      ),
    } as any;

    const queueService = {
      enqueueApprovalNotification: jest.fn().mockResolvedValue(undefined),
    } as any;

    const auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new AdminService(prisma, queueService, auditService);
    return { service, prisma, tx, queueService, auditService };
  }

  it("approves pending approval and enqueues notification", async () => {
    const { service, tx, queueService } = createService();

    const baseApproval = {
      id: "a1",
      organizationId: "o1",
      status: ApprovalStatus.PENDING,
      organization: {
        createdByUser: { id: "u1", email: "user@example.com" },
      },
    };

    tx.organizationApproval.findUnique.mockResolvedValue(baseApproval);
    tx.organizationApproval.update.mockResolvedValue({
      ...baseApproval,
      status: ApprovalStatus.APPROVED,
    });

    const result = await service.approve("a1", "admin-1");

    expect(result).toEqual({ status: "APPROVED" });
    expect(tx.organization.update).toHaveBeenCalledWith({
      where: { id: "o1" },
      data: { status: OrganizationStatus.APPROVED },
    });
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { organizationId: "o1", portal: { not: PortalRole.ADMIN } },
      data: { status: UserStatus.ACTIVE },
    });
    expect(queueService.enqueueApprovalNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: "APPROVED", approvalId: "a1" }),
    );
  });

  it("rejects pending approval and enqueues notification", async () => {
    const { service, tx, queueService } = createService();

    const baseApproval = {
      id: "a2",
      organizationId: "o2",
      status: ApprovalStatus.PENDING,
      organization: {
        createdByUser: { id: "u2", email: "vendor@example.com" },
      },
    };

    tx.organizationApproval.findUnique.mockResolvedValue(baseApproval);
    tx.organizationApproval.update.mockResolvedValue({
      ...baseApproval,
      status: ApprovalStatus.REJECTED,
    });

    const result = await service.reject("a2", "admin-1", "Reason");

    expect(result).toEqual({ status: "REJECTED" });
    expect(tx.organization.update).toHaveBeenCalledWith({
      where: { id: "o2" },
      data: { status: OrganizationStatus.REJECTED },
    });
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: { organizationId: "o2", portal: { not: PortalRole.ADMIN } },
      data: { status: UserStatus.REJECTED },
    });
    expect(queueService.enqueueApprovalNotification).toHaveBeenCalledWith(
      expect.objectContaining({ status: "REJECTED", reason: "Reason" }),
    );
  });
});
