import type { LightbulbIdea } from "@/lib/dabottree-state";

export const IDEAS_STORAGE_KEY = "dabottree:ideas";
export const EXTRAS_STORAGE_KEY = "dabottree:ideaExtras";

function safeAccountScope(): string {
  if (typeof window === "undefined") return "local-preview";
  const email = window.localStorage.getItem("dabottree:accountEmail")?.trim().toLowerCase();
  if (!email) return "local-preview";
  return email.replace(/[^a-z0-9@._-]/g, "_");
}

function scopedStorageKey(baseKey: string): string {
  return `${baseKey}:${safeAccountScope()}`;
}

function readStorage(baseKey: string): string | null {
  if (typeof window === "undefined") return null;
  const scopedKey = scopedStorageKey(baseKey);
  const scopedValue = window.localStorage.getItem(scopedKey);
  if (scopedValue !== null) return scopedValue;

  const legacyValue = window.localStorage.getItem(baseKey);
  if (legacyValue !== null) {
    window.localStorage.setItem(scopedKey, legacyValue);
  }
  return legacyValue;
}

function writeStorage(baseKey: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedStorageKey(baseKey), value);
  // Keep the legacy key synced while older routes still read it directly.
  window.localStorage.setItem(baseKey, value);
}

export function loadPersistedIdeas(
  normalizeIdea?: (idea: LightbulbIdea) => LightbulbIdea,
): LightbulbIdea[] | null {
  try {
    const raw = readStorage(IDEAS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const ideas = parsed as LightbulbIdea[];
    return normalizeIdea ? ideas.map(normalizeIdea) : ideas;
  } catch {
    return null;
  }
}

export function savePersistedIdeas(ideas: LightbulbIdea[]) {
  writeStorage(IDEAS_STORAGE_KEY, JSON.stringify(ideas));
}

export function loadPersistedExtras<T extends Record<string, unknown>>(): T | null {
  try {
    const raw = readStorage(EXTRAS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

export function savePersistedExtras<T extends Record<string, unknown>>(extras: T) {
  writeStorage(EXTRAS_STORAGE_KEY, JSON.stringify(extras));
}
