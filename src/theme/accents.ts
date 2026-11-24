export const accentPreferences = [
  "sun",
  "orange",
  "sky",
  "mint",
  "grass",
  "violet",
  "rose",
] as const;

export type AccentPreference = (typeof accentPreferences)[number];

export const DEFAULT_ACCENT: AccentPreference = "sun";

export const accentSwatchClassName: Record<AccentPreference, string> = {
  sun: "bg-lui-accent-sun",
  orange: "bg-lui-accent-orange",
  sky: "bg-lui-accent-sky",
  mint: "bg-lui-accent-mint",
  grass: "bg-lui-accent-grass",
  violet: "bg-lui-accent-violet",
  rose: "bg-lui-accent-rose",
};

export function isAccentPreference(value: unknown): value is AccentPreference {
  return typeof value === "string" && accentPreferences.includes(value as AccentPreference);
}

export function resolveAccentPreference(value: unknown): AccentPreference {
  return isAccentPreference(value) ? value : DEFAULT_ACCENT;
}
