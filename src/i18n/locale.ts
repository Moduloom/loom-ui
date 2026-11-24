export const appLocales = ["zh-CN", "en-US"] as const;
export type AppLocale = (typeof appLocales)[number];

const LOCALE_STORAGE_KEY = "loom-ui.locale";

export function normalizeAppLocale(value: string | null | undefined): AppLocale {
  if (value?.toLowerCase().startsWith("en")) return "en-US";
  return "zh-CN";
}

export function readAppLocale(): AppLocale {
  if (typeof window === "undefined") return "zh-CN";
  try {
    return normalizeAppLocale(
      window.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? window.navigator?.language,
    );
  } catch {
    return normalizeAppLocale(window.navigator?.language);
  }
}

export function applyAppLocale(locale: string): AppLocale {
  const normalized = normalizeAppLocale(locale);
  if (typeof window !== "undefined") {
    try {
      window.localStorage?.setItem(LOCALE_STORAGE_KEY, normalized);
    } catch {
      // Storage may be unavailable in privacy mode and DOM-like test environments.
    }
  }
  if (typeof document !== "undefined") document.documentElement.lang = normalized;
  return normalized;
}
