import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iPhone/iPad Safari has no install prompt; people add the app from the Share menu instead. */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export type InstallState = "installed" | "prompt" | "ios" | "manual";

// The browser offers installation once, often before the settings screen exists (during sign-in),
// so keep the offer from the moment the app loads.
let savedPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // shown from our own button instead
    savedPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    savedPrompt = null;
    listeners.forEach((l) => l());
  });
}

/** Whether Dilo can be installed here, and a function that shows the browser's install dialog when it can. */
export function useInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(savedPrompt);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const update = () => {
      setPromptEvent(savedPrompt);
      if (!savedPrompt && isStandalone()) setInstalled(true);
    };
    listeners.add(update);
    return () => void listeners.delete(update);
  }, []);

  const state: InstallState = installed ? "installed" : promptEvent ? "prompt" : isIOS() ? "ios" : "manual";

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setInstalled(true);
    savedPrompt = null;
    setPromptEvent(null);
  };

  return { state, install };
}
