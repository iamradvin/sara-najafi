import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { Queue, QueueEvents } from "bullmq";
import { queueNames } from "@attractory/types";
import { parseRedisUrl } from "@attractory/utils";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const testRedisUrl = process.env.TEST_REDIS_URL;
const webOrigin = "http://localhost:3000";
const stagingOtpPhone = `091${randomUUID().replaceAll("-", "").slice(0, 8)}`;
const stagingOtpCode = "638417";
const stagingOtpSecret = randomBytes(32).toString("hex");
const prisma = new PrismaClient(
  testDatabaseUrl ? { datasources: { db: { url: testDatabaseUrl } } } : undefined,
);

let apiProcess;
let workerProcess;
let apiOutput = "";
let workerOutput = "";
let apiBaseUrl;
let workerBaseUrl;
let uploadDir;
let testUser;
let studentCookie;
let healthQueue;
let healthQueueEvents;

function assertIsolatedTargets() {
  if (!testDatabaseUrl || !testRedisUrl) {
    throw new Error(
      "Set TEST_DATABASE_URL to an isolated database ending in _test and TEST_REDIS_URL to a dedicated nonzero Redis database.",
    );
  }
  const database = new URL(testDatabaseUrl);
  const databaseName = decodeURIComponent(database.pathname.slice(1));
  if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
    throw new Error("TEST_DATABASE_URL must target a local test service.");
  }
  if (!/(?:^|[_-])test$/i.test(databaseName)) {
    throw new Error("TEST_DATABASE_URL must target a database whose name ends in _test or -test.");
  }
  const redis = new URL(testRedisUrl);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(redis.hostname)) {
    throw new Error("TEST_REDIS_URL must target a local test service.");
  }
  const redisDatabase = Number(redis.pathname.slice(1));
  if (!Number.isInteger(redisDatabase) || redisDatabase < 1) {
    throw new Error("TEST_REDIS_URL must select a dedicated Redis database number greater than zero.");
  }
}

function sanitizedOutput(value) {
  return value
    .replaceAll(testDatabaseUrl ?? "", "[redacted database URL]")
    .replaceAll(testRedisUrl ?? "", "[redacted Redis URL]")
    .replace(/(?:postgres(?:ql)?|redis):\/\/[^\s"'`]+/gi, "[redacted service URL]");
}

function migrateTestDatabase() {
  const result = spawnSync(
    "pnpm",
    ["--filter", "@attractory/api", "db:migrate:deploy"],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      encoding: "utf8",
    },
  );
  if (result.error || result.status !== 0) {
    throw new Error(
      `Could not apply migrations to the isolated integration database (exit ${result.status}).\n${sanitizedOutput(`${result.stdout ?? ""}\n${result.stderr ?? ""}`)}`,
      { cause: result.error },
    );
  }
}

async function findAvailablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function waitForApi() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null || apiProcess.signalCode !== null) {
      throw new Error(`API exited before becoming healthy.\n${sanitizedOutput(apiOutput)}`);
    }
    try {
      const response = await fetch(`${apiBaseUrl}/health`, {
        signal: AbortSignal.timeout(1_500),
      });
      if (response.ok) return;
      await delay(250);
    } catch {
      await delay(250);
    }
  }
  throw new Error(`API did not become healthy within 30 seconds.\n${sanitizedOutput(apiOutput)}`);
}

async function waitForWorker() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (workerProcess.exitCode !== null || workerProcess.signalCode !== null) {
      throw new Error(`Worker exited before becoming healthy.\n${sanitizedOutput(workerOutput)}`);
    }
    try {
      const response = await fetch(`${workerBaseUrl}/health`, {
        signal: AbortSignal.timeout(1_500),
      });
      if (response.ok) return;
      await delay(250);
    } catch {
      await delay(250);
    }
  }
  throw new Error(`Worker did not become healthy within 30 seconds.\n${sanitizedOutput(workerOutput)}`);
}

async function stopChild(child, name, output) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => {
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
  child.kill("SIGTERM");
  const result = await Promise.race([exited, delay(10_000).then(() => null)]);
  if (result === null) {
    child.kill("SIGKILL");
    throw new Error(`${name} did not exit after SIGTERM.\n${sanitizedOutput(output)}`);
  }
  assert.equal(result.code, 0, `${name} exited with ${result.signal ?? result.code}.\n${sanitizedOutput(output)}`);
}

async function request(pathname, { method = "GET", body, cookie, origin = webOrigin } = {}) {
  const headers = { origin };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  return fetch(`${apiBaseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5_000),
  });
}

function cookieToken(cookie) {
  return cookie.slice("attractory_session=".length);
}

async function createTestSession(userId) {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return `attractory_session=${token}`;
}

async function createTestAccount(name, roleName = "STUDENT", phone = `+989${randomUUID().replaceAll("-", "").slice(0, 9)}`) {
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: { name: roleName, description: "Integration test role" },
  });
  const user = await prisma.user.create({
    data: {
      phone,
      name,
      roles: { create: { roleId: role.id } },
    },
    include: { roles: { include: { role: true } } },
  });
  return { user, cookie: await createTestSession(user.id) };
}

before(async () => {
  assertIsolatedTargets();
  migrateTestDatabase();
  uploadDir = await mkdtemp(path.join(tmpdir(), "attractory-api-test-"));
  const port = await findAvailablePort();
  const workerPort = await findAvailablePort();
  apiBaseUrl = `http://127.0.0.1:${port}/api/v1`;
  workerBaseUrl = `http://127.0.0.1:${workerPort}`;
  apiProcess = spawn("node", ["apps/api/dist/src/main.js"], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      NODE_ENV: "production",
      DATABASE_URL: testDatabaseUrl,
      REDIS_URL: testRedisUrl,
      API_PORT: String(port),
      WEB_ORIGIN: webOrigin,
      COURSE_UPLOAD_DIR: uploadDir,
      APP_ENV: "staging",
      STAGING_FIXED_OTP_ENABLED: "true",
      STAGING_FIXED_OTP_PHONE: stagingOtpPhone,
      STAGING_FIXED_OTP_CODE: stagingOtpCode,
      AUTH_OTP_SECRET: stagingOtpSecret,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  apiProcess.stdout.on("data", (chunk) => {
    apiOutput = (apiOutput + chunk.toString()).slice(-12_000);
  });
  apiProcess.stderr.on("data", (chunk) => {
    apiOutput = (apiOutput + chunk.toString()).slice(-12_000);
  });
  await waitForApi();

  workerProcess = spawn("node", ["apps/worker/dist/main.js"], {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      NODE_ENV: "production",
      REDIS_URL: testRedisUrl,
      WORKER_HEALTH_PORT: String(workerPort),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  workerProcess.stdout.on("data", (chunk) => {
    workerOutput = (workerOutput + chunk.toString()).slice(-12_000);
  });
  workerProcess.stderr.on("data", (chunk) => {
    workerOutput = (workerOutput + chunk.toString()).slice(-12_000);
  });
  await waitForWorker();

  const redisConnection = {
    ...parseRedisUrl(testRedisUrl),
    maxRetriesPerRequest: null,
  };
  healthQueue = new Queue(queueNames.platformHealth, { connection: redisConnection });
  healthQueueEvents = new QueueEvents(queueNames.platformHealth, { connection: redisConnection });
  await Promise.all([healthQueue.waitUntilReady(), healthQueueEvents.waitUntilReady()]);
});

after(async () => {
  if (healthQueueEvents) await healthQueueEvents.close();
  if (healthQueue) await healthQueue.close();
  await stopChild(workerProcess, "Worker", workerOutput);
  await stopChild(apiProcess, "API", apiOutput);
  await prisma.$disconnect();
  if (uploadDir) await rm(uploadDir, { recursive: true, force: true });
});

test("API integration against isolated PostgreSQL and Redis", async (t) => {
  await t.test("health endpoint confirms PostgreSQL and Redis connectivity", async () => {
    const response = await request("/health");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "ok",
      database: "connected",
      redis: "connected",
    });
    const workerResponse = await fetch(`${workerBaseUrl}/health`);
    assert.equal(workerResponse.status, 200);
    assert.deepEqual(await workerResponse.json(), {
      status: "ok",
      redis: "connected",
      worker: "running",
    });
  });

  await t.test("worker consumes the platform health-check job", async () => {
    const job = await healthQueue.add("health.check", {
      kind: "health.check",
      requestedAt: new Date().toISOString(),
    });
    const result = await job.waitUntilFinished(healthQueueEvents, 10_000);
    assert.equal(result.status, "ok");
    assert.equal(result.requestedAt, job.data.requestedAt);
    assert.ok(Date.parse(result.processedAt));
  });

  await t.test("email and password authentication endpoints are unavailable", async () => {
    const registration = await request("/auth/register", {
      method: "POST",
      body: { name: "A", email: "not-an-email", password: "short" },
    });
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: "user@example.test", password: "password" },
    });
    assert.equal(registration.status, 404);
    assert.equal(login.status, 404);
  });

  await t.test("login with an unregistered phone asks the user to register without creating an OTP", async () => {
    const phone = `091${randomUUID().replaceAll("-", "").slice(0, 8)}`;
    const response = await request("/auth/otp/request", {
      method: "POST",
      body: { phone, mode: "login" },
    });
    assert.equal(response.status, 409);
    assert.match((await response.json()).message, /ثبت‌نام/);
    assert.equal(
      await prisma.smsOtpChallenge.findUnique({
        where: { phone: `+98${phone.slice(1)}` },
      }),
      null,
    );
  });

  await t.test("untrusted browser origins cannot mutate authentication state", async () => {
    const response = await request("/auth/otp/request", {
      method: "POST",
      origin: "https://untrusted.example",
      body: { phone: "09123456789", mode: "login" },
    });
    assert.equal(response.status, 403);
  });

  await t.test("protected and role-restricted routes reject unauthenticated access", async () => {
    assert.equal((await request("/auth/me")).status, 401);
    assert.equal((await request("/auth/admin-check")).status, 401);
  });

  await t.test("phone-only accounts and database sessions authenticate", async () => {
    const account = await createTestAccount("Integration Student");
    testUser = account.user;
    studentCookie = account.cookie;
    const rawToken = cookieToken(studentCookie);
    const databaseUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: { sessions: true },
    });
    assert.equal(databaseUser.email, null);
    assert.equal(databaseUser.passwordHash, null);
    assert.match(databaseUser.phone, /^\+989\d{9}$/);
    assert.deepEqual(databaseUser.roles.map(({ role: item }) => item.name), ["STUDENT"]);
    assert.equal(databaseUser.sessions.length, 1);
    assert.equal(databaseUser.sessions[0].tokenHash, createHash("sha256").update(rawToken).digest("hex"));
    assert.equal(databaseUser.sessions[0].revokedAt, null);
    assert.ok(
      Math.abs(databaseUser.sessions[0].expiresAt.getTime() - Date.now() - 7 * 24 * 60 * 60 * 1000) < 5_000,
    );
    const authenticated = await request("/auth/me", { cookie: studentCookie });
    assert.equal(authenticated.status, 200);
    assert.equal((await authenticated.json()).id, testUser.id);
  });

  await t.test("phone-authenticated sessions retain role restrictions", async () => {
    assert.equal((await request("/auth/student-check", { cookie: studentCookie })).status, 200);
    assert.equal((await request("/auth/admin-check", { cookie: studentCookie })).status, 403);
    assert.equal((await request("/admin/dashboard", { cookie: studentCookie })).status, 403);
    assert.equal((await request("/admin/orders", { cookie: studentCookie })).status, 403);
  });

  await t.test("staging fixed OTP authenticates only the configured admin account", async () => {
    const phone = `+98${stagingOtpPhone.slice(1)}`;
    await createTestAccount("Staging Admin", "SUPER_ADMIN", phone);

    const challenge = await request("/auth/otp/request", {
      method: "POST",
      body: { phone: stagingOtpPhone, mode: "login" },
    });
    assert.equal(challenge.status, 201);

    const verified = await request("/auth/otp/verify", {
      method: "POST",
      body: { phone: stagingOtpPhone, code: stagingOtpCode, mode: "login" },
    });
    assert.equal(verified.status, 201);
    const user = await verified.json();
    assert.ok(user.roles.includes("SUPER_ADMIN"));

    const cookie = verified.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    assert.equal((await request("/auth/admin-check", { cookie })).status, 200);

    const replay = await request("/auth/otp/verify", {
      method: "POST",
      body: { phone: stagingOtpPhone, code: stagingOtpCode, mode: "login" },
    });
    assert.equal(replay.status, 401);

    const otherPhone = `091${randomUUID().replaceAll("-", "").slice(0, 8)}`;
    const outsideTarget = await request("/auth/otp/verify", {
      method: "POST",
      body: { phone: otherPhone, code: stagingOtpCode, mode: "login" },
    });
    assert.equal(outsideTarget.status, 401);
  });

  await t.test("profile can be read and safely updated by its owner", async () => {
    const profile = await request("/auth/profile", { cookie: studentCookie });
    assert.equal(profile.status, 200);
    assert.equal((await profile.json()).id, testUser.id);

    const blocked = await request("/auth/profile", {
      method: "PATCH",
      cookie: studentCookie,
      origin: "https://untrusted.example",
      body: { name: "Changed Name", bio: "Changed bio" },
    });
    assert.equal(blocked.status, 403);

    const updated = await request("/auth/profile", {
      method: "PATCH",
      cookie: studentCookie,
      body: { name: "Updated Integration Student", bio: "A short profile description." },
    });
    assert.equal(updated.status, 200);
    const updatedProfile = await updated.json();
    assert.equal(updatedProfile.name, "Updated Integration Student");
    assert.equal(updatedProfile.bio, "A short profile description.");
    assert.equal(updatedProfile.phone, testUser.phone);
  });

  await t.test("logout revokes only the selected session", async () => {
    const cookie = await createTestSession(testUser.id);
    const sessionHash = createHash("sha256").update(cookieToken(cookie)).digest("hex");

    assert.equal((await request("/auth/logout", { method: "POST", cookie })).status, 201);
    assert.equal((await request("/auth/me", { cookie })).status, 401);
    assert.equal((await request("/auth/me", { cookie: studentCookie })).status, 200);
    const session = await prisma.session.findUnique({ where: { tokenHash: sessionHash } });
    assert.ok(session.revokedAt);
  });

  let educationalCourse;
  let integrationAdminCookie;
  await t.test("course management enforces ownership and supports review/publish workflows", async (t) => {
    const instructor = await createTestAccount("Integration Instructor", "INSTRUCTOR");
    const otherInstructor = await createTestAccount("Other Integration Instructor", "INSTRUCTOR");
    const admin = await createTestAccount("Integration Admin", "SUPER_ADMIN");
    integrationAdminCookie = admin.cookie;
    await t.test("admin dashboard and order reporting use live records", async () => {
      const summary = await request("/admin/dashboard", { cookie: admin.cookie });
      assert.equal(summary.status, 200);
      assert.equal(typeof (await summary.json()).totalCourses, "number");
      const orders = await request("/admin/orders?limit=5", { cookie: admin.cookie });
      assert.equal(orders.status, 200);
      assert.ok(Array.isArray((await orders.json()).data));
    });
    const courseSlug = `integration-course-${randomUUID()}`;
    const createResponse = await request("/admin/courses", {
      method: "POST",
      cookie: instructor.cookie,
      body: {
        slug: courseSlug,
        title: "Integration Learning Course",
        description: "A test course with enough descriptive text.",
        isFree: true,
        estimatedMinutes: 20,
        category: { name: "Integration Learning", slug: `integration-${randomUUID()}` },
      },
    });
    assert.equal(createResponse.status, 201);
    educationalCourse = await createResponse.json();
    assert.equal(educationalCourse.status, "DRAFT");
    assert.equal(educationalCourse.instructorId, instructor.user.id);
    assert.equal(educationalCourse.categories.length, 1);
    const categories = await request("/categories/admin", { cookie: admin.cookie });
    assert.equal(categories.status, 200);
    assert.ok((await categories.json()).some(({ id }) => id === educationalCourse.categories[0].category.id));
    assert.equal((await request(`/categories/${educationalCourse.categories[0].category.id}`, {
      method: "DELETE",
      cookie: admin.cookie,
    })).status, 409);

    await t.test("another instructor cannot edit the course", async () => {
      const response = await request(`/admin/courses/${educationalCourse.id}`, {
        method: "PATCH",
        cookie: otherInstructor.cookie,
        body: { title: "Unauthorized edit" },
      });
      assert.equal(response.status, 403);
    });

    const firstModuleResponse = await request(`/modules/course/${educationalCourse.id}`, {
      method: "POST",
      cookie: instructor.cookie,
      body: { title: "First module" },
    });
    const secondModuleResponse = await request(`/modules/course/${educationalCourse.id}`, {
      method: "POST",
      cookie: instructor.cookie,
      body: { title: "Second module" },
    });
    assert.equal(firstModuleResponse.status, 201);
    assert.equal(secondModuleResponse.status, 201);
    const firstModule = await firstModuleResponse.json();
    const secondModule = await secondModuleResponse.json();
    const reorderModules = await request(`/modules/course/${educationalCourse.id}/reorder`, {
      method: "PUT",
      cookie: instructor.cookie,
      body: { sectionIds: [secondModule.id, firstModule.id] },
    });
    assert.equal(reorderModules.status, 200);
    assert.deepEqual((await reorderModules.json()).map(({ id }) => id), [secondModule.id, firstModule.id]);

    async function addLesson(title) {
      const response = await request(`/modules/course/${educationalCourse.id}/${firstModule.id}/lessons`, {
        method: "POST",
        cookie: instructor.cookie,
        body: { title, description: "Lesson details", durationSec: 100, isPublished: true },
      });
      assert.equal(response.status, 201);
      return response.json();
    }
    const firstLesson = await addLesson("First lesson");
    const secondLesson = await addLesson("Second lesson");
    const readingLessonResponse = await request(`/modules/course/${educationalCourse.id}/${firstModule.id}/lessons`, {
      method: "POST",
      cookie: instructor.cookie,
      body: { title: "Short reading", durationSec: 0, isPublished: true },
    });
    assert.equal(readingLessonResponse.status, 201);
    const readingLesson = await readingLessonResponse.json();
    const reorderLessons = await request(`/modules/course/${educationalCourse.id}/${firstModule.id}/lessons/reorder`, {
      method: "PUT",
      cookie: instructor.cookie,
      body: { lessonIds: [secondLesson.id, firstLesson.id, readingLesson.id] },
    });
    assert.equal(reorderLessons.status, 200);
    assert.deepEqual((await reorderLessons.json())[0].lessons.map(({ id }) => id), [secondLesson.id, firstLesson.id]);

    const resourceResponse = await request(`/modules/course/${educationalCourse.id}/${firstModule.id}/lessons/${firstLesson.id}/resources`, {
      method: "POST",
      cookie: instructor.cookie,
      body: { title: "Lesson guide", url: "https://example.test/lesson-guide.pdf" },
    });
    assert.equal(resourceResponse.status, 201);
    assert.equal((await resourceResponse.json()).title, "Lesson guide");

    assert.equal((await request(`/admin/courses/${educationalCourse.id}/review`, { method: "POST", cookie: instructor.cookie })).status, 201);
    assert.equal((await request(`/admin/courses/${educationalCourse.id}/publish`, { method: "POST", cookie: instructor.cookie })).status, 403);
    const published = await request(`/admin/courses/${educationalCourse.id}/publish`, { method: "POST", cookie: admin.cookie });
    assert.equal(published.status, 201);
    assert.equal((await published.json()).status, "PUBLISHED");
    const listing = await request(`/courses?search=Integration%20Learning&page=1&limit=5`);
    assert.equal(listing.status, 200);
    const page = await listing.json();
    assert.ok(page.data.some(({ id }) => id === educationalCourse.id));
    assert.equal(page.meta.page, 1);
    assert.ok(page.meta.total >= 1);
    assert.equal((await request(`/courses/${courseSlug}`)).status, 200);

    const assigned = await request(`/admin/courses/${educationalCourse.id}`, {
      method: "PATCH",
      cookie: admin.cookie,
      body: { instructorId: otherInstructor.user.id },
    });
    assert.equal(assigned.status, 200);
    assert.equal((await assigned.json()).instructorId, otherInstructor.user.id);
  });

  await t.test("free enrollment, manual access, and persisted course progress are authorization-checked", async () => {
    const course = educationalCourse;
    const module = await prisma.courseSection.findFirstOrThrow({
      where: { courseId: course.id, lessons: { some: {} } },
    });
    const lessons = await prisma.lesson.findMany({
      where: { sectionId: module.id },
      orderBy: { position: "asc" },
    });
    assert.equal(lessons.length, 3);
    const lesson = lessons[0];
    const enrolled = await request("/enrollments", {
      method: "POST",
      cookie: studentCookie,
      body: { courseId: course.id },
    });
    assert.equal(enrolled.status, 201);
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { userId_courseId: { userId: testUser.id, courseId: course.id } },
      include: { history: true },
    });
    assert.equal(enrollment.source, "FREE");
    assert.equal(enrollment.history.length, 1);

    const learning = await request(`/student/courses/${course.id}/learning`, { cookie: studentCookie });
    assert.equal(learning.status, 200);
    const learningData = await learning.json();
    assert.equal(learningData.course.progress.totalLessons, 3);

    const progressResponse = await request(`/student/lessons/${lesson.id}/progress`, {
      method: "PATCH",
      cookie: studentCookie,
      body: { watchedSeconds: 100, coveredSeconds: 100 },
    });
    assert.equal(progressResponse.status, 200);
    assert.equal((await progressResponse.json()).isComplete, true);
    const secondProgress = await request(`/student/lessons/${lessons[1].id}/progress`, {
      method: "PATCH",
      cookie: studentCookie,
      body: { watchedSeconds: 100, coveredSeconds: 100 },
    });
    assert.equal(secondProgress.status, 200);
    const readingProgress = await request(`/student/lessons/${lessons[2].id}/progress`, {
      method: "PATCH",
      cookie: studentCookie,
      body: { watchedSeconds: 0, coveredSeconds: 0 },
    });
    assert.equal(readingProgress.status, 200);
    const readingProgressResult = await readingProgress.json();
    assert.equal(readingProgressResult.isComplete, true);
    assert.equal(readingProgressResult.progressPercent, 100);
    const courseProgress = await prisma.courseProgress.findUniqueOrThrow({
      where: { userId_courseId: { userId: testUser.id, courseId: course.id } },
    });
    assert.equal(courseProgress.lastLessonId, lessons[2].id);
    assert.ok(courseProgress.lastAccessedAt);
    assert.ok(courseProgress.completedAt);

    const anotherStudent = await createTestAccount("Another Student");
    const anotherStudentCookie = anotherStudent.cookie;
    assert.equal((await request(`/student/courses/${course.id}/learning`, { cookie: anotherStudentCookie })).status, 403);
    assert.equal((await request(`/student/lessons/${lesson.id}/progress`, {
      method: "PATCH",
      cookie: anotherStudentCookie,
      body: { watchedSeconds: 100, coveredSeconds: 100 },
    })).status, 403);

    const manual = await request("/enrollments/manual", {
      method: "POST",
      cookie: integrationAdminCookie,
      body: { userId: anotherStudent.id, courseId: course.id },
    });
    assert.equal(manual.status, 201);
    const manualEnrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { userId_courseId: { userId: anotherStudent.id, courseId: course.id } },
      include: { history: true },
    });
    assert.equal(manualEnrollment.source, "MANUAL");
    assert.equal(manualEnrollment.history.length, 1);
    assert.equal((await request(`/enrollments/${manualEnrollment.id}/revoke`, {
      method: "POST",
      cookie: integrationAdminCookie,
      body: { reason: "Integration revocation" },
    })).status, 201);
    const revokedEnrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { id: manualEnrollment.id },
      include: { history: true },
    });
    assert.equal(revokedEnrollment.status, "REVOKED");
    assert.equal(revokedEnrollment.history.length, 2);
    assert.equal((await request(`/student/courses/${course.id}/learning`, {
      cookie: anotherStudentCookie,
    })).status, 403);
    assert.equal((await request(`/admin/courses/${course.id}`, {
      method: "DELETE",
      cookie: integrationAdminCookie,
    })).status, 409);

    const paidCourseResponse = await request("/admin/courses", {
      method: "POST",
      cookie: integrationAdminCookie,
      body: {
        slug: `integration-paid-${randomUUID()}`,
        title: "Integration Paid Course",
        description: "A paid course used to verify enrollment protection.",
        isFree: false,
        priceToman: 1200,
        estimatedMinutes: 10,
      },
    });
    assert.equal(paidCourseResponse.status, 201);
    const paidCourse = await paidCourseResponse.json();
    const paidModuleResponse = await request(`/modules/course/${paidCourse.id}`, {
      method: "POST",
      cookie: integrationAdminCookie,
      body: { title: "Paid module" },
    });
    assert.equal(paidModuleResponse.status, 201);
    const paidModule = await paidModuleResponse.json();
    const paidLessonResponse = await request(`/modules/course/${paidCourse.id}/${paidModule.id}/lessons`, {
      method: "POST",
      cookie: integrationAdminCookie,
      body: { title: "Paid lesson", durationSec: 100, isPublished: true },
    });
    assert.equal(paidLessonResponse.status, 201);
    assert.equal((await request(`/admin/courses/${paidCourse.id}/publish`, {
      method: "POST",
      cookie: integrationAdminCookie,
    })).status, 201);
    assert.equal((await request("/enrollments", {
      method: "POST",
      cookie: anotherStudentCookie,
      body: { courseId: paidCourse.id },
    })).status, 400);
    const paidEnrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: anotherStudent.id, courseId: paidCourse.id } },
    });
    assert.equal(paidEnrollment, null);

  });
});
