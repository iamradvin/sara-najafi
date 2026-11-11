import { Controller, Get, Header, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthRequest } from "../auth/auth.types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { AdminOrderListQueryDto } from "./admin-dashboard.dto";
import { AdminDashboardService } from "./admin-dashboard.service";

@Controller("admin")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("INSTRUCTOR", "SUPER_ADMIN")
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get("dashboard")
  @Header("Cache-Control", "private, no-store, max-age=0")
  dashboardSummary(@CurrentUser() user: AuthRequest["user"]) {
    return this.dashboard.getSummary(user!.id, user!.roles.includes("SUPER_ADMIN"));
  }

  @Get("orders")
  @Header("Cache-Control", "private, no-store, max-age=0")
  @Header("Pragma", "no-cache")
  @Roles("SUPER_ADMIN")
  listOrders(@Query() query: AdminOrderListQueryDto) {
    return this.dashboard.listOrders(query);
  }
}
