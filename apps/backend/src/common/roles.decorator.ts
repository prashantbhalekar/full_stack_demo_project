import { SetMetadata } from "@nestjs/common";
import { PortalRole } from "@prisma/client";

export const ROLES_KEY = "roles";
export const Roles = (...roles: PortalRole[]) => SetMetadata(ROLES_KEY, roles);
