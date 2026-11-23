// src/lib/recentApps.ts
//
// What the home page remembers about the apps on this device: the apps opened
// most recently, whether the user has run an app yet, and whether the "Get
// started" card was dismissed. Browser storage only; every access is guarded
// because storage can be missing or blocked (private windows, tests).

const RECENT_KEY = "vr:recent-apps";
const FIRST_RUN_KEY = "vr:first-app-run";
const DISMISSED_KEY = "vr:get-started-dismissed";
export const RECENT_APPS_LIMIT = 6;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the home page simply forgets */
  }
}

/** Most recent first. */
export function getRecentApps(): string[] {
  try {
    const parsed = JSON.parse(read(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((slug): slug is string => typeof slug === "string") : [];
  } catch {
    return [];
  }
}

export function recordRecentApp(slug: string): void {
  if (!slug) return;
  const next = [slug, ...getRecentApps().filter((entry) => entry !== slug)].slice(0, RECENT_APPS_LIMIT);
  write(RECENT_KEY, JSON.stringify(next));
}

export function hasRunAnApp(): boolean {
  return read(FIRST_RUN_KEY) === "1";
}

export function markAppRun(): void {
  write(FIRST_RUN_KEY, "1");
}

export function isGetStartedDismissed(): boolean {
  return read(DISMISSED_KEY) === "1";
}

export function dismissGetStarted(): void {
  write(DISMISSED_KEY, "1");
}
