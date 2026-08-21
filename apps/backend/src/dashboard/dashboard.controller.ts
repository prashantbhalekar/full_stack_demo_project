import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/auth.guard";
import { ActiveUserGuard } from "../common/active-user.guard";
import { CurrentUser } from "../common/current-user.decorator";
import { User } from "@prisma/client";

@Controller("dashboard")
@UseGuards(AuthGuard, ActiveUserGuard)
export class DashboardController {
  @Get()
  dashboard(@CurrentUser() user: User) {
    return {
      message: `Welcome ${user.portal}`,
      role: user.portal,
      dashboardPath: `/dashboard/${user.portal.toLowerCase()}`,
    };
  }
}
