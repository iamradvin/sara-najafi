ALTER TYPE "CourseStatus" ADD VALUE IF NOT EXISTS 'REVIEW';
CREATE TYPE "EnrollmentSource" AS ENUM ('FREE', 'MANUAL', 'PAYMENT');

ALTER TABLE "User"
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "avatarUrl" VARCHAR(500);

ALTER TABLE "Course"
  ADD COLUMN "currency" VARCHAR(8) NOT NULL DEFAULT 'TOMAN',
  ADD COLUMN "language" VARCHAR(12) NOT NULL DEFAULT 'fa',
  ADD COLUMN "instructorId" UUID;

CREATE INDEX "Course_instructorId_status_idx" ON "Course"("instructorId", "status");

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Lesson" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Enrollment" ADD COLUMN "source" "EnrollmentSource" NOT NULL DEFAULT 'MANUAL';

CREATE TABLE "LessonResource" (
  "id" UUID NOT NULL,
  "lessonId" UUID NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "url" VARCHAR(1000) NOT NULL,
  "fileName" VARCHAR(255),
  "mimeType" VARCHAR(120),
  "sizeBytes" INTEGER,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonResource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonResource_lessonId_position_key" ON "LessonResource"("lessonId", "position");
CREATE INDEX "LessonResource_lessonId_idx" ON "LessonResource"("lessonId");

ALTER TABLE "LessonResource"
  ADD CONSTRAINT "LessonResource_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EnrollmentHistory" (
  "id" UUID NOT NULL,
  "enrollmentId" UUID NOT NULL,
  "actorId" UUID,
  "status" "EnrollmentStatus" NOT NULL,
  "source" "EnrollmentSource" NOT NULL,
  "reason" VARCHAR(500),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnrollmentHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EnrollmentHistory_enrollmentId_createdAt_idx" ON "EnrollmentHistory"("enrollmentId", "createdAt");
CREATE INDEX "EnrollmentHistory_actorId_createdAt_idx" ON "EnrollmentHistory"("actorId", "createdAt");

ALTER TABLE "EnrollmentHistory"
  ADD CONSTRAINT "EnrollmentHistory_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EnrollmentHistory_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CourseProgress" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "courseId" UUID NOT NULL,
  "lastLessonId" UUID,
  "lastAccessedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(3),
  CONSTRAINT "CourseProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseProgress_userId_courseId_key" ON "CourseProgress"("userId", "courseId");
CREATE INDEX "CourseProgress_userId_lastAccessedAt_idx" ON "CourseProgress"("userId", "lastAccessedAt");

ALTER TABLE "CourseProgress"
  ADD CONSTRAINT "CourseProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CourseProgress_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CourseProgress_lastLessonId_fkey"
  FOREIGN KEY ("lastLessonId") REFERENCES "Lesson"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
