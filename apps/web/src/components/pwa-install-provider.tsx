"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaInstallContextValue {
  installApp: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

function isAppInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true);
}

function isAppleMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function PwaInstallProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    typeof window !== "undefined" && isAppInstalled(),
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!helpOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setHelpOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [helpOpen]);

  const installApp = useCallback(() => {
    if (installed) {
      setHelpOpen(true);
      return;
    }
    if (!installPrompt) {
      setHelpOpen(true);
      return;
    }

    const prompt = installPrompt;
    setInstallPrompt(null);
    void prompt.prompt().then(() => prompt.userChoice).then((choice) => {
      if (choice.outcome === "accepted") setInstalled(true);
    }).catch((error: unknown) => {
      console.error("SaraNajafi app installation prompt failed", error);
    });
  }, [installed, installPrompt]);

  const help = installed
    ? "این برنامه قبلاً روی دستگاهت نصب شده است."
    : isAppleMobileDevice()
      ? "در Safari روی دکمه‌ی اشتراک‌گذاری بزن و «افزودن به صفحه‌ی اصلی» را انتخاب کن."
      : "از منوی مرورگر گزینه‌ی «نصب برنامه» یا «افزودن به صفحه‌ی اصلی» را انتخاب کن.";

  return (
    <PwaInstallContext.Provider value={{ installApp }}>
      {children}
      {helpOpen && (
        <div
          className="pwa-install-dialog-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setHelpOpen(false);
          }}
        >
          <section
            aria-labelledby="pwa-install-dialog-title"
            aria-modal="true"
            className="pwa-install-dialog"
            dir="rtl"
            role="dialog"
          >
            <button
              aria-label="بستن راهنمای نصب"
              className="pwa-install-dialog__close"
              onClick={() => setHelpOpen(false)}
              ref={closeButtonRef}
              type="button"
            >
              ×
            </button>
            <span aria-hidden="true" className="pwa-install-dialog__icon">
              <svg fill="none" viewBox="0 0 24 24">
                <rect height="20" rx="3" width="14" x="5" y="2" />
                <path d="M12 6v8m-3-3 3 3 3-3m-5 5h4" />
                <path d="M10 19h4" />
              </svg>
            </span>
            <h2 id="pwa-install-dialog-title">{installed ? "اپلیکیشن نصب شده" : "نصب اپلیکیشن"}</h2>
            <p>{help}</p>
          </section>
        </div>
      )}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) throw new Error("usePwaInstall must be used within PwaInstallProvider");
  return context;
}
