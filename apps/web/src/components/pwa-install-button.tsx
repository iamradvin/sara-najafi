"use client";

import { usePwaInstall } from "@/components/pwa-install-provider";

type PwaInstallButtonProps = Readonly<{ variant: "desktop" | "mobile" }>;

export function PwaInstallButton({ variant }: PwaInstallButtonProps) {
  const { installApp } = usePwaInstall();

  return (
    <button
      aria-label="نصب اپلیکیشن سارا نجفی"
      className={`button button--small button--outline pwa-install-button pwa-install-button--${variant}`}
      onClick={installApp}
      title="نصب اپلیکیشن"
      type="button"
    >
      <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <rect height="18" rx="5" width="18" x="3" y="3" />
        <rect className="pwa-install-button__app-tile" height="4" rx="1.2" width="4" x="7" y="7" />
        <rect className="pwa-install-button__app-tile" height="4" rx="1.2" width="4" x="13" y="7" />
        <rect className="pwa-install-button__app-tile" height="4" rx="1.2" width="4" x="7" y="13" />
        <path d="M15 13v4m-2-2h4" />
      </svg>
      <span>نصب اپ</span>
    </button>
  );
}
