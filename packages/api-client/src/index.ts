import type {
  CourseListQuery,
  PaginatedResponse,
  PublishedCourseDetails,
  PublishedCourseSummary,
} from "@attractory/types";

export type ApiErrorPayload = { message?: string | string[]; statusCode?: number };
export type ApiClientOptions = Omit<RequestInit, "body"> & { body?: BodyInit | null };
export type CourseApi = {
  listPublished(options?: ApiClientOptions): Promise<PaginatedResponse<PublishedCourseSummary>>;
  searchPublished(query: CourseListQuery, options?: ApiClientOptions): Promise<PaginatedResponse<PublishedCourseSummary>>;
  getPublished(slug: string, options?: ApiClientOptions): Promise<PublishedCourseDetails>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: ApiErrorPayload,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient(
  getBaseUrl: () => string,
  fetcher?: typeof fetch,
) {
  const request = fetcher ?? globalThis.fetch.bind(globalThis);

  async function send<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await request(
      `${getBaseUrl().replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`,
      { credentials: "include", ...options, headers },
    );

    if (!response.ok) {
      let payload: ApiErrorPayload | undefined;
      try {
        payload = (await response.json()) as ApiErrorPayload;
      } catch {
        payload = undefined;
      }
      const message = Array.isArray(payload?.message)
        ? payload.message.join("، ")
        : payload?.message ?? `API request failed with status ${response.status}.`;
      throw new ApiError(message, response.status, payload);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  return {
    request: send,
    get: <T>(path: string, options?: ApiClientOptions) => send<T>(path, options),
    post: <T>(path: string, body?: unknown, options: ApiClientOptions = {}) =>
      send<T>(path, {
        ...options,
        method: "POST",
        body: body === undefined ? options.body : JSON.stringify(body),
      }),
    courses: {
      listPublished: (options?: ApiClientOptions) =>
        send<PaginatedResponse<PublishedCourseSummary>>("/courses", options),
      searchPublished: (query: CourseListQuery, options?: ApiClientOptions) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
          if (value !== undefined && value !== "") params.set(key, String(value));
        }
        return send<PaginatedResponse<PublishedCourseSummary>>(
          `/courses${params.size ? `?${params.toString()}` : ""}`,
          options,
        );
      },
      getPublished: (slug: string, options?: ApiClientOptions) =>
        send<PublishedCourseDetails>(`/courses/${encodeURIComponent(slug)}`, options),
    } satisfies CourseApi,
  };
}
