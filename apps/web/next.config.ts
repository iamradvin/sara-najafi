import type { NextConfig } from "next";
import { validateWebEnvironment } from "@attractory/config";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
validateWebEnvironment(process.env);

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        basePath: "/sara-najafi",
        images: { unoptimized: true },
      }
    : {}),
  poweredByHeader: false,
};

export default nextConfig;
