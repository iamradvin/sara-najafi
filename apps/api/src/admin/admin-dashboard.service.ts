import { Injectable } from "@nestjs/common";
import { EnrollmentStatus, OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AdminOrderListQueryDto } from "./admin-dashboard.dto";

const activeEnrollmentWhere = (): Prisma.EnrollmentWhereInput => ({
  status: EnrollmentStatus.ACTIVE,
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
});

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, isSuperAdmin: boolean) {
    const courseScope: Prisma.CourseWhereInput = isSuperAdmin ? {} : { instructorId: userId };
    const [totalCourses, publishedCourses, activeEnrollments, activeStudents] =
      await Promise.all([
        this.prisma.course.count({
          where: { ...courseScope, deletedAt: null },
        }),
        this.prisma.course.count({
          where: { ...courseScope, status: "PUBLISHED", deletedAt: null },
        }),
        this.prisma.enrollment.count({
          where: {
            ...activeEnrollmentWhere(),
            course: { ...courseScope, deletedAt: null },
          },
        }),
        this.prisma.user.count({
          where: {
            status: "ACTIVE",
            deletedAt: null,
            roles: { some: { role: { name: "STUDENT" } } },
            ...(isSuperAdmin
              ? {}
              : {
                  enrollments: {
                    some: {
                      ...activeEnrollmentWhere(),
                      course: { ...courseScope, deletedAt: null },
                    },
                  },
                }),
          },
        }),
      ]);

    if (!isSuperAdmin) {
      return {
        isSuperAdmin,
        totalCourses,
        publishedCourses,
        activeEnrollments,
        activeStudents,
        salesToman: null,
        paidOrders: null,
        pendingOrders: null,
      };
    }

    const [sales, paidOrders, pendingOrders] = await Promise.all([
      this.prisma.order.aggregate({
        where: { status: OrderStatus.PAID },
        _sum: { totalToman: true },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    ]);

    return {
      isSuperAdmin,
      totalCourses,
      publishedCourses,
      activeEnrollments,
      activeStudents,
      salesToman: sales._sum.totalToman ?? 0,
      paidOrders,
      pendingOrders,
    };
  }

  async listOrders(query: AdminOrderListQueryDto) {
    const where: Prisma.OrderWhereInput = query.status ? { status: query.status } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalToman: true,
          createdAt: true,
          paidAt: true,
          user: { select: { id: true, name: true, phone: true, email: true } },
          items: { select: { courseTitle: true, unitPriceToman: true } },
          payments: {
            select: { provider: true, status: true, verifiedAt: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
}
