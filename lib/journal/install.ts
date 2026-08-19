// Platform detection for the install flow.
//
// Installing is the difference between "a website I type in" and "an app
// on my phone", so the instructions have to be right for the exact browser
// someone is holding — including the in-app browsers (Instagram, Facebook,
// Gmail) where installing is impossible and the only useful advice is
// "open this in Safari".

export type Platform =
  | "installed"        // already running as an app
  | "ios-safari"       // manual Share → Add to Home Screen
  | "ios-inapp"        // in-app browser: cannot install at all
  | "android-prompt"   // beforeinstallprompt available
  | "android-manual"   // Chrome-like but no prompt fired
  | "desktop"
  | "unsupported";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS marks installed web apps here rather than via display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function detectPlatform(promptAvailable: boolean): Platform {
  if (typeof window === "undefined") return "desktop";
  if (isStandalone()) return "installed";

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  if (isIOS) {
    // These wrappers can't add to the home screen; Safari has to be used.
    const inApp = /FBAN|FBAV|Instagram|Line\/|Twitter|GSA\/|LinkedInApp/i.test(ua);
    if (inApp) return "ios-inapp";
    // Chrome/Firefox/Edge on iOS also can't install (only Safari can).
    if (/CriOS|FxiOS|EdgiOS/i.test(ua)) return "ios-inapp";
    return "ios-safari";
  }

  if (promptAvailable) return "android-prompt";
  if (/Android/i.test(ua)) return "android-manual";
  if (/Chrome|Edg|Brave/i.test(ua)) return "desktop";
  return "unsupported";
}
