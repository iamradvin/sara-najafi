import type { Metadata, Viewport } from "next";
import { PwaServiceWorker } from "@/components/pwa-service-worker";
import { PwaInstallProvider } from "@/components/pwa-install-provider";
import { NavigationTransition } from "@/components/navigation-transition";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaraNajafi | آموزش تخصصی زیبایی مو",
  description:
    "آموزش تخصصی رنگ مو، رنگ و مش، لایت، بالیاژ، آمبره، کراتین و احیای مو با سارا نجفی.",
  applicationName: "SaraNajafi",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SaraNajafi",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#200910",
};

const themeInitializationScript = `
  document.documentElement.classList.add("theme-initializing");
  try {
    const savedTheme = localStorage.getItem("attractory-theme");
    const theme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "light" ? "#f8f3f0" : "#200910"
    );
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
  window.addEventListener("load", () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.remove("theme-initializing");
    }));
  }, { once: true });
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <PwaInstallProvider>
          <PwaServiceWorker />
          <NavigationTransition />
          {children}
        </PwaInstallProvider>
      </body>
    </html>
  );
}
