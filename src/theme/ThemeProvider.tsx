import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  accentPreferences,
  accentSwatchClassName,
  DEFAULT_ACCENT,
  type AccentPreference,
  resolveAccentPreference,
} from "./accents.js";
import {
  ACCENT_REVEAL_MS,
  rememberThemePointer,
  revealPaletteChange,
  withInstantPalette,
  type ThemeOrigin,
} from "./themeReveal.js";

export { accentPreferences, accentSwatchClassName, DEFAULT_ACCENT };
export type { AccentPreference, ThemeOrigin };

export const themePreferences = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof themePreferences)[number];
export type ResolvedTheme = Exclude<ThemePreference, "system">;

const DEFAULT_STORAGE_KEY = "loom-ui.theme";
const DEFAULT_ACCENT_STORAGE_KEY = "loom-ui.accent";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference, origin?: ThemeOrigin) => void | Promise<void>;
  accent: AccentPreference;
  setAccent: (accent: AccentPreference, origin?: ThemeOrigin) => void | Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && themePreferences.includes(value as ThemePreference);
}

export function readThemePreference(storageKey = DEFAULT_STORAGE_KEY): ThemePreference {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(storageKey);
  return isThemePreference(stored) ? stored : "dark";
}

export function readAccentPreference(storageKey = DEFAULT_ACCENT_STORAGE_KEY): AccentPreference {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  const stored = window.localStorage.getItem(storageKey);
  return resolveAccentPreference(stored);
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.luiTheme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme === "light" ? "light" : "dark";
  }
  return resolvedTheme;
}

export function applyAccent(accent: AccentPreference): AccentPreference {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.luiAccent = accent;
  }
  return accent;
}

export function ThemeProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
  accentStorageKey = DEFAULT_ACCENT_STORAGE_KEY,
  defaultPreference,
  defaultAccent,
  persist: persistEnabled = true,
}: {
  children: ReactNode;
  storageKey?: string;
  accentStorageKey?: string;
  defaultPreference?: ThemePreference;
  defaultAccent?: AccentPreference;
  persist?: boolean;
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const initial = defaultPreference ?? readThemePreference(storageKey);
    applyTheme(initial);
    return initial;
  });
  const [accent, setAccentState] = useState<AccentPreference>(() => {
    const initial = defaultAccent ?? readAccentPreference(accentStorageKey);
    applyAccent(initial);
    return initial;
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(preference));

  const setPreference = useCallback(
    (nextPreference: ThemePreference, origin?: ThemeOrigin) => {
      const nextResolved = resolveTheme(nextPreference);
      const persist = () => {
        if (persistEnabled && typeof window !== "undefined") window.localStorage.setItem(storageKey, nextPreference);
      };
      const commit = () => {
        setResolvedTheme(nextResolved);
        setPreferenceState(nextPreference);
      };
      if (
        typeof document !== "undefined" &&
        document.documentElement.dataset.luiTheme === nextResolved
      ) {
        persist();
        commit();
        return Promise.resolve();
      }
      return revealPaletteChange(() => {
        applyTheme(nextPreference);
        persist();
        flushSync(commit);
      }, origin);
    },
    [storageKey, persistEnabled],
  );

  const setAccent = useCallback(
    (nextAccent: AccentPreference, origin?: ThemeOrigin) => {
      const persist = () => {
        if (persistEnabled && typeof window !== "undefined")
          window.localStorage.setItem(accentStorageKey, nextAccent);
      };
      if (
        typeof document !== "undefined" &&
        document.documentElement.dataset.luiAccent === nextAccent
      ) {
        persist();
        setAccentState(nextAccent);
        return Promise.resolve();
      }
      setAccentState(nextAccent);
      persist();
      return revealPaletteChange(
        () => {
          applyAccent(nextAccent);
        },
        origin,
        { duration: ACCENT_REVEAL_MS },
      );
    },
    [accentStorageKey, persistEnabled],
  );

  useEffect(() => {
    rememberThemePointer();
  }, []);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia(DARK_MEDIA_QUERY);
    const updateSystemTheme = () => {
      withInstantPalette(() => setResolvedTheme(applyTheme("system")));
    };
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, [preference]);

  useEffect(() => {
    const syncPreference = (event: StorageEvent) => {
      const nextTheme = event.newValue;
      if (event.key === storageKey && isThemePreference(nextTheme)) {
        withInstantPalette(() => setResolvedTheme(applyTheme(nextTheme)));
        setPreferenceState(nextTheme);
      }
      if (event.key === accentStorageKey && event.newValue != null) {
        const nextAccent = resolveAccentPreference(event.newValue);
        withInstantPalette(() => applyAccent(nextAccent));
        setAccentState(nextAccent);
      }
    };
    window.addEventListener("storage", syncPreference);
    return () => window.removeEventListener("storage", syncPreference);
  }, [accentStorageKey, storageKey]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference, accent, setAccent }),
    [accent, preference, resolvedTheme, setAccent, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
