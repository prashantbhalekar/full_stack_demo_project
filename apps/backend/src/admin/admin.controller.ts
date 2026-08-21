import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AuthGuard } from "../common/auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { CurrentUser } from "../common/current-user.decorator";
import { PortalRole, User } from "@prisma/client";

@Controller("admin/approvals")
@UseGuards(AuthGuard, RolesGuard)
@Roles(PortalRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  listApprovals(@Query("status") status?: string) {
    return this.adminService.listApprovals(status);
  }

  @Post(":id/approve")
  approve(@Param("id") id: string, @CurrentUser() user: User) {
    return this.adminService.approve(id, user.id);
  }

  @Post(":id/reject")
  reject(@Param("id") id: string, @CurrentUser() user: User, @Body("reason") reason?: string) {
    return this.adminService.reject(id, user.id, reason);
  }
}
