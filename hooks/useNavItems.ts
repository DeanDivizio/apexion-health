import { useSyncExternalStore, useCallback } from "react";
import {
  DEFAULT_NAV_KEYS,
  NAV_OPTIONS_BY_KEY,
  STORAGE_KEY,
  type NavOption,
} from "@/lib/nav/navItems";

function getSnapshot(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NAV_KEYS;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed.every((k: unknown) => typeof k === "string" && NAV_OPTIONS_BY_KEY.has(k as string))
    ) {
      return parsed as string[];
    }
  } catch { /* ignore corrupt data */ }
  return DEFAULT_NAV_KEYS;
}

let cachedKeys = DEFAULT_NAV_KEYS;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getClientSnapshot(): string[] {
  const next = getSnapshot();
  if (
    cachedKeys.length === next.length &&
    cachedKeys.every((k, i) => k === next[i])
  ) {
    return cachedKeys;
  }
  cachedKeys = next;
  return cachedKeys;
}

function getServerSnapshot(): string[] {
  return DEFAULT_NAV_KEYS;
}

export function setNavKeys(keys: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  cachedKeys = keys;
  listeners.forEach((cb) => cb());
}

export function useNavKeys(): string[] {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export function useNavItems(): NavOption[] {
  const keys = useNavKeys();
  return keys
    .map((k) => NAV_OPTIONS_BY_KEY.get(k))
    .filter((o): o is NavOption => o !== undefined);
}

export function useSetNavKeys(): (keys: string[]) => void {
  return useCallback((keys: string[]) => setNavKeys(keys), []);
}
