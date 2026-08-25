import type { SkinProfileInput } from "./supabase";

const PENDING_PROFILE_KEY = "skincare101.pending-profile";
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

interface StoredProfileDraft {
  savedAt: number;
  profile: SkinProfileInput;
}

export function savePendingProfileDraft(profile: SkinProfileInput): void {
  localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify({ savedAt: Date.now(), profile }));
}

export function loadPendingProfileDraft(): SkinProfileInput | null {
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredProfileDraft;
    if (!stored?.profile || !stored.savedAt || Date.now() - stored.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(PENDING_PROFILE_KEY);
      return null;
    }
    return stored.profile;
  } catch {
    localStorage.removeItem(PENDING_PROFILE_KEY);
    return null;
  }
}

export function clearPendingProfileDraft(): void {
  localStorage.removeItem(PENDING_PROFILE_KEY);
}
