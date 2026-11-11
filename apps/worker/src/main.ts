import { createServer } from "node:http";
import { Worker, type Job } from "bullmq";
import Redis from "ioredis";
import { validateWorkerEnvironment } from "@attractory/config";
import { queueNames } from "@attractory/types";
import { parseRedisUrl } from "@attractory/utils";
import { platformHealthJobSchema } from "@attractory/validators";

function log(level: "info" | "error", event: string, details: Record<string, unknown> = {}) {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...details });
  (level === "error" ? console.error : console.info)(entry);
}

type RegisteredProcessor = {
  queueName: string;
  process: (job: Job) => Promise<unknown>;
};

const processorRegistry: RegisteredProcessor[] = [
  {
    queueName: queueNames.platformHealth,
    async process(job) {
      if (job.name !== "health.check") {
        throw new Error(`Unsupported platform health job: ${job.name}`);
      }
      const payload = platformHealthJobSchema.parse(job.data);
      return {
        status: "ok",
        requestedAt: payload.requestedAt,
        processedAt: new Date().toISOString(),
      };
    },
  },
];

async function bootstrap() {
  const config = validateWorkerEnvironment(process.env);
  const connection = {
    ...parseRedisUrl(config.REDIS_URL),
    maxRetriesPerRequest: null,
  };
  const redis = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
  });
  redis.on("error", (error: Error) => {
    log("error", "redis.connection_error", { error: error.message });
  });
  await redis.connect();

  const workers = processorRegistry.map(({ queueName, process }) => {
    const worker = new Worker(queueName, process, { connection, concurrency: 2 });
    worker.on("failed", (job, error) => {
      log("error", "job.failed", {
        queue: queueName,
        jobId: job?.id,
        error: error.message,
      });
    });
    worker.on("error", (error) => {
      log("error", "worker.error", { queue: queueName, error: error.message });
    });
    return worker;
  });
  await Promise.all(workers.map((worker) => worker.waitUntilReady()));

  const healthServer = createServer((request, response) => {
    if (request.url !== "/health" || request.method !== "GET") {
      response.writeHead(404).end();
      return;
    }

    if (!workers.length || workers.some((worker) => !worker.isRunning()) || redis.status !== "ready") {
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "unavailable" }));
      return;
    }

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ status: "ok", redis: "connected", worker: "running" }));
  });

  await new Promise<void>((resolve, reject) => {
    healthServer.once("error", reject);
    healthServer.listen(config.WORKER_HEALTH_PORT, "0.0.0.0", () => {
      healthServer.removeListener("error", reject);
      resolve();
    });
  });
  log("info", "worker.ready", { healthPort: config.WORKER_HEALTH_PORT });

  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    const closeHealthServer = new Promise<void>((resolve, reject) => {
      healthServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    await Promise.all([closeHealthServer, ...workers.map((worker) => worker.close()), redis.quit()]);
    log("info", "worker.stopped");
  };
  const handleShutdown = (signal: NodeJS.Signals) => {
    log("info", "worker.shutdown_requested", { signal });
    void shutdown().catch((error: unknown) => {
      log("error", "worker.shutdown_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exitCode = 1;
    });
  };
  process.once("SIGTERM", () => handleShutdown("SIGTERM"));
  process.once("SIGINT", () => handleShutdown("SIGINT"));
}

void bootstrap().catch((error: unknown) => {
  log("error", "worker.start_failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
