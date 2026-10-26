// ============================================================
// SAVED PROGRESS
// ------------------------------------------------------------
// Remembers which episodes are finished, using the browser's
// localStorage. Some browsers block storage (for example in
// private mode), so every read and write is wrapped in
// try/catch: if it fails, the page still works, it just
// doesn't remember.
// ============================================================

const STORAGE_KEY = "tumaini-completed-episodes";

export function getCompletedEpisodes(): number[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ---------- Presenter settings (auto-play, voice) ----------

export function getSetting(name: string, fallback: boolean): boolean {
  try {
    const saved = window.localStorage.getItem(`tumaini-setting-${name}`);
    return saved === null ? fallback : saved === "true";
  } catch {
    return fallback;
  }
}

export function saveSetting(name: string, value: boolean) {
  try {
    window.localStorage.setItem(`tumaini-setting-${name}`, String(value));
  } catch {
    // Storage blocked - the setting just won't be remembered.
  }
}

export function markEpisodeCompleted(episodeNumber: number) {
  try {
    const done = getCompletedEpisodes();
    if (!done.includes(episodeNumber)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...done, episodeNumber]));
    }
  } catch {
    // Storage blocked - nothing to do.
  }
}
