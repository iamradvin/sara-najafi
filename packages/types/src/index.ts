export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

export type PaginatedResponse<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type PublishedCourseSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  level: CourseLevel;
  priceToman: number | null;
  currency: string;
  language: string;
  isFree: boolean;
  estimatedMinutes: number;
  categories: { category: { name: string; slug: string } }[];
  instructor: { id: string; name: string; avatarUrl: string | null } | null;
  _count: { sections: number; enrollments: number };
};

export type PublishedCourseDetails = Omit<PublishedCourseSummary, "_count"> & {
  instructor: {
    id: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
  sections: {
    id: string;
    title: string;
    description: string | null;
    position: number;
    lessons: {
      id: string;
      title: string;
      durationSec: number;
      isPreview: boolean;
      position: number;
    }[];
  }[];
};

export type CourseListQuery = {
  page?: number;
  limit?: number;
  category?: string;
  level?: CourseLevel;
  search?: string;
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
};

export const queueNames = {
  platformHealth: "platform-health",
  sms: "sms",
  email: "email",
  notifications: "notifications",
  videoProcessing: "video-processing",
  certificates: "certificates",
  analytics: "analytics",
  reports: "reports",
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];

export type PlatformHealthJob = {
  kind: "health.check";
  requestedAt: string;
};
