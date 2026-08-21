export enum PortalRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  VENDOR = "VENDOR",
}

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
}

export enum OrganizationType {
  CUSTOMER = "CUSTOMER",
  VENDOR = "VENDOR",
}

export enum OrganizationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthMe = {
  id: string;
  email: string;
  portal: PortalRole;
  status: UserStatus;
  organizationId: string | null;
};

export type RegisterBody = {
  email: string;
  password: string;
  legalName: string;
  displayName: string;
};

export type ApprovalNotificationJob = {
  version: 1;
  approvalId: string;
  organizationId: string;
  userId: string;
  email: string;
  status: "APPROVED" | "REJECTED";
  reason?: string;
  createdAt: string;
};

export const MAIL_NOTIFICATION_QUEUE = "mail-notifications";
