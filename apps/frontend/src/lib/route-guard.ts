import { PortalRole, UserStatus } from "@full-stack-demo/shared-types";

export function resolveUserRoute(status: UserStatus, portal: PortalRole): string {
  if (status === UserStatus.PENDING) {
    return "/pending-approval";
  }
  if (status === UserStatus.REJECTED) {
    return "/rejected";
  }
  if (portal === PortalRole.ADMIN) {
    return "/dashboard/admin";
  }
  if (portal === PortalRole.CUSTOMER) {
    return "/dashboard/customer";
  }
  return "/dashboard/vendor";
}
