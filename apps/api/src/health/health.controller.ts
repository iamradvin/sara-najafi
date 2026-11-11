import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      if (this.redis.isEnabled) await this.redis.ping();
      return {
        status: "ok",
        database: "connected",
        redis: this.redis.isEnabled ? "connected" : "disabled",
      };
    } catch (error) {
      throw new ServiceUnavailableException("A required infrastructure dependency is unavailable", {
        cause: error,
      });
    }
  }
}
