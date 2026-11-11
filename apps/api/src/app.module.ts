import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { validateApiEnvironment } from "@attractory/config";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { CoursesModule } from "./courses/courses.module";
import { HealthModule } from "./health/health.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { OrdersModule } from "./orders/orders.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QueuesModule } from "./queues/queues.module";
import { RedisModule } from "./redis/redis.module";
import { StudentsModule } from "./students/students.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
      validate: validateApiEnvironment,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    QueuesModule,
    AuthModule,
    AdminModule,
    HealthModule,
    CoursesModule,
    EnrollmentsModule,
    OrdersModule,
    StudentsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
