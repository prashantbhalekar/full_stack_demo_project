import { Injectable, NotFoundException } from "@nestjs/common";
import {
  ApprovalStatus,
  OrganizationStatus,
  PortalRole,
  Prisma,
  UserStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly auditService: AuditService,
  ) {}

  async listApprovals(status?: string) {
    const normalizedStatus = status?.toUpperCase();
    const filterStatus =
      normalizedStatus &&
      Object.values(ApprovalStatus).includes(normalizedStatus as ApprovalStatus)
        ? (normalizedStatus as ApprovalStatus)
        : undefined;

    const approvals = await this.prisma.organizationApproval.findMany({
      where: filterStatus ? { status: filterStatus } : undefined,
      include: {
        organization: {
          include: {
            createdByUser: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return approvals;
  }

  async approve(approvalId: string, reviewerId: string) {
    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const approval = await tx.organizationApproval.findUnique({
          where: { id: approvalId },
          include: { organization: { include: { createdByUser: true } } },
        });

        if (!approval) {
          throw new NotFoundException("Approval not found");
        }

        if (approval.status !== ApprovalStatus.PENDING) {
          return approval;
        }

        const updatedApproval = await tx.organizationApproval.update({
          where: { id: approvalId },
          data: {
            status: ApprovalStatus.APPROVED,
            reviewedByUserId: reviewerId,
            reviewedAt: new Date(),
            reason: null,
          },
          include: { organization: { include: { createdByUser: true } } },
        });

        await tx.organization.update({
          where: { id: approval.organizationId },
          data: { status: OrganizationStatus.APPROVED },
        });

        await tx.user.updateMany({
          where: {
            organizationId: approval.organizationId,
            portal: { not: PortalRole.ADMIN },
          },
          data: { status: UserStatus.ACTIVE },
        });

        return updatedApproval;
      },
    );

    await this.auditService.log({
      actorUserId: reviewerId,
      action: "APPROVAL_APPROVED",
      entityType: "OrganizationApproval",
      entityId: result.id,
    });

    await this.queueService.enqueueApprovalNotification({
      version: 1,
      approvalId: result.id,
      organizationId: result.organizationId,
      userId: result.organization.createdByUser.id,
      email: result.organization.createdByUser.email,
      status: ApprovalStatus.APPROVED,
      createdAt: new Date().toISOString(),
    });

    return { status: "APPROVED" };
  }

  async reject(approvalId: string, reviewerId: string, reason?: string) {
    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const approval = await tx.organizationApproval.findUnique({
          where: { id: approvalId },
          include: { organization: { include: { createdByUser: true } } },
        });

        if (!approval) {
          throw new NotFoundException("Approval not found");
        }

        if (approval.status !== ApprovalStatus.PENDING) {
          return approval;
        }

        const updatedApproval = await tx.organizationApproval.update({
          where: { id: approvalId },
          data: {
            status: ApprovalStatus.REJECTED,
            reviewedByUserId: reviewerId,
            reviewedAt: new Date(),
            reason: reason ?? null,
          },
          include: { organization: { include: { createdByUser: true } } },
        });

        await tx.organization.update({
          where: { id: approval.organizationId },
          data: { status: OrganizationStatus.REJECTED },
        });

        await tx.user.updateMany({
          where: {
            organizationId: approval.organizationId,
            portal: { not: PortalRole.ADMIN },
          },
          data: { status: UserStatus.REJECTED },
        });

        return updatedApproval;
      },
    );

    await this.auditService.log({
      actorUserId: reviewerId,
      action: "APPROVAL_REJECTED",
      entityType: "OrganizationApproval",
      entityId: result.id,
      metadata: { reason: reason ?? null },
    });

    await this.queueService.enqueueApprovalNotification({
      version: 1,
      approvalId: result.id,
      organizationId: result.organizationId,
      userId: result.organization.createdByUser.id,
      email: result.organization.createdByUser.email,
      status: ApprovalStatus.REJECTED,
      reason,
      createdAt: new Date().toISOString(),
    });

    return { status: "REJECTED" };
  }
}
