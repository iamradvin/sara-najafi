import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDirectory = path.join(root, "apps/web");
const appDirectory = path.join(webDirectory, ".next/server/app");
const outputDirectory = path.join(root, "out");
const basePath = "/sara-najafi";
const publicRoutes = new Set([
  "/",
  "/about",
  "/courses",
  "/articles/build-a-consistent-workout-habit",
  "/articles/simple-workout-plan-that-lasts",
  "/articles/recovery-is-part-of-training",
  "/design-system",
  "/login",
  "/register",
]);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
const publicDirectory = path.join(webDirectory, "public");
for (const entry of await readdir(publicDirectory, { withFileTypes: true })) {
  if (entry.name === "assets") continue;
  await cp(
    path.join(publicDirectory, entry.name),
    path.join(outputDirectory, entry.name),
    { recursive: true },
  );
}
await cp(
  path.join(webDirectory, ".next/static"),
  path.join(outputDirectory, "_next/static"),
  { recursive: true },
);

async function exportRoute(route, sourceFile) {
  let html = await readFile(sourceFile, "utf8");
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<link\b(?=[^>]*\bas=["']script["'])[^>]*>/gi, "");
  html = html.replace(/\b(href|src)="\/([^"]*)"/g, (match, attribute, value) => {
    const cleanValue = value.replace(/^sara-najafi\/?/, "");
    if (cleanValue.startsWith("_next/") || cleanValue.startsWith("assets/") || cleanValue.startsWith("fonts/")) {
      return `${attribute}="${basePath}/${cleanValue}"`;
    }

    if (attribute === "href") {
      const route = `/${cleanValue.split(/[?#]/, 1)[0]}`.replace(/\/+$/, "") || "/";
      if (publicRoutes.has(route)) {
        return `href="${basePath}${route === "/" ? "/" : `${route}/`}"`;
      }
      return `href="${basePath}/#preview-disabled"`;
    }

    return match;
  });
  html = html.replace(
    /<body([^>]*)>/i,
    '<body$1><aside id="preview-disabled" style="position:fixed;z-index:1000;inset:auto 12px 12px 12px;padding:12px 16px;border:1px solid #7da8d8;border-radius:12px;background:#10243a;color:#fff;text-align:center;font:14px/1.8 sans-serif">پیش‌نمایش عمومی سایت — ورود، خرید و پنل‌ها در این نسخه فعال نیستند.</aside>',
  );

  const destination =
    route === "/"
      ? path.join(outputDirectory, "index.html")
      : path.join(outputDirectory, route.slice(1), "index.html");
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, html);
}

for (const route of publicRoutes) {
  const sourceFile =
    route === "/"
      ? path.join(appDirectory, "index.html")
      : path.join(appDirectory, `${route.slice(1)}.html`);
  await exportRoute(route, sourceFile);
}

const cssDirectory = path.join(outputDirectory, "_next/static");
async function prefixPublicAssetUrls(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await prefixPublicAssetUrls(entryPath);
    } else if (entry.name.endsWith(".css")) {
      const css = await readFile(entryPath, "utf8");
      await writeFile(
        entryPath,
        css.replaceAll("url(/fonts/", `url(${basePath}/fonts/`).replaceAll(
          "url(/assets/",
          `url(${basePath}/assets/`,
        ),
      );
    }
  }
}

await prefixPublicAssetUrls(cssDirectory);
console.log(`Exported ${publicRoutes.size} static routes to ${outputDirectory}`);
