import type { SkinProfileInput } from "./supabase";

const PENDING_PROFILE_KEY = "skincare101.pending-profile";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export interface StoredProfileDraft {
  savedAt: number;
  profile: SkinProfileInput;
  name?: string;
}

function defaultDraftName(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `肤质档案 · ${year}-${month}-${day} ${hour}:${minute}`;
}

export function savePendingProfileDraft(profile: SkinProfileInput, name = ""): void {
  localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify({
    savedAt: Date.now(),
    profile,
    name: name.trim() || defaultDraftName(),
  }));
}

export function loadPendingProfileDraftRecord(): StoredProfileDraft | null {
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredProfileDraft;
    if (!stored?.profile || !stored.savedAt || Date.now() - stored.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(PENDING_PROFILE_KEY);
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem(PENDING_PROFILE_KEY);
    return null;
  }
}

export function loadPendingProfileDraft(): SkinProfileInput | null {
  return loadPendingProfileDraftRecord()?.profile || null;
}

export function clearPendingProfileDraft(): void {
  localStorage.removeItem(PENDING_PROFILE_KEY);
}
