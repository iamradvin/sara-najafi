import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job, JobsOptions, Queue } from "bullmq";
import { QueueName, queueNames } from "@attractory/types";
import { parseRedisUrl } from "@attractory/utils";

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queues = new Map<QueueName, Queue>();
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.enabled = config.get<boolean>("REDIS_ENABLED", true);
    if (!this.enabled) return;

    const connection = {
      ...parseRedisUrl(config.getOrThrow<string>("REDIS_URL")),
      maxRetriesPerRequest: null,
    };
    for (const name of Object.values(queueNames)) {
      this.queues.set(name, new Queue(name, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1_000 },
          removeOnComplete: { age: 86_400, count: 1_000 },
          removeOnFail: { age: 604_800, count: 5_000 },
        },
      }));
    }
  }

  enqueue<T>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    if (!this.enabled) throw new Error("Queue service is disabled because Redis is disabled.");
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue "${queueName}" is not registered.`);
    return queue.add(jobName, data, options);
  }

  async onModuleDestroy() {
    await Promise.all(Array.from(this.queues.values(), (queue) => queue.close()));
  }
}
