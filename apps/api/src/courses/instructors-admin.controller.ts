import {
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TrustedOriginGuard } from "../auth/trusted-origin.guard";

@ApiTags("Instructor administration")
@ApiCookieAuth("attractory_session")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
@Controller("admin/instructors")
export class AdminInstructorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.user.findMany({
      where: {
        status: "ACTIVE",
        roles: { some: { role: { name: "INSTRUCTOR" } } },
      },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true },
      orderBy: { name: "asc" },
    });
  }

  @Post(":userId")
  @UseGuards(TrustedOriginGuard)
  async assign(@Param("userId", ParseUUIDPipe) userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!user) throw new NotFoundException("کاربر فعال پیدا نشد.");
    const role = await this.prisma.role.upsert({
      where: { name: "INSTRUCTOR" },
      update: { description: "مدرس دوره‌های آموزشی" },
      create: { name: "INSTRUCTOR", description: "مدرس دوره‌های آموزشی" },
    });
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
    return { assigned: true };
  }

  @Delete(":userId")
  @UseGuards(TrustedOriginGuard)
  async revoke(@Param("userId", ParseUUIDPipe) userId: string) {
    const role = await this.prisma.role.findUnique({ where: { name: "INSTRUCTOR" } });
    if (!role) throw new NotFoundException("نقش مدرس پیدا نشد.");
    const owned = await this.prisma.course.count({
      where: { instructorId: userId, deletedAt: null },
    });
    if (owned) throw new ConflictException("ابتدا مدرس دوره‌های فعال را به مدرس دیگری منتقل کنید.");
    const removed = await this.prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });
    if (!removed.count) throw new NotFoundException("این کاربر نقش مدرس ندارد.");
    return { revoked: true };
  }
}
