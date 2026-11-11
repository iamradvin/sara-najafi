import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;
  private readonly keyPrefix = "attractory:";
  readonly isEnabled: boolean;

  constructor(config: ConfigService) {
    this.isEnabled = config.get<boolean>("REDIS_ENABLED", true);
    this.client = this.isEnabled
      ? new Redis(config.getOrThrow<string>("REDIS_URL"), {
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          enableOfflineQueue: false,
        })
      : null;
    this.client?.on("error", (error: Error) => {
      this.logger.error("Redis connection error", error.stack);
    });
  }

  async onModuleInit() {
    if (this.client) await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client && this.client.status !== "end") await this.client.quit();
  }

  ping(): Promise<string> {
    return this.requireClient().ping();
  }

  get(key: string): Promise<string | null> {
    return this.requireClient().get(this.keyPrefix + key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.requireClient();
    if (ttlSeconds === undefined) {
      await client.set(this.keyPrefix + key, value);
      return;
    }
    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new RangeError("Redis TTL must be a positive integer number of seconds.");
    }
    await client.set(this.keyPrefix + key, value, "EX", ttlSeconds);
  }

  delete(key: string): Promise<number> {
    return this.requireClient().del(this.keyPrefix + key);
  }

  private requireClient(): Redis {
    if (!this.client) throw new Error("Redis is disabled for this API instance.");
    return this.client;
  }
}
