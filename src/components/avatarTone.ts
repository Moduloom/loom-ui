export function avatarToneIndex(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 8;
}

export function avatarInitial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "?";
}
